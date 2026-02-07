import { ApiError } from '../../api/errors';
import { logProviderError, logProviderLatency, mapProviderErrorCode, nowIso } from '../../telemetry/logger';
import { getDefaultAnswer } from '../../session/questions';
import type {
  OpenAIAdapter,
  OpenAINextQuestionInput,
  OpenAINextQuestionResult,
  OpenAISynthesisInput,
  OpenAISynthesisResult,
} from './index';

const OPENAI_URL = 'https://api.openai.com/v1/responses';
const DEFAULT_OPENAI_MODEL = 'gpt-4.1-mini';
const DEFAULT_PROMPT_CAP_CHARS = 1200;

export const createOpenAIAdapter = (): OpenAIAdapter => ({
  async nextQuestion(input: OpenAINextQuestionInput): Promise<OpenAINextQuestionResult> {
    return { questionText: getFixedQuestion(input.targetQuestionIndex) };
  },

  async synthesizePrompt(input: OpenAISynthesisInput): Promise<OpenAISynthesisResult> {
    const startedAt = Date.now();
    const promptCap = Number.parseInt(import.meta.env.PROMPT_MAX_CHARS ?? '', 10) || DEFAULT_PROMPT_CAP_CHARS;
    const normalizedAnswers = input.answers.map((answer, index) =>
      answer.trim().length > 0 ? answer.trim() : getDefaultAnswer((index + 1) as 1 | 2 | 3),
    ) as [string, string, string];
    const userSummary = [
      `Template: ${input.templateId}`,
      `Initial: ${input.initialInput}`,
      `A1: ${normalizedAnswers[0]}`,
      `A2: ${normalizedAnswers[1]}`,
      `A3: ${normalizedAnswers[2]}`,
    ].join('\n');

    try {
      const prompt = await requestSynthesisWithRetry(userSummary);
      const boundedPrompt = prompt.length > promptCap ? `${prompt.slice(0, promptCap)}...` : prompt;
      logProviderLatency({
        ts: nowIso(),
        level: 'info',
        event: 'provider_call_completed',
        requestId: input.requestId,
        provider: 'openai',
        operation: 'synthesize_prompt',
        latencyMs: Date.now() - startedAt,
        providerStatus: 'success',
        attempt: 1,
      });
      return { nanobananaPrompt: boundedPrompt, model: import.meta.env.OPENAI_MODEL ?? DEFAULT_OPENAI_MODEL };
    } catch (error) {
      const code = error instanceof ApiError ? error.code : mapProviderErrorCode('openai');
      logProviderError({
        ts: nowIso(),
        level: 'error',
        event: 'provider_call_failed',
        requestId: input.requestId,
        provider: 'openai',
        operation: 'synthesize_prompt',
        latencyMs: Date.now() - startedAt,
        errorCode: code,
        providerStatus: code === 'PROVIDER_TIMEOUT' ? 'timeout' : 'error',
        attempt: 1,
      });
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError('OPENAI_ERROR');
    }
  },
});

const requestSynthesisWithRetry = async (summary: string): Promise<string> => {
  const first = await requestSynthesis(summary, false);
  if (first) {
    return first;
  }
  const second = await requestSynthesis(summary, true);
  if (second) {
    return second;
  }
  throw new ApiError('SYNTHESIS_PARSE_ERROR');
};

const requestSynthesis = async (summary: string, strictMode: boolean): Promise<string | null> => {
  const apiKey = import.meta.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    return fallbackSynthesis(summary);
  }

  const model = import.meta.env.OPENAI_MODEL ?? DEFAULT_OPENAI_MODEL;
  const systemPrompt = strictMode
    ? 'Return ONLY valid JSON: {"nanobanana_prompt":"..."} with no markdown or extra text.'
    : 'Create one concise NanoBanana-ready prompt and return strict JSON: {"nanobanana_prompt":"..."}';

  let response: Response;
  try {
    response = await fetch(OPENAI_URL, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        input: [
          { role: 'system', content: [{ type: 'text', text: systemPrompt }] },
          { role: 'user', content: [{ type: 'text', text: summary }] },
        ],
      }),
    });
  } catch {
    throw new ApiError('OPENAI_ERROR');
  }

  if (!response.ok) {
    throw new ApiError('OPENAI_ERROR');
  }

  const payload = (await response.json()) as Record<string, unknown>;
  const outputText = extractOutputText(payload);
  if (!outputText) {
    return null;
  }
  return parsePromptFromJson(outputText);
};

const extractOutputText = (payload: Record<string, unknown>): string | null => {
  if (typeof payload.output_text === 'string' && payload.output_text.length > 0) {
    return payload.output_text;
  }

  const output = payload.output;
  if (!Array.isArray(output)) {
    return null;
  }

  for (const item of output) {
    if (!item || typeof item !== 'object' || !('content' in item)) {
      continue;
    }
    const content = (item as { content?: unknown }).content;
    if (!Array.isArray(content)) {
      continue;
    }
    for (const chunk of content) {
      if (chunk && typeof chunk === 'object' && 'text' in chunk && typeof (chunk as { text?: unknown }).text === 'string') {
        return (chunk as { text: string }).text;
      }
    }
  }
  return null;
};

const parsePromptFromJson = (text: string): string | null => {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) {
    return null;
  }
  const maybeJson = text.slice(start, end + 1);
  try {
    const parsed = JSON.parse(maybeJson) as { nanobanana_prompt?: unknown };
    if (typeof parsed.nanobanana_prompt !== 'string') {
      return null;
    }
    const value = parsed.nanobanana_prompt.trim();
    return value.length > 0 ? value : null;
  } catch {
    return null;
  }
};

const fallbackSynthesis = (summary: string): string =>
  `cinematic photograph, ${summary.replaceAll('\n', ', ')}, realistic texture, balanced composition, high detail`;

const getFixedQuestion = (questionIndex: 1 | 2 | 3): string => {
  switch (questionIndex) {
    case 1:
      return "What are we generating (product/lifestyle) and what's the moment? (subject + action + setting)";
    case 2:
      return "What's the lighting scenario? (golden hour backlight / soft window light / controlled side light / practicals)";
    case 3:
      return 'Give 3-5 vibe words + any must-haves (colors/props/text/no-text) to keep it authentic.';
  }
};
