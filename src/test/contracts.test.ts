import { describe, expect, it } from 'vitest';

import { REQUEST_ID_HEADER, SESSION_COOKIE_NAME } from '../api/contracts';
import {
  ErrorResponseSchema,
  GenerateResponseSchema,
  SessionAnswerResponseSchema,
  SessionStartRequestSchema,
} from '../schemas/api';
import { SessionStateSchema, TemplateSchema } from '../schemas/domain';
import { FunnelEventSchema, ProviderErrorLogSchema } from '../schemas/telemetry';

describe('domain schemas', () => {
  it('validates template and session state', () => {
    expect(
      TemplateSchema.parse({
        id: 'general-cinematic',
        name: 'General Cinematic',
        description: 'Product/lifestyle refinement flow',
        initialInputLabel: 'What are we creating?',
        questionCount: 3,
        createdAt: '2026-02-07T12:00:00+00:00',
        updatedAt: '2026-02-07T12:00:00+00:00',
      }).id,
    ).toBe('general-cinematic');

    expect(
      SessionStateSchema.parse({
        sessionId: 'sess_123',
        templateId: 'general-cinematic',
        initialInput: 'Luxury skincare on marble',
        answers: [
          {
            questionIndex: 1,
            answer: 'Skincare bottle in morning bathroom scene',
            sparseRetryUsed: false,
            answeredAt: '2026-02-07T12:00:00+00:00',
          },
        ],
        questionIndex: 2,
        status: 'refinement_q2',
        createdAt: '2026-02-07T12:00:00+00:00',
        lastUpdatedAt: '2026-02-07T12:00:02+00:00',
      }).status,
    ).toBe('refinement_q2');
  });
});

describe('api schemas', () => {
  it('rejects invalid session start request', () => {
    const invalid = SessionStartRequestSchema.safeParse({ templateId: '', initial: '' });
    expect(invalid.success).toBe(false);
  });

  it('accepts success and failure response variants', () => {
    expect(
      SessionAnswerResponseSchema.parse({
        ok: true,
        requestId: 'req_12345678',
        done: false,
        questionIndex: 2,
        questionText: 'What is the lighting direction?',
      }).ok,
    ).toBe(true);

    expect(
      GenerateResponseSchema.parse({
        ok: false,
        requestId: 'req_12345678',
        error: {
          code: 'NANOBANANA_ERROR',
          message: 'Image generation failed. Try generate again.',
          retryable: true,
        },
      }).ok,
    ).toBe(false);
  });

  it('exports stable envelope constants', () => {
    expect(REQUEST_ID_HEADER).toBe('x-request-id');
    expect(SESSION_COOKIE_NAME).toBe('nanostyle.sid');
  });

  it('validates error envelope shape', () => {
    expect(
      ErrorResponseSchema.parse({
        ok: false,
        requestId: 'req_12345678',
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Please check your input and try again.',
          retryable: false,
        },
      }).error.code,
    ).toBe('VALIDATION_ERROR');
  });
});

describe('telemetry schemas', () => {
  it('validates funnel event payloads', () => {
    expect(
      FunnelEventSchema.parse({
        event: 'image_failed',
        requestId: 'req_12345678',
        sessionId: 'sess_123',
        errorCode: 'NANOBANANA_ERROR',
        latencyMs: 1024,
        ts: '2026-02-07T12:00:00+00:00',
      }).event,
    ).toBe('image_failed');
  });

  it('validates provider log payloads', () => {
    expect(
      ProviderErrorLogSchema.parse({
        ts: '2026-02-07T12:00:00+00:00',
        level: 'error',
        event: 'provider_call_failed',
        requestId: 'req_12345678',
        sessionId: 'sess_123',
        provider: 'openai',
        operation: 'synthesize_prompt',
        errorCode: 'OPENAI_ERROR',
        providerStatus: 'error',
        attempt: 1,
      }).provider,
    ).toBe('openai');
  });
});
