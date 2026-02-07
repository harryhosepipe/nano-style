const DEFAULT_ACCESS_GATE_USER = 'nanostyle';
const DEFAULT_ACCESS_GATE_REALM = 'NanoStyle Internal';

export type AccessGateConfig = {
  readonly username: string;
  readonly password: string;
  readonly realm: string;
};

type EnvMap = Record<string, string | undefined>;

export function readAccessGateConfig(env: EnvMap): AccessGateConfig | null {
  const password = env.ACCESS_GATE_PASSWORD?.trim();
  if (!password) {
    return null;
  }

  return {
    username: env.ACCESS_GATE_USER?.trim() || DEFAULT_ACCESS_GATE_USER,
    password,
    realm: env.ACCESS_GATE_REALM?.trim() || DEFAULT_ACCESS_GATE_REALM,
  };
}

export function isAccessRequestAuthorized(
  authorizationHeader: string | null,
  config: AccessGateConfig,
): boolean {
  if (!authorizationHeader || !authorizationHeader.startsWith('Basic ')) {
    return false;
  }

  const encoded = authorizationHeader.slice('Basic '.length).trim();
  if (!encoded) {
    return false;
  }

  let decoded = '';
  try {
    decoded = atob(encoded);
  } catch {
    return false;
  }

  const separatorIndex = decoded.indexOf(':');
  if (separatorIndex === -1) {
    return false;
  }

  const username = decoded.slice(0, separatorIndex);
  const password = decoded.slice(separatorIndex + 1);

  return safeEquals(username, config.username) && safeEquals(password, config.password);
}

export function buildAccessDeniedResponse(realm: string): Response {
  return new Response('Access denied', {
    status: 401,
    headers: {
      'WWW-Authenticate': `Basic realm="${realm}"`,
    },
  });
}

function safeEquals(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let mismatch = 0;
  for (let index = 0; index < a.length; index += 1) {
    mismatch |= a.charCodeAt(index) ^ b.charCodeAt(index);
  }
  return mismatch === 0;
}
