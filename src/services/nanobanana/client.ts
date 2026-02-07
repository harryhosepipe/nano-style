import { ApiError } from '../../api/errors';
import type { ImageReference } from '../../schemas/domain';
import { logProviderError, logProviderLatency, nowIso } from '../../telemetry/logger';
import type {
  NanoBananaAdapter,
  NanoBananaGenerateInput,
  NanoBananaGenerationResult,
  NanoBananaStatusInput,
  NanoBananaStatusResult,
} from './index';

const DEFAULT_TIMEOUT_MS = 25000;
const DEFAULT_RETRIES = 2;

export const createNanoBananaAdapter = (): NanoBananaAdapter => ({
  async generate(input: NanoBananaGenerateInput): Promise<NanoBananaGenerationResult> {
    const startedAt = Date.now();
    const baseUrl = import.meta.env.NANOBANANA_API_URL?.trim();
    const apiKey = import.meta.env.NANOBANANA_API_KEY?.trim();
    if (!baseUrl || !apiKey) {
      throw new ApiError('NANOBANANA_ERROR');
    }

    const retries = Number.parseInt(import.meta.env.NANOBANANA_RETRIES ?? '', 10) || DEFAULT_RETRIES;
    for (let attempt = 1; attempt <= retries; attempt += 1) {
      try {
        const payload = await fetchJsonWithTimeout(`${baseUrl.replace(/\/$/, '')}/generate`, {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({ prompt: input.prompt }),
        });
        const normalized = normalizeGenerate(payload);
        logProviderLatency({
          ts: nowIso(),
          level: 'info',
          event: 'provider_call_completed',
          requestId: input.requestId,
          sessionId: input.sessionId,
          provider: 'nanobanana',
          operation: 'generate',
          latencyMs: Date.now() - startedAt,
          providerStatus: 'success',
          attempt,
        });
        return normalized;
      } catch (error) {
        const timeout = error instanceof ApiError && error.code === 'PROVIDER_TIMEOUT';
        logProviderError({
          ts: nowIso(),
          level: 'error',
          event: 'provider_call_failed',
          requestId: input.requestId,
          sessionId: input.sessionId,
          provider: 'nanobanana',
          operation: 'generate',
          latencyMs: Date.now() - startedAt,
          errorCode: timeout ? 'PROVIDER_TIMEOUT' : 'NANOBANANA_ERROR',
          providerStatus: timeout ? 'timeout' : 'error',
          attempt,
        });

        if (attempt >= retries) {
          if (error instanceof ApiError) {
            throw error;
          }
          throw new ApiError('NANOBANANA_ERROR');
        }
      }
    }

    throw new ApiError('NANOBANANA_ERROR');
  },

  async getStatus(input: NanoBananaStatusInput): Promise<NanoBananaStatusResult> {
    const baseUrl = import.meta.env.NANOBANANA_API_URL?.trim();
    const apiKey = import.meta.env.NANOBANANA_API_KEY?.trim();
    if (!baseUrl || !apiKey) {
      throw new ApiError('NANOBANANA_ERROR');
    }

    const payload = await fetchJsonWithTimeout(`${baseUrl.replace(/\/$/, '')}/jobs/${encodeURIComponent(input.jobId)}`, {
      method: 'GET',
      headers: {
        authorization: `Bearer ${apiKey}`,
      },
    });

    const status = asString(payload.status);
    if (status === 'pending' || status === 'queued' || status === 'processing') {
      return { status: 'pending', pollAfterMs: asNumber(payload.pollAfterMs) ?? 2000 };
    }

    const completed = normalizeImage(payload);
    if (completed) {
      return { status: 'completed', image: completed };
    }

    return { status: 'failed', retryable: true, code: 'NANOBANANA_ERROR' };
  },
});

const fetchJsonWithTimeout = async (url: string, init: RequestInit): Promise<Record<string, unknown>> => {
  const timeoutMs = Number.parseInt(import.meta.env.NANOBANANA_TIMEOUT_MS ?? '', 10) || DEFAULT_TIMEOUT_MS;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, { ...init, signal: controller.signal });
    if (!response.ok) {
      throw new ApiError('NANOBANANA_ERROR');
    }
    const payload = (await response.json()) as unknown;
    if (!payload || typeof payload !== 'object') {
      throw new ApiError('NANOBANANA_ERROR');
    }
    return payload as Record<string, unknown>;
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new ApiError('PROVIDER_TIMEOUT');
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
};

const normalizeGenerate = (payload: Record<string, unknown>): NanoBananaGenerationResult => {
  const image = normalizeImage(payload);
  if (image) {
    return { kind: 'completed_sync', image, providerRequestId: asString(payload.requestId) ?? undefined };
  }

  const jobId = asString(payload.jobId);
  if (jobId) {
    return { kind: 'accepted_async', jobId, pollAfterMs: asNumber(payload.pollAfterMs) ?? 2000 };
  }

  throw new ApiError('NANOBANANA_ERROR');
};

const normalizeImage = (payload: Record<string, unknown>): ImageReference | null => {
  const url = asString(payload.imageUrl) ?? asString(payload.url);
  if (url) {
    return {
      type: 'url',
      url,
      mimeType: asString(payload.mimeType) ?? undefined,
    };
  }

  const base64 = asString(payload.imageBase64) ?? asString(payload.base64);
  if (base64) {
    return {
      type: 'base64',
      base64,
      mimeType: asString(payload.mimeType) ?? 'image/png',
    };
  }
  return null;
};

const asString = (value: unknown): string | null => (typeof value === 'string' && value.trim().length > 0 ? value : null);
const asNumber = (value: unknown): number | null => (typeof value === 'number' && Number.isFinite(value) ? value : null);
