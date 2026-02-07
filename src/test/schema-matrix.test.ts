import { describe, expect, it } from 'vitest';

import {
  ErrorResponseSchema,
  GenerateRequestSchema,
  GenerateSuccessResponseSchema,
  SessionAnswerDoneResponseSchema,
  SessionAnswerNextResponseSchema,
  SessionAnswerRequestSchema,
  SessionResetRequestSchema,
  SessionResetSuccessResponseSchema,
  SessionStartRequestSchema,
  SessionStartSuccessResponseSchema,
  TemplatesSuccessResponseSchema,
} from '../schemas/api';

describe('schema validation matrix', () => {
  it('validates canonical success envelopes across endpoints', () => {
    expect(
      TemplatesSuccessResponseSchema.safeParse({
        ok: true,
        requestId: 'req_12345678',
        templates: [
          {
            id: 'general-cinematic',
            name: 'General Cinematic',
            description: 'Product/lifestyle refinement flow',
            initialInputLabel: 'What are we creating?',
            questionCount: 3,
            createdAt: '2026-02-07T12:00:00+00:00',
            updatedAt: '2026-02-07T12:00:00+00:00',
          },
        ],
      }).success,
    ).toBe(true);

    expect(
      SessionStartSuccessResponseSchema.safeParse({
        ok: true,
        requestId: 'req_12345678',
        sessionId: 'sess_123',
        questionIndex: 1,
        questionText: 'What are we generating?',
      }).success,
    ).toBe(true);

    expect(
      SessionAnswerNextResponseSchema.safeParse({
        ok: true,
        requestId: 'req_12345678',
        done: false,
        questionIndex: 2,
        questionText: 'What is the lighting?',
      }).success,
    ).toBe(true);

    expect(
      SessionAnswerDoneResponseSchema.safeParse({
        ok: true,
        requestId: 'req_12345678',
        done: true,
      }).success,
    ).toBe(true);

    expect(
      GenerateSuccessResponseSchema.safeParse({
        ok: true,
        requestId: 'req_12345678',
        image: { type: 'url', url: 'https://cdn.example.com/result.png' },
      }).success,
    ).toBe(true);

    expect(
      SessionResetSuccessResponseSchema.safeParse({
        ok: true,
        requestId: 'req_12345678',
        reset: true,
      }).success,
    ).toBe(true);
  });

  it('rejects malformed requests across endpoint matrix', () => {
    expect(SessionStartRequestSchema.safeParse({ templateId: '', initial: '' }).success).toBe(false);
    expect(SessionAnswerRequestSchema.safeParse({ sessionId: '', answer: '' }).success).toBe(false);
    expect(GenerateRequestSchema.safeParse({ sessionId: '' }).success).toBe(false);
    expect(SessionResetRequestSchema.safeParse({ sessionId: 42 }).success).toBe(false);
  });

  it('validates canonical error envelope matrix', () => {
    const errorCodes = [
      'VALIDATION_ERROR',
      'SESSION_NOT_FOUND',
      'OPENAI_ERROR',
      'SYNTHESIS_PARSE_ERROR',
      'NANOBANANA_ERROR',
      'PROVIDER_TIMEOUT',
      'INTERNAL_ERROR',
    ] as const;

    for (const code of errorCodes) {
      expect(
        ErrorResponseSchema.safeParse({
          ok: false,
          requestId: 'req_12345678',
          error: {
            code,
            message: 'safe message',
            retryable: code !== 'VALIDATION_ERROR' && code !== 'SESSION_NOT_FOUND',
          },
        }).success,
      ).toBe(true);
    }
  });
});
