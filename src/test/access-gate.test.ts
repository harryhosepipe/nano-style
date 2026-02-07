import { describe, expect, it } from 'vitest';

import { isAccessRequestAuthorized, readAccessGateConfig } from '../security/access-gate';

const makeBasicAuth = (username: string, password: string): string =>
  `Basic ${btoa(`${username}:${password}`)}`;

describe('readAccessGateConfig', () => {
  it('returns null when password is missing', () => {
    expect(readAccessGateConfig({})).toBeNull();
  });

  it('returns config with defaults when password is present', () => {
    expect(readAccessGateConfig({ ACCESS_GATE_PASSWORD: 'secret-password' })).toEqual({
      username: 'nanostyle',
      password: 'secret-password',
      realm: 'NanoStyle Internal',
    });
  });
});

describe('isAccessRequestAuthorized', () => {
  const config = {
    username: 'demo',
    password: 'correct horse battery staple',
    realm: 'NanoStyle',
  } as const;

  it('accepts matching basic auth header', () => {
    const header = makeBasicAuth(config.username, config.password);
    expect(isAccessRequestAuthorized(header, config)).toBe(true);
  });

  it('rejects incorrect credentials', () => {
    const wrongUser = makeBasicAuth('other', config.password);
    const wrongPassword = makeBasicAuth(config.username, 'nope');
    expect(isAccessRequestAuthorized(wrongUser, config)).toBe(false);
    expect(isAccessRequestAuthorized(wrongPassword, config)).toBe(false);
  });

  it('rejects non-basic or malformed headers', () => {
    expect(isAccessRequestAuthorized(null, config)).toBe(false);
    expect(isAccessRequestAuthorized('Bearer token', config)).toBe(false);
    expect(isAccessRequestAuthorized('Basic not-base64', config)).toBe(false);
    expect(isAccessRequestAuthorized(`Basic ${btoa('missing-colon')}`, config)).toBe(false);
  });
});
