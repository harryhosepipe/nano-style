import { describe, expect, it } from 'vitest';

import { jsonSuccess } from '../api/http';

const createContext = () =>
  ({
    locals: { requestId: 'req_transport_1' },
  }) as unknown as Parameters<typeof jsonSuccess>[0];

describe('http transport boundaries', () => {
  it('returns standard success envelope for safe data', async () => {
    const response = jsonSuccess(createContext(), { image: { type: 'url', url: 'https://cdn.example.com/img.png' } });
    const payload = await response.json();
    expect(payload.ok).toBe(true);
    expect(payload.requestId).toBe('req_transport_1');
  });

  it('rejects success payloads containing prompt-like fields', () => {
    expect(() => jsonSuccess(createContext(), { prompt: 'should never leave server' })).toThrow();
    expect(() => jsonSuccess(createContext(), { nested: { final_prompt: 'should never leave server' } })).toThrow();
  });
});
