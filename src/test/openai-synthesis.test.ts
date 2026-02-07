import { afterEach, describe, expect, it, vi } from 'vitest';

import { ApiError } from '../api/errors';
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

describe('openai synthesis parser resilience', () => {
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
    for (const [key, value] of originalEnv.entries()) {
      if (value === undefined) {
        delete env[key];
      } else {
        env[key] = value;
      }
    }
    originalEnv.clear();
  });

  it('parses strict JSON from output_text', async () => {
    setEnv('OPENAI_API_KEY', 'test-key');
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          output_text: '{"nanobanana_prompt":"  cinematic bottle photo  "}',
        }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      ),
    );

    const result = await createOpenAIAdapter().synthesizePrompt(baseInput);
    expect(result.nanobananaPrompt).toBe('cinematic bottle photo');
  });

  it('retries once and succeeds on wrapped JSON content', async () => {
    setEnv('OPENAI_API_KEY', 'test-key');
    const fetchMock = vi.spyOn(globalThis, 'fetch');
    fetchMock
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ output_text: 'not-json' }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            output: [
              {
                content: [{ text: 'Sure. {"nanobanana_prompt":"stylized studio portrait"} Thanks.' }],
              },
            ],
          }),
          { status: 200, headers: { 'content-type': 'application/json' } },
        ),
      );

    const result = await createOpenAIAdapter().synthesizePrompt(baseInput);
    expect(result.nanobananaPrompt).toBe('stylized studio portrait');
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('throws SYNTHESIS_PARSE_ERROR when both attempts fail', async () => {
    setEnv('OPENAI_API_KEY', 'test-key');
    vi.spyOn(globalThis, 'fetch').mockImplementation(async () =>
      new Response(JSON.stringify({ output_text: 'still not JSON' }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    );

    await expect(createOpenAIAdapter().synthesizePrompt(baseInput)).rejects.toMatchObject({
      code: 'SYNTHESIS_PARSE_ERROR',
    } satisfies Partial<ApiError>);
  });

  it('applies prompt length cap', async () => {
    setEnv('OPENAI_API_KEY', 'test-key');
    setEnv('PROMPT_MAX_CHARS', '12');
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          output_text: '{"nanobanana_prompt":"this prompt is intentionally long"}',
        }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      ),
    );

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
