import { defineMiddleware } from 'astro:middleware';
import {
  buildAccessDeniedResponse,
  isAccessRequestAuthorized,
  readAccessGateConfig,
} from './security/access-gate';

export const onRequest = defineMiddleware(async ({ request }, next) => {
  const gateConfig = readAccessGateConfig(import.meta.env as Record<string, string | undefined>);
  if (!gateConfig) {
    return next();
  }

  const authHeader = request.headers.get('authorization');
  if (isAccessRequestAuthorized(authHeader, gateConfig)) {
    return next();
  }

  return buildAccessDeniedResponse(gateConfig.realm);
});
