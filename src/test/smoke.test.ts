import { afterEach, describe, expect, it, vi } from 'vitest';

import { POST as answerPost } from '../pages/api/session/answer';
import { POST as generatePost } from '../pages/api/generate';
import { POST as startPost } from '../pages/api/session/start';

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

describe('core MVP e2e smoke', () => {
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

  it('runs the full happy path and returns an image quickly', async () => {
    setEnv('SESSION_SECRET', 'smoke-secret');
    setEnv('OPENAI_API_KEY', '');
    setEnv('NANOBANANA_API_URL', 'https://mock.nanobanana.local');
    setEnv('NANOBANANA_API_KEY', 'test-key');

    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
      const url = String(input);
      if (url.endsWith('/generate')) {
        await new Promise((resolve) => setTimeout(resolve, 30));
        return new Response(JSON.stringify({ imageUrl: 'https://cdn.example.com/smoke.png' }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        });
      }
      throw new Error(`Unexpected fetch URL in smoke test: ${url}`);
    });

    const cookies = new MockCookies();
    const startPayload = await (
      await startPost(
        createContext(
          new Request('http://local/api/session/start', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ templateId: 'general-cinematic', initial: 'Coffee product hero in cafe.' }),
          }),
          { requestId: 'req_smoke_start' },
          cookies,
        ),
      )
    ).json();

    const sessionId = startPayload.sessionId as string;
    await answerPost(
      createContext(
        new Request('http://local/api/session/answer', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ sessionId, answer: 'Cup held by hand near window.' }),
        }),
        { requestId: 'req_smoke_a1', sessionId },
        cookies,
      ),
    );
    await answerPost(
      createContext(
        new Request('http://local/api/session/answer', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ sessionId, answer: 'Warm side key with practical backlight.' }),
        }),
        { requestId: 'req_smoke_a2', sessionId },
        cookies,
      ),
    );
    await answerPost(
      createContext(
        new Request('http://local/api/session/answer', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ sessionId, answer: 'Natural, cozy, premium, no text.' }),
        }),
        { requestId: 'req_smoke_a3', sessionId },
        cookies,
      ),
    );

    const startedAt = Date.now();
    const generatePayload = await (
      await generatePost(
        createContext(
          new Request('http://local/api/generate', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ sessionId }),
          }),
          { requestId: 'req_smoke_generate', sessionId },
          cookies,
        ),
      )
    ).json();
    const durationMs = Date.now() - startedAt;

    expect(generatePayload.image.type).toBe('url');
    expect(durationMs).toBeLessThan(2000);
  });
});
