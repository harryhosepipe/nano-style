import type { ErrorCode } from '../schemas/api';
import {
  FunnelEventSchema,
  ProviderErrorLogSchema,
  ProviderLatencyLogSchema,
  type FunnelEvent,
  type ProviderErrorLog,
  type ProviderLatencyLog,
} from '../schemas/telemetry';

export const logFunnelEvent = (event: FunnelEvent): void => {
  const payload = FunnelEventSchema.parse(event);
  console.log(JSON.stringify({ type: 'funnel', ...payload }));
};

export const logProviderLatency = (event: ProviderLatencyLog): void => {
  const payload = ProviderLatencyLogSchema.parse(event);
  console.log(JSON.stringify({ type: 'provider_latency', ...payload }));
};

export const logProviderError = (event: ProviderErrorLog): void => {
  const payload = ProviderErrorLogSchema.parse(event);
  console.warn(JSON.stringify({ type: 'provider_error', ...payload }));
};

export const nowIso = (): string => new Date().toISOString();

export const mapProviderErrorCode = (provider: 'openai' | 'nanobanana', timeout = false): ErrorCode => {
  if (timeout) {
    return 'PROVIDER_TIMEOUT';
  }
  return provider === 'openai' ? 'OPENAI_ERROR' : 'NANOBANANA_ERROR';
};
