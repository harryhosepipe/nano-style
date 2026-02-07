import { afterEach, describe, expect, it, vi } from 'vitest';

import { ApiError } from '../api/errors';

const { responsesCreateMock } = vi.hoisted(() => ({
  responsesCreateMock: vi.fn(),
}));

vi.mock('openai', () => ({
  default: class MockOpenAI {
    responses = {
      create: responsesCreateMock,
    };
  },
}));

import { createOpenAIAdapter } from '../services/openai/client';

const baseInput = {
  templateId: 'general-cinematic',
  initialInput: 'Hero product on a clean table.',
  answers: [
    'Product close-up in use.',
    'Soft window light from camera left.',
    'Authentic, tactile, minimal, no text.',
  ] as [string, string, string],
  requestId: 'req_openai_test',
};

describe('openai prompt-based synthesis', () => {
  const env = import.meta.env as Record<string, string | undefined>;
  const originalEnv = new Map<string, string | undefined>();
  const setEnv = (key: string, value: string | undefined): void => {
    if (!originalEnv.has(key)) {
      originalEnv.set(key, env[key]);
    }
    if (value === undefined) {
      delete env[key];
    } else {
      env[key] = value;
    }
  };

  afterEach(() => {
    vi.restoreAllMocks();
    responsesCreateMock.mockReset();
    for (const [key, value] of originalEnv.entries()) {
      if (value === undefined) {
        delete env[key];
      } else {
        env[key] = value;
      }
    }
    originalEnv.clear();
  });

  it('uses configured prompt id/version and returns output_text', async () => {
    setEnv('OPENAI_API_KEY', 'test-key');
    setEnv('OPENAI_PROMPT_ID', 'pmpt_abc123');
    setEnv('OPENAI_PROMPT_VERSION', '7');
    responsesCreateMock.mockResolvedValue({ output_text: 'cinematic bottle photo' });

    const result = await createOpenAIAdapter().synthesizePrompt(baseInput);
    expect(result.nanobananaPrompt).toBe('cinematic bottle photo');
    expect(result.model).toBe('prompt:pmpt_abc123:v7');
    expect(responsesCreateMock).toHaveBeenCalledTimes(1);
    expect(responsesCreateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        prompt: { id: 'pmpt_abc123', version: '7' },
      }),
    );
  });

  it('includes input_image part when image data url is provided', async () => {
    setEnv('OPENAI_API_KEY', 'test-key');
    setEnv('OPENAI_PROMPT_ID', 'pmpt_abc123');
    responsesCreateMock.mockResolvedValue({ output_text: 'image-aware prompt' });

    await createOpenAIAdapter().synthesizeText({
      text: 'describe this reference image',
      imageDataUrl: 'data:image/png;base64,AAAA',
      requestId: 'req_openai_text_with_image',
    });

    expect(responsesCreateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        input: [
          {
            role: 'user',
            content: [
              { type: 'input_text', text: 'describe this reference image' },
              { type: 'input_image', image_url: 'data:image/png;base64,AAAA', detail: 'auto' },
            ],
          },
        ],
      }),
    );
  });

  it('falls back to default prompt version when not set', async () => {
    setEnv('OPENAI_API_KEY', 'test-key');
    setEnv('OPENAI_PROMPT_ID', 'pmpt_abc123');
    setEnv('OPENAI_PROMPT_VERSION', '');
    responsesCreateMock.mockResolvedValue({ output_text: 'final prompt' });

    const result = await createOpenAIAdapter().synthesizePrompt(baseInput);
    expect(result.model).toBe('prompt:pmpt_abc123:v1');
  });

  it('throws SYNTHESIS_PARSE_ERROR when response has no text', async () => {
    setEnv('OPENAI_API_KEY', 'test-key');
    setEnv('OPENAI_PROMPT_ID', 'pmpt_abc123');
    responsesCreateMock.mockResolvedValue({ output: [] });

    await expect(createOpenAIAdapter().synthesizePrompt(baseInput)).rejects.toMatchObject({
      code: 'SYNTHESIS_PARSE_ERROR',
    } satisfies Partial<ApiError>);
  });

  it('applies prompt length cap', async () => {
    setEnv('OPENAI_API_KEY', 'test-key');
    setEnv('OPENAI_PROMPT_ID', 'pmpt_abc123');
    setEnv('PROMPT_MAX_CHARS', '12');
    responsesCreateMock.mockResolvedValue({ output_text: 'this prompt is intentionally long' });

    const result = await createOpenAIAdapter().synthesizePrompt(baseInput);
    expect(result.nanobananaPrompt).toBe('this prompt ...');
  });

  it('uses fallback synthesis with default infill when API key is missing', async () => {
    setEnv('OPENAI_API_KEY', '');
    const result = await createOpenAIAdapter().synthesizePrompt({
      ...baseInput,
      answers: ['', '  ', ''],
    });

    expect(result.nanobananaPrompt).toContain('Template: general-cinematic');
    expect(result.nanobananaPrompt).toContain('balanced composition');
  });
});
