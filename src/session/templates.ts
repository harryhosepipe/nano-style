import type { Template } from '../schemas/domain';

const CREATED_AT = '2026-02-07T12:00:00+00:00';

export const TEMPLATE_CATALOG: Template[] = [
  {
    id: 'general-cinematic',
    name: 'General Cinematic',
    description: 'Refines initial idea into a NanoBanana-ready cinematic prompt.',
    initialInputLabel: 'What do you want to create?',
    questionCount: 3,
    createdAt: CREATED_AT,
    updatedAt: CREATED_AT,
  },
];

export const findTemplateById = (templateId: string): Template | undefined =>
  TEMPLATE_CATALOG.find((template) => template.id === templateId);
