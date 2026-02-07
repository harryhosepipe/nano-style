import type { ImageReference } from '../../schemas/domain';

export type NanoBananaGenerateInput = {
  prompt: string;
  requestId: string;
  sessionId: string;
};

export type NanoBananaGenerationAccepted = {
  kind: 'accepted_async';
  jobId: string;
  pollAfterMs: number;
};

export type NanoBananaGenerationCompleted = {
  kind: 'completed_sync';
  image: ImageReference;
  providerRequestId?: string;
};

export type NanoBananaGenerationResult = NanoBananaGenerationAccepted | NanoBananaGenerationCompleted;

export type NanoBananaStatusInput = {
  jobId: string;
  requestId: string;
  sessionId: string;
};

export type NanoBananaStatusResult =
  | { status: 'pending'; pollAfterMs: number }
  | { status: 'completed'; image: ImageReference }
  | { status: 'failed'; retryable: boolean; code: 'NANOBANANA_ERROR' | 'PROVIDER_TIMEOUT' };

export type NanoBananaAdapter = {
  generate(input: NanoBananaGenerateInput): Promise<NanoBananaGenerationResult>;
  getStatus(input: NanoBananaStatusInput): Promise<NanoBananaStatusResult>;
};
