import { defineMiddleware } from 'astro:middleware';
import { REQUEST_ID_HEADER, SESSION_COOKIE_NAME } from './api/contracts';
import {
  buildAccessDeniedResponse,
  isAccessRequestAuthorized,
  readAccessGateConfig,
} from './security/access-gate';
import { verifyAndExtractSessionId } from './session/cookie';

export const onRequest = defineMiddleware(async ({ request, locals, cookies }, next) => {
  const incomingRequestId = request.headers.get(REQUEST_ID_HEADER);
  locals.requestId =
    incomingRequestId && incomingRequestId.trim().length > 0
      ? incomingRequestId
      : `req_${crypto.randomUUID().replaceAll('-', '')}`;

  const secret = import.meta.env.SESSION_SECRET?.trim();
  if (secret) {
    const cookieValue = cookies.get(SESSION_COOKIE_NAME)?.value;
    locals.sessionId = await verifyAndExtractSessionId(cookieValue, secret);
  }

  const gateConfig = readAccessGateConfig(import.meta.env as Record<string, string | undefined>);
  if (!gateConfig) {
    const response = await next();
    response.headers.set(REQUEST_ID_HEADER, String(locals.requestId));
    return response;
  }

  const authHeader = request.headers.get('authorization');
  if (isAccessRequestAuthorized(authHeader, gateConfig)) {
    const response = await next();
    response.headers.set(REQUEST_ID_HEADER, String(locals.requestId));
    return response;
  }

  const denied = buildAccessDeniedResponse(gateConfig.realm);
  denied.headers.set(REQUEST_ID_HEADER, String(locals.requestId));
  return denied;
});
