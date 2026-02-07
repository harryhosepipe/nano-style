import { afterEach, describe, expect, it, vi } from 'vitest';

import { POST as openaiTestPost } from '../pages/api/openai/test';

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

describe('openai test endpoint', () => {
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

  it('returns output text for direct input', async () => {
    setEnv('OPENAI_API_KEY', '');

    const context = {
      request: new Request('http://local/api/openai/test', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ text: 'test api connectivity message' }),
      }),
      locals: { requestId: 'req_openai_test_endpoint' },
      cookies: new MockCookies(),
    } as unknown as Parameters<typeof openaiTestPost>[0];

    const response = await openaiTestPost(context);
    const payload = (await response.json()) as { ok: boolean; outputText: string; model: string };

    expect(payload.ok).toBe(true);
    expect(payload.outputText).toContain('test api connectivity message');
    expect(payload.model).toBe('fallback');
  });

  it('accepts multipart form with optional image upload', async () => {
    setEnv('OPENAI_API_KEY', '');
    const formData = new FormData();
    formData.set('text', 'test multipart connectivity');
    formData.set('image', new File(['fakepng'], 'sample.png', { type: 'image/png' }));

    const context = {
      request: new Request('http://local/api/openai/test', {
        method: 'POST',
        body: formData,
      }),
      locals: { requestId: 'req_openai_test_multipart' },
      cookies: new MockCookies(),
    } as unknown as Parameters<typeof openaiTestPost>[0];

    const response = await openaiTestPost(context);
    const payload = (await response.json()) as { ok: boolean; outputText: string; model: string };

    expect(payload.ok).toBe(true);
    expect(payload.outputText).toContain('test multipart connectivity');
    expect(payload.model).toBe('fallback');
  });
});
