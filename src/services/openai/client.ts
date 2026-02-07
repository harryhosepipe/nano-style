import OpenAI from 'openai';

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

const DEFAULT_PROMPT_CAP_CHARS = 1200;
const DEFAULT_OPENAI_PROMPT_VERSION = '1';

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
      const synthesis = await requestSynthesis(userSummary);
      const boundedPrompt =
        synthesis.nanobananaPrompt.length > promptCap
          ? `${synthesis.nanobananaPrompt.slice(0, promptCap)}...`
          : synthesis.nanobananaPrompt;
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
      return {
        nanobananaPrompt: boundedPrompt,
        model: synthesis.model,
      };
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

  async synthesizeText(input): Promise<OpenAISynthesisResult> {
    const startedAt = Date.now();
    const promptCap = Number.parseInt(import.meta.env.PROMPT_MAX_CHARS ?? '', 10) || DEFAULT_PROMPT_CAP_CHARS;
    const text = input.text.trim();
    if (text.length === 0) {
      throw new ApiError('VALIDATION_ERROR', 400, 'Text is required.', false);
    }

    try {
      const synthesis = await requestSynthesis(text);
      const boundedPrompt =
        synthesis.nanobananaPrompt.length > promptCap
          ? `${synthesis.nanobananaPrompt.slice(0, promptCap)}...`
          : synthesis.nanobananaPrompt;
      logProviderLatency({
        ts: nowIso(),
        level: 'info',
        event: 'provider_call_completed',
        requestId: input.requestId,
        provider: 'openai',
        operation: 'synthesize_text',
        latencyMs: Date.now() - startedAt,
        providerStatus: 'success',
        attempt: 1,
      });
      return { nanobananaPrompt: boundedPrompt, model: synthesis.model };
    } catch (error) {
      const code = error instanceof ApiError ? error.code : mapProviderErrorCode('openai');
      logProviderError({
        ts: nowIso(),
        level: 'error',
        event: 'provider_call_failed',
        requestId: input.requestId,
        provider: 'openai',
        operation: 'synthesize_text',
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

const getPromptConfig = (): { id: string; version: string } => {
  const id = import.meta.env.OPENAI_PROMPT_ID?.trim();
  if (!id) {
    throw new ApiError('OPENAI_ERROR');
  }
  const version = import.meta.env.OPENAI_PROMPT_VERSION?.trim() || DEFAULT_OPENAI_PROMPT_VERSION;
  return { id, version };
};

const requestSynthesis = async (summary: string): Promise<OpenAISynthesisResult> => {
  const apiKey = import.meta.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    return { nanobananaPrompt: fallbackSynthesis(summary), model: 'fallback' };
  }
  const client = new OpenAI({ apiKey });
  const promptConfig = getPromptConfig();
  let response: Record<string, unknown>;
  try {
    response = (await client.responses.create({
      prompt: promptConfig,
      input: [
        {
          role: 'user',
          content: [{ type: 'input_text', text: summary }],
        },
      ],
    })) as unknown as Record<string, unknown>;
  } catch {
    throw new ApiError('OPENAI_ERROR');
  }

  const outputText = extractOutputText(response)?.trim();
  if (!outputText) {
    throw new ApiError('SYNTHESIS_PARSE_ERROR');
  }
  return {
    nanobananaPrompt: outputText,
    model: `prompt:${promptConfig.id}:v${promptConfig.version}`,
  };
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
      if (!chunk || typeof chunk !== 'object') {
        continue;
      }
      if ('text' in chunk && typeof (chunk as { text?: unknown }).text === 'string') {
        return (chunk as { text: string }).text;
      }
      if (
        'type' in chunk &&
        (chunk as { type?: unknown }).type === 'output_text' &&
        'text' in chunk &&
        typeof (chunk as { text?: unknown }).text === 'string'
      ) {
        return (chunk as { text: string }).text;
      }
    }
  }
  return null;
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
