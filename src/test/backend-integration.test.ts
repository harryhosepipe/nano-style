import { afterEach, describe, expect, it, vi } from 'vitest';

import { GET as templatesGet } from '../pages/api/templates';
import { POST as startPost } from '../pages/api/session/start';
import { POST as answerPost } from '../pages/api/session/answer';
import { POST as generatePost } from '../pages/api/generate';
import { POST as resetPost } from '../pages/api/session/reset';

class MockCookies {
  private readonly store = new Map<string, string>();

  set(name: string, value: string): void {
    this.store.set(name, value);
  }

  get(name: string): { value: string } | undefined {
    const value = this.store.get(name);
    return value ? { value } : undefined;
  }

  delete(name: string): void {
    this.store.delete(name);
  }
}

const createContext = (request: Request, locals: Record<string, unknown>, cookies: MockCookies) =>
  ({ request, locals, cookies }) as unknown as Parameters<typeof startPost>[0];

const json = async (response: Response): Promise<unknown> => response.json();

describe('backend integration with mocked providers', () => {
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

  it('completes the full template -> refine -> generate -> reset journey (sync provider)', async () => {
    setEnv('SESSION_SECRET', 'integration-secret');
    setEnv('OPENAI_API_KEY', '');
    setEnv('NANOBANANA_API_URL', 'https://mock.nanobanana.local');
    setEnv('NANOBANANA_API_KEY', 'test-key');

    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ imageUrl: 'https://cdn.example.com/result.png', mimeType: 'image/png' }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    );

    const consoleLog = vi.spyOn(console, 'log').mockImplementation(() => {});

    const cookies = new MockCookies();
    const templatesResponse = await templatesGet(
      createContext(new Request('http://local/api/templates', { method: 'GET' }), { requestId: 'req_templates' }, cookies),
    );
    const templatesPayload = (await json(templatesResponse)) as { templates: Array<unknown> };
    expect(templatesPayload.templates.length).toBeGreaterThan(0);

    const startResponse = await startPost(
      createContext(
        new Request('http://local/api/session/start', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ templateId: 'general-cinematic', initial: 'Premium skincare on marble counter.' }),
        }),
        { requestId: 'req_start' },
        cookies,
      ),
    );
    const startPayload = (await json(startResponse)) as { ok: boolean; sessionId: string };
    expect(startPayload.ok).toBe(true);

    const sessionId = startPayload.sessionId;
    const answers = [
      'A bottle hero shot with hand interaction.',
      'Soft side lighting with warm bounce.',
      'Premium, tactile, minimal, no text.',
    ];

    for (let index = 0; index < answers.length; index += 1) {
      const answerResponse = await answerPost(
        createContext(
          new Request('http://local/api/session/answer', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ sessionId, answer: answers[index] }),
          }),
          { requestId: `req_answer_${index + 1}`, sessionId },
          cookies,
        ),
      );
      const payload = (await json(answerResponse)) as { done: boolean };
      if (index < 2) {
        expect(payload.done).toBe(false);
      } else {
        expect(payload.done).toBe(true);
      }
    }

    const generateResponse = await generatePost(
      createContext(
        new Request('http://local/api/generate', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ sessionId }),
        }),
        { requestId: 'req_generate', sessionId },
        cookies,
      ),
    );
    const generatePayload = (await json(generateResponse)) as { image: { type: string } };
    expect(generatePayload.image.type).toBe('url');
    expect(JSON.stringify(generatePayload)).not.toContain('prompt');

    const resetResponse = await resetPost(
      createContext(
        new Request('http://local/api/session/reset', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ sessionId }),
        }),
        { requestId: 'req_reset', sessionId },
        cookies,
      ),
    );
    const resetPayload = (await json(resetResponse)) as { reset: boolean };
    expect(resetPayload.reset).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const events = consoleLog.mock.calls
      .map((entry) => (typeof entry[0] === 'string' ? (JSON.parse(entry[0]) as { type?: string; event?: string }) : null))
      .filter(Boolean);

    const funnelEvents = events.filter((entry) => entry?.type === 'funnel').map((entry) => entry?.event);
    expect(funnelEvents).toEqual(
      expect.arrayContaining([
        'session_started',
        'refinement_answered',
        'refinement_completed',
        'synthesis_requested',
        'synthesis_succeeded',
        'generation_requested',
        'image_succeeded',
      ]),
    );
  });

  it('handles async provider polling completion', async () => {
    setEnv('SESSION_SECRET', 'integration-secret');
    setEnv('OPENAI_API_KEY', '');
    setEnv('NANOBANANA_API_URL', 'https://mock.nanobanana.local');
    setEnv('NANOBANANA_API_KEY', 'test-key');

    const fetchMock = vi.spyOn(globalThis, 'fetch');
    fetchMock
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ jobId: 'job-1', pollAfterMs: 0 }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ status: 'pending', pollAfterMs: 0 }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ status: 'completed', imageBase64: 'abc123', mimeType: 'image/png' }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
      );

    const cookies = new MockCookies();
    const startPayload = (await json(
      await startPost(
        createContext(
          new Request('http://local/api/session/start', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ templateId: 'general-cinematic', initial: 'Streetwear portrait setup.' }),
          }),
          { requestId: 'req_start_async' },
          cookies,
        ),
      ),
    )) as { sessionId: string };

    const sessionId = startPayload.sessionId;
    await answerPost(
      createContext(
        new Request('http://local/api/session/answer', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ sessionId, answer: 'Subject walking through city crosswalk.' }),
        }),
        { requestId: 'req_a1_async', sessionId },
        cookies,
      ),
    );
    await answerPost(
      createContext(
        new Request('http://local/api/session/answer', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ sessionId, answer: 'Neon practicals with soft key fill.' }),
        }),
        { requestId: 'req_a2_async', sessionId },
        cookies,
      ),
    );
    await answerPost(
      createContext(
        new Request('http://local/api/session/answer', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ sessionId, answer: 'Modern, candid, energetic, no text.' }),
        }),
        { requestId: 'req_a3_async', sessionId },
        cookies,
      ),
    );

    const generatePayload = (await json(
      await generatePost(
        createContext(
          new Request('http://local/api/generate', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ sessionId }),
          }),
          { requestId: 'req_generate_async', sessionId },
          cookies,
        ),
      ),
    )) as { image: { type: string } };

    expect(generatePayload.image.type).toBe('base64');
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });
});
