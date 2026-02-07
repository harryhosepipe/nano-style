import type { ErrorCode } from '../schemas/api';

const DEFAULT_MESSAGES: Record<ErrorCode, string> = {
  VALIDATION_ERROR: 'Please check your input and try again.',
  SESSION_NOT_FOUND: 'Your session expired. Start again to continue.',
  OPENAI_ERROR: "We couldn't refine right now. Please try again.",
  SYNTHESIS_PARSE_ERROR: 'We hit a formatting issue. Please retry.',
  NANOBANANA_ERROR: 'Image generation failed. Try generate again.',
  PROVIDER_TIMEOUT: 'The request timed out. Please retry.',
  INTERNAL_ERROR: 'Something went wrong. Please try again.',
};

const DEFAULT_RETRYABLE: Record<ErrorCode, boolean> = {
  VALIDATION_ERROR: false,
  SESSION_NOT_FOUND: false,
  OPENAI_ERROR: true,
  SYNTHESIS_PARSE_ERROR: true,
  NANOBANANA_ERROR: true,
  PROVIDER_TIMEOUT: true,
  INTERNAL_ERROR: true,
};

export class ApiError extends Error {
  readonly code: ErrorCode;
  readonly retryable: boolean;
  readonly status: number;

  constructor(code: ErrorCode, status?: number, message?: string, retryable?: boolean) {
    super(message ?? DEFAULT_MESSAGES[code]);
    this.code = code;
    this.retryable = retryable ?? DEFAULT_RETRYABLE[code];
    this.status = status ?? defaultStatus(code);
  }
}

export const isApiError = (value: unknown): value is ApiError => value instanceof ApiError;

export const defaultErrorMessage = (code: ErrorCode): string => DEFAULT_MESSAGES[code];

function defaultStatus(code: ErrorCode): number {
  switch (code) {
    case 'VALIDATION_ERROR':
      return 400;
    case 'SESSION_NOT_FOUND':
      return 404;
    case 'OPENAI_ERROR':
    case 'SYNTHESIS_PARSE_ERROR':
    case 'NANOBANANA_ERROR':
    case 'PROVIDER_TIMEOUT':
      return 502;
    case 'INTERNAL_ERROR':
      return 500;
  }
}
