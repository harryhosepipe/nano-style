const encoder = new TextEncoder();

export const signSessionId = async (sessionId: string, secret: string): Promise<string> => {
  const key = await importHmacKey(secret);
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(sessionId));
  return `${sessionId}.${toHex(new Uint8Array(signature))}`;
};

export const verifyAndExtractSessionId = async (
  signedValue: string | undefined,
  secret: string | undefined,
): Promise<string | null> => {
  if (!signedValue || !secret) {
    return null;
  }

  const separatorIndex = signedValue.lastIndexOf('.');
  if (separatorIndex <= 0) {
    return null;
  }

  const sessionId = signedValue.slice(0, separatorIndex);
  const providedSig = signedValue.slice(separatorIndex + 1);
  if (!sessionId || !providedSig) {
    return null;
  }

  const expected = await signSessionId(sessionId, secret);
  const expectedSig = expected.slice(expected.lastIndexOf('.') + 1);
  return safeEquals(expectedSig, providedSig) ? sessionId : null;
};

const importHmacKey = async (secret: string): Promise<CryptoKey> =>
  crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);

const toHex = (bytes: Uint8Array): string => bytes.reduce((acc, byte) => `${acc}${byte.toString(16).padStart(2, '0')}`, '');

const safeEquals = (a: string, b: string): boolean => {
  if (a.length !== b.length) {
    return false;
  }
  let mismatch = 0;
  for (let index = 0; index < a.length; index += 1) {
    mismatch |= a.charCodeAt(index) ^ b.charCodeAt(index);
  }
  return mismatch === 0;
};
