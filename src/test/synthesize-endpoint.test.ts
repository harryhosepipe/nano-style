import { afterEach, describe, expect, it, vi } from 'vitest';

import { POST as answerPost } from '../pages/api/session/answer';
import { POST as startPost } from '../pages/api/session/start';
import { POST as synthesizePost } from '../pages/api/synthesize';

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

describe('synthesize endpoint', () => {
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

  it('returns synthesized prompt without requiring nanobanana configuration', async () => {
    setEnv('SESSION_SECRET', 'synthesize-secret');
    setEnv('OPENAI_API_KEY', '');
    setEnv('NANOBANANA_API_URL', '');
    setEnv('NANOBANANA_API_KEY', '');

    const cookies = new MockCookies();
    const startPayload = (await (
      await startPost(
        createContext(
          new Request('http://local/api/session/start', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ templateId: 'general-cinematic', initial: 'Sneaker hero shot on concrete floor.' }),
          }),
          { requestId: 'req_syn_start' },
          cookies,
        ),
      )
    ).json()) as { sessionId: string };

    const sessionId = startPayload.sessionId;
    await answerPost(
      createContext(
        new Request('http://local/api/session/answer', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ sessionId, answer: 'Single sneaker with motion blur and city background.' }),
        }),
        { requestId: 'req_syn_a1', sessionId },
        cookies,
      ),
    );
    await answerPost(
      createContext(
        new Request('http://local/api/session/answer', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ sessionId, answer: 'Soft dusk light with practical neon accents.' }),
        }),
        { requestId: 'req_syn_a2', sessionId },
        cookies,
      ),
    );
    await answerPost(
      createContext(
        new Request('http://local/api/session/answer', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ sessionId, answer: 'Urban, energetic, premium, no text.' }),
        }),
        { requestId: 'req_syn_a3', sessionId },
        cookies,
      ),
    );

    const synthPayload = (await (
      await synthesizePost(
        createContext(
          new Request('http://local/api/synthesize', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ sessionId }),
          }),
          { requestId: 'req_syn_generate', sessionId },
          cookies,
        ),
      )
    ).json()) as { outputText: string; model: string };

    expect(synthPayload.outputText).toContain('Template: general-cinematic');
    expect(synthPayload.model).toBe('fallback');
  });
});
