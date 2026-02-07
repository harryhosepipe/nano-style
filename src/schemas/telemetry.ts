import { z } from 'zod';

import { ErrorCodeSchema, RequestIdHeaderSchema } from './api';
import { ISODateTimeSchema, QuestionIndexSchema } from './domain';

const SessionIdSchema = z.string().min(1);

const BaseEventSchema = z.object({
  requestId: RequestIdHeaderSchema,
  sessionId: SessionIdSchema,
  ts: ISODateTimeSchema,
});

export const SessionStartedEventSchema = BaseEventSchema.extend({
  event: z.literal('session_started'),
  templateId: z.string().min(1),
});

export const RefinementAnsweredEventSchema = BaseEventSchema.extend({
  event: z.literal('refinement_answered'),
  questionIndex: QuestionIndexSchema,
});

export const RefinementCompletedEventSchema = BaseEventSchema.extend({
  event: z.literal('refinement_completed'),
  questionsCount: z.literal(3),
});

export const SynthesisRequestedEventSchema = BaseEventSchema.extend({
  event: z.literal('synthesis_requested'),
});

export const SynthesisSucceededEventSchema = BaseEventSchema.extend({
  event: z.literal('synthesis_succeeded'),
  latencyMs: z.number().int().nonnegative(),
});

export const GenerationRequestedEventSchema = BaseEventSchema.extend({
  event: z.literal('generation_requested'),
});

export const ImageSucceededEventSchema = BaseEventSchema.extend({
  event: z.literal('image_succeeded'),
  latencyMs: z.number().int().nonnegative(),
});

export const ImageFailedEventSchema = BaseEventSchema.extend({
  event: z.literal('image_failed'),
  errorCode: ErrorCodeSchema,
  latencyMs: z.number().int().nonnegative(),
});

export const FunnelEventSchema = z.discriminatedUnion('event', [
  SessionStartedEventSchema,
  RefinementAnsweredEventSchema,
  RefinementCompletedEventSchema,
  SynthesisRequestedEventSchema,
  SynthesisSucceededEventSchema,
  GenerationRequestedEventSchema,
  ImageSucceededEventSchema,
  ImageFailedEventSchema,
]);

export const ProviderLatencyLogSchema = z.object({
  ts: ISODateTimeSchema,
  level: z.enum(['info', 'warn', 'error']),
  event: z.literal('provider_call_completed'),
  requestId: RequestIdHeaderSchema,
  sessionId: SessionIdSchema.optional(),
  provider: z.enum(['openai', 'nanobanana']),
  operation: z.string().min(1),
  latencyMs: z.number().int().nonnegative(),
  providerStatus: z.enum(['success', 'error', 'timeout']),
  attempt: z.number().int().min(1),
});

export const ProviderErrorLogSchema = z.object({
  ts: ISODateTimeSchema,
  level: z.enum(['warn', 'error']),
  event: z.literal('provider_call_failed'),
  requestId: RequestIdHeaderSchema,
  sessionId: SessionIdSchema.optional(),
  provider: z.enum(['openai', 'nanobanana']),
  operation: z.string().min(1),
  latencyMs: z.number().int().nonnegative().optional(),
  errorCode: ErrorCodeSchema,
  providerStatus: z.enum(['error', 'timeout']),
  attempt: z.number().int().min(1),
});

export type FunnelEvent = z.infer<typeof FunnelEventSchema>;
export type ProviderLatencyLog = z.infer<typeof ProviderLatencyLogSchema>;
export type ProviderErrorLog = z.infer<typeof ProviderErrorLogSchema>;
