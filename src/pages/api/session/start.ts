import type { APIRoute } from 'astro';

import {
  SESSION_COOKIE_HTTP_ONLY,
  SESSION_COOKIE_MAX_AGE_SECONDS,
  SESSION_COOKIE_NAME,
  SESSION_COOKIE_PATH,
  SESSION_COOKIE_SAME_SITE,
} from '../../../api/contracts';
import { ApiError } from '../../../api/errors';
import { handleRouteError, jsonSuccess, parseJsonBody } from '../../../api/http';
import { SessionStartRequestSchema } from '../../../schemas/api';
import { getQuestionText } from '../../../session/questions';
import { signSessionId } from '../../../session/cookie';
import { sessionService } from '../../../session/runtime';
import { logFunnelEvent, nowIso } from '../../../telemetry/logger';

export const POST: APIRoute = async (context) => {
  try {
    const body = SessionStartRequestSchema.parse(await parseJsonBody(context));
    const session = await sessionService.startSession(body.templateId, body.initial);

    const secret = import.meta.env.SESSION_SECRET?.trim();
    if (!secret) {
      throw new ApiError('INTERNAL_ERROR');
    }
    const signedSessionId = await signSessionId(session.sessionId, secret);
    context.cookies.set(SESSION_COOKIE_NAME, signedSessionId, {
      path: SESSION_COOKIE_PATH,
      httpOnly: SESSION_COOKIE_HTTP_ONLY,
      sameSite: SESSION_COOKIE_SAME_SITE,
      maxAge: SESSION_COOKIE_MAX_AGE_SECONDS,
    });

    const requestId = (context.locals as Record<string, unknown>).requestId as string;
    logFunnelEvent({
      event: 'session_started',
      requestId,
      sessionId: session.sessionId,
      templateId: session.templateId,
      ts: nowIso(),
    });

    return jsonSuccess(context, {
      sessionId: session.sessionId,
      questionIndex: 1,
      questionText: getQuestionText(1),
    });
  } catch (error) {
    return handleRouteError(context, error);
  }
};
