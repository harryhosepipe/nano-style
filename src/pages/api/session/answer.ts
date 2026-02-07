import type { APIRoute } from 'astro';

import { ApiError } from '../../../api/errors';
import { handleRouteError, jsonSuccess, parseJsonBody } from '../../../api/http';
import { SessionAnswerRequestSchema } from '../../../schemas/api';
import { sessionService } from '../../../session/runtime';
import { logFunnelEvent, nowIso } from '../../../telemetry/logger';

export const POST: APIRoute = async (context) => {
  try {
    const body = SessionAnswerRequestSchema.parse(await parseJsonBody(context));
    const cookieSessionId = (context.locals as Record<string, unknown>).sessionId;
    if (typeof cookieSessionId === 'string' && cookieSessionId !== body.sessionId) {
      throw new ApiError('SESSION_NOT_FOUND');
    }

    const result = await sessionService.answerSession(body.sessionId, body.answer, body.editFromQuestionIndex);
    const requestId = (context.locals as Record<string, unknown>).requestId as string;

    if (result.done) {
      logFunnelEvent({
        event: 'refinement_completed',
        requestId,
        sessionId: body.sessionId,
        questionsCount: 3,
        ts: nowIso(),
      });
      return jsonSuccess(context, { done: true });
    }

    logFunnelEvent({
      event: 'refinement_answered',
      requestId,
      sessionId: body.sessionId,
      questionIndex: result.session.questionIndex === 1 ? 3 : ((result.session.questionIndex - 1) as 1 | 2 | 3),
      ts: nowIso(),
    });
    return jsonSuccess(context, {
      done: false,
      questionIndex: result.session.questionIndex,
      questionText: result.questionText,
    });
  } catch (error) {
    return handleRouteError(context, error);
  }
};
