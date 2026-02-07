import { describe, expect, it } from 'vitest';

import { signSessionId, verifyAndExtractSessionId } from '../session/cookie';

describe('session cookie signing', () => {
  it('signs and verifies a session id', async () => {
    const secret = '12345678901234567890123456789012';
    const signed = await signSessionId('sess_abc', secret);
    const extracted = await verifyAndExtractSessionId(signed, secret);
    expect(extracted).toBe('sess_abc');
  });

  it('rejects tampered signature', async () => {
    const secret = '12345678901234567890123456789012';
    const signed = await signSessionId('sess_abc', secret);
    const tampered = `${signed.slice(0, -1)}0`;
    const extracted = await verifyAndExtractSessionId(tampered, secret);
    expect(extracted).toBeNull();
  });
});
