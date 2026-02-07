import { describe, expect, it } from 'vitest';

import { applyResponseHeaders, SECURITY_HEADERS } from '../security/headers';

describe('security headers', () => {
  it('applies request id and hardened headers to responses', () => {
    const response = new Response('ok', { status: 200 });
    applyResponseHeaders(response, 'req_header_test');

    expect(response.headers.get('x-request-id')).toBe('req_header_test');
    for (const [header, value] of Object.entries(SECURITY_HEADERS)) {
      expect(response.headers.get(header)).toBe(value);
    }
  });
});
