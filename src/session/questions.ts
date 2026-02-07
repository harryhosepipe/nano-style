export const CANONICAL_QUESTIONS = [
  "What are we generating (product/lifestyle) and what's the moment? (subject + action + setting)",
  "What's the lighting scenario? (golden hour backlight / soft window light / controlled side light / practicals)",
  'Give 3-5 vibe words + any must-haves (colors/props/text/no-text) to keep it authentic.',
] as const;

export const DEFAULT_ANSWERS = [
  'A premium product hero moment in a believable everyday setting.',
  'Soft directional natural light with gentle contrast.',
  'Clean, modern, tactile, editorial, no visible text overlays.',
] as const;

export const getQuestionText = (questionIndex: 1 | 2 | 3): string => CANONICAL_QUESTIONS[questionIndex - 1];
export const getDefaultAnswer = (questionIndex: 1 | 2 | 3): string => DEFAULT_ANSWERS[questionIndex - 1];
