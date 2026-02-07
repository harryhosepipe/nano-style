import type { QuestionIndex } from '../../schemas/domain';

export type OpenAINextQuestionInput = {
  templateId: string;
  initialInput: string;
  existingAnswers: Array<{ questionIndex: QuestionIndex; answer: string }>;
  targetQuestionIndex: QuestionIndex;
  requestId: string;
};

export type OpenAINextQuestionResult = {
  questionText: string;
};

export type OpenAISynthesisInput = {
  templateId: string;
  initialInput: string;
  answers: [string, string, string];
  requestId: string;
};

export type OpenAISynthesisResult = {
  nanobananaPrompt: string;
  model: string;
};

export type OpenAITextSynthesisInput = {
  text: string;
  imageDataUrl?: string;
  requestId: string;
};

export type OpenAIAdapter = {
  nextQuestion(input: OpenAINextQuestionInput): Promise<OpenAINextQuestionResult>;
  synthesizePrompt(input: OpenAISynthesisInput): Promise<OpenAISynthesisResult>;
  synthesizeText(input: OpenAITextSynthesisInput): Promise<OpenAISynthesisResult>;
};
