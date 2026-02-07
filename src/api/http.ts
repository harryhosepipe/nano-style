import type { APIContext } from 'astro';

import { REQUEST_ID_HEADER } from './contracts';
import { ApiError, defaultErrorMessage, isApiError } from './errors';
import type { ErrorCode } from '../schemas/api';

export const getRequestId = (context: APIContext): string => {
  const candidate = (context.locals as Record<string, unknown>).requestId;
  if (typeof candidate === 'string' && candidate.length > 0) {
    return candidate;
  }
  return createRequestId();
};

export const parseJsonBody = async <T>(context: APIContext): Promise<T> => {
  try {
    return (await context.request.json()) as T;
  } catch {
    throw new ApiError('VALIDATION_ERROR');
  }
};

export const jsonSuccess = (context: APIContext, data: Record<string, unknown>, status = 200): Response => {
  if (containsDisallowedPromptField(data)) {
    throw new ApiError('INTERNAL_ERROR', 500, 'Unexpected response shape.', false);
  }
  const requestId = getRequestId(context);
  return new Response(JSON.stringify({ ok: true, requestId, ...data }), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      [REQUEST_ID_HEADER]: requestId,
    },
  });
};

const containsDisallowedPromptField = (value: unknown): boolean => {
  if (value === null || value === undefined) {
    return false;
  }
  if (Array.isArray(value)) {
    return value.some((item) => containsDisallowedPromptField(item));
  }
  if (typeof value !== 'object') {
    return false;
  }

  return Object.entries(value as Record<string, unknown>).some(([key, nestedValue]) => {
    const lowered = key.toLowerCase();
    if (lowered === 'prompt' || lowered.endsWith('_prompt') || lowered.endsWith('prompt')) {
      return true;
    }
    return containsDisallowedPromptField(nestedValue);
  });
};

export const jsonError = (context: APIContext, code: ErrorCode, message?: string, retryable?: boolean): Response => {
  const requestId = getRequestId(context);
  const apiError = new ApiError(code, undefined, message, retryable);
  return new Response(
    JSON.stringify({
      ok: false,
      requestId,
      error: {
        code,
        message: message ?? defaultErrorMessage(code),
        retryable: retryable ?? apiError.retryable,
      },
    }),
    {
      status: apiError.status,
      headers: {
        'content-type': 'application/json; charset=utf-8',
        [REQUEST_ID_HEADER]: requestId,
      },
    },
  );
};

export const handleRouteError = (context: APIContext, error: unknown): Response => {
  if (isApiError(error)) {
    return jsonError(context, error.code, error.message, error.retryable);
  }
  return jsonError(context, 'INTERNAL_ERROR');
};

const createRequestId = (): string => `req_${crypto.randomUUID().replaceAll('-', '')}`;
