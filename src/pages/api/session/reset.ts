import type { APIRoute } from 'astro';

import {
  SESSION_COOKIE_HTTP_ONLY,
  SESSION_COOKIE_NAME,
  SESSION_COOKIE_PATH,
  SESSION_COOKIE_SAME_SITE,
} from '../../../api/contracts';
import { ApiError } from '../../../api/errors';
import { handleRouteError, jsonSuccess, parseJsonBody } from '../../../api/http';
import { SessionResetRequestSchema } from '../../../schemas/api';
import { sessionService } from '../../../session/runtime';

export const POST: APIRoute = async (context) => {
  try {
    const body = SessionResetRequestSchema.parse(await parseJsonBody(context));
    const cookieSessionId = (context.locals as Record<string, unknown>).sessionId;

    if (body.sessionId && typeof cookieSessionId === 'string' && body.sessionId !== cookieSessionId) {
      throw new ApiError('SESSION_NOT_FOUND');
    }

    const targetSessionId = body.sessionId ?? (typeof cookieSessionId === 'string' ? cookieSessionId : null);
    if (targetSessionId) {
      await sessionService.resetSession(targetSessionId);
    }

    context.cookies.delete(SESSION_COOKIE_NAME, {
      path: SESSION_COOKIE_PATH,
      httpOnly: SESSION_COOKIE_HTTP_ONLY,
      sameSite: SESSION_COOKIE_SAME_SITE,
    });

    return jsonSuccess(context, { reset: true });
  } catch (error) {
    return handleRouteError(context, error);
  }
};
