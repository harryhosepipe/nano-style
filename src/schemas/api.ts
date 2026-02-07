import { z } from 'zod';

import { ImageReferenceSchema, QuestionIndexSchema, TemplateCatalogSchema } from './domain';

export const RequestIdHeaderSchema = z.string().min(8).max(128);

export const ErrorCodeSchema = z.enum([
  'VALIDATION_ERROR',
  'SESSION_NOT_FOUND',
  'OPENAI_ERROR',
  'SYNTHESIS_PARSE_ERROR',
  'NANOBANANA_ERROR',
  'PROVIDER_TIMEOUT',
  'INTERNAL_ERROR',
]);

export const ErrorResponseSchema = z.object({
  ok: z.literal(false),
  requestId: RequestIdHeaderSchema,
  error: z.object({
    code: ErrorCodeSchema,
    message: z.string().min(1),
    retryable: z.boolean().default(false),
  }),
});

export const TemplatesSuccessResponseSchema = z.object({
  ok: z.literal(true),
  requestId: RequestIdHeaderSchema,
  templates: TemplateCatalogSchema,
});

export const TemplatesResponseSchema = z.union([TemplatesSuccessResponseSchema, ErrorResponseSchema]);

export const SessionStartRequestSchema = z.object({
  templateId: z.string().min(1),
  initial: z.string().min(1),
});

export const SessionStartSuccessResponseSchema = z.object({
  ok: z.literal(true),
  requestId: RequestIdHeaderSchema,
  sessionId: z.string().min(1),
  questionIndex: z.literal(1),
  questionText: z.string().min(1),
});

export const SessionStartResponseSchema = z.union([SessionStartSuccessResponseSchema, ErrorResponseSchema]);

export const SessionAnswerRequestSchema = z.object({
  sessionId: z.string().min(1),
  answer: z.string().min(1),
  editFromQuestionIndex: QuestionIndexSchema.optional(),
});

export const SessionAnswerNextResponseSchema = z.object({
  ok: z.literal(true),
  requestId: RequestIdHeaderSchema,
  done: z.literal(false),
  questionIndex: QuestionIndexSchema,
  questionText: z.string().min(1),
});

export const SessionAnswerDoneResponseSchema = z.object({
  ok: z.literal(true),
  requestId: RequestIdHeaderSchema,
  done: z.literal(true),
});

export const SessionAnswerSuccessResponseSchema = z.union([
  SessionAnswerNextResponseSchema,
  SessionAnswerDoneResponseSchema,
]);

export const SessionAnswerResponseSchema = z.union([SessionAnswerSuccessResponseSchema, ErrorResponseSchema]);

export const GenerateRequestSchema = z.object({
  sessionId: z.string().min(1),
});

export const GenerateSuccessResponseSchema = z.object({
  ok: z.literal(true),
  requestId: RequestIdHeaderSchema,
  image: ImageReferenceSchema,
});

export const GenerateResponseSchema = z.union([GenerateSuccessResponseSchema, ErrorResponseSchema]);

export const SessionResetRequestSchema = z.object({
  sessionId: z.string().min(1).optional(),
});

export const SessionResetSuccessResponseSchema = z.object({
  ok: z.literal(true),
  requestId: RequestIdHeaderSchema,
  reset: z.literal(true),
});

export const SessionResetResponseSchema = z.union([SessionResetSuccessResponseSchema, ErrorResponseSchema]);

export type ErrorCode = z.infer<typeof ErrorCodeSchema>;
export type ApiErrorResponse = z.infer<typeof ErrorResponseSchema>;
export type TemplatesSuccessResponse = z.infer<typeof TemplatesSuccessResponseSchema>;
export type SessionStartRequest = z.infer<typeof SessionStartRequestSchema>;
export type SessionStartSuccessResponse = z.infer<typeof SessionStartSuccessResponseSchema>;
export type SessionAnswerRequest = z.infer<typeof SessionAnswerRequestSchema>;
export type SessionAnswerSuccessResponse = z.infer<typeof SessionAnswerSuccessResponseSchema>;
export type GenerateRequest = z.infer<typeof GenerateRequestSchema>;
export type GenerateSuccessResponse = z.infer<typeof GenerateSuccessResponseSchema>;
export type SessionResetRequest = z.infer<typeof SessionResetRequestSchema>;
export type SessionResetSuccessResponse = z.infer<typeof SessionResetSuccessResponseSchema>;
