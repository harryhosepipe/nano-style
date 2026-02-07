import { z } from 'zod';

export const SessionStatusSchema = z.enum([
  'template_selected',
  'initial_input_collected',
  'refinement_q1',
  'refinement_q2',
  'refinement_q3',
  'ready_to_generate',
  'generating',
  'result_ready',
  'error',
]);

export const QuestionIndexSchema = z.union([z.literal(1), z.literal(2), z.literal(3)]);

export const ISODateTimeSchema = z.iso.datetime({ offset: true });

export const TemplateSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().min(1),
  initialInputLabel: z.string().min(1),
  questionCount: z.literal(3),
  createdAt: ISODateTimeSchema,
  updatedAt: ISODateTimeSchema,
});

export const TemplateCatalogSchema = z.array(TemplateSchema).min(1);

export const SessionAnswerSchema = z.object({
  questionIndex: QuestionIndexSchema,
  answer: z.string().min(1),
  sparseRetryUsed: z.boolean(),
  answeredAt: ISODateTimeSchema,
});

export const ImageReferenceSchema = z.union([
  z.object({
    type: z.literal('url'),
    url: z.url(),
    mimeType: z.string().min(1).optional(),
  }),
  z.object({
    type: z.literal('base64'),
    base64: z.string().min(1),
    mimeType: z.string().min(1),
  }),
]);

export const SessionStateSchema = z.object({
  sessionId: z.string().min(1),
  templateId: z.string().min(1),
  initialInput: z.string().min(1),
  answers: z.array(SessionAnswerSchema).max(3),
  questionIndex: QuestionIndexSchema,
  status: SessionStatusSchema,
  createdAt: ISODateTimeSchema,
  lastUpdatedAt: ISODateTimeSchema,
  lastImage: ImageReferenceSchema.optional(),
});

export type SessionStatus = z.infer<typeof SessionStatusSchema>;
export type QuestionIndex = z.infer<typeof QuestionIndexSchema>;
export type Template = z.infer<typeof TemplateSchema>;
export type SessionAnswer = z.infer<typeof SessionAnswerSchema>;
export type ImageReference = z.infer<typeof ImageReferenceSchema>;
export type SessionState = z.infer<typeof SessionStateSchema>;
