import type { APIRoute } from 'astro';

import { ApiError } from '../../api/errors';
import { handleRouteError, jsonSuccess, parseJsonBody } from '../../api/http';
import { SynthesizeRequestSchema } from '../../schemas/api';
import { createOpenAIAdapter } from '../../services/openai/client';
import { sessionService } from '../../session/runtime';
import { logFunnelEvent, nowIso } from '../../telemetry/logger';

const openaiAdapter = createOpenAIAdapter();

export const POST: APIRoute = async (context) => {
  try {
    const body = SynthesizeRequestSchema.parse(await parseJsonBody(context));
    const cookieSessionId = (context.locals as Record<string, unknown>).sessionId;
    if (typeof cookieSessionId === 'string' && cookieSessionId !== body.sessionId) {
      throw new ApiError('SESSION_NOT_FOUND');
    }

    const requestId = (context.locals as Record<string, unknown>).requestId as string;
    const session = await sessionService.getSession(body.sessionId);
    const answers = sessionService.getCompleteAnswers(session);
    if (!answers) {
      throw new ApiError('VALIDATION_ERROR', 400, 'Refinement is incomplete.', false);
    }

    logFunnelEvent({ event: 'synthesis_requested', requestId, sessionId: body.sessionId, ts: nowIso() });
    const synthesisStarted = Date.now();
    const synthesis = await openaiAdapter.synthesizePrompt({
      templateId: session.templateId,
      initialInput: session.initialInput,
      answers,
      requestId,
    });
    logFunnelEvent({
      event: 'synthesis_succeeded',
      requestId,
      sessionId: body.sessionId,
      latencyMs: Date.now() - synthesisStarted,
      ts: nowIso(),
    });

    return jsonSuccess(context, { outputText: synthesis.nanobananaPrompt, model: synthesis.model });
  } catch (error) {
    return handleRouteError(context, error);
  }
};
