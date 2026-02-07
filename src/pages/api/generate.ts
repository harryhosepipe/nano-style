import type { APIRoute } from 'astro';

import { ApiError } from '../../api/errors';
import { handleRouteError, jsonSuccess, parseJsonBody } from '../../api/http';
import { GenerateRequestSchema } from '../../schemas/api';
import { createNanoBananaAdapter } from '../../services/nanobanana/client';
import { createOpenAIAdapter } from '../../services/openai/client';
import { sessionService } from '../../session/runtime';
import { logFunnelEvent, nowIso } from '../../telemetry/logger';

const openaiAdapter = createOpenAIAdapter();
const nanoBananaAdapter = createNanoBananaAdapter();
const MAX_POLL_ATTEMPTS = 10;

export const POST: APIRoute = async (context) => {
  try {
    const body = GenerateRequestSchema.parse(await parseJsonBody(context));
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

    await sessionService.markGenerating(body.sessionId);
    logFunnelEvent({ event: 'generation_requested', requestId, sessionId: body.sessionId, ts: nowIso() });

    const generationStarted = Date.now();
    const generated = await nanoBananaAdapter.generate({
      prompt: synthesis.nanobananaPrompt,
      requestId,
      sessionId: body.sessionId,
    });

    const image =
      generated.kind === 'completed_sync'
        ? generated.image
        : await pollForImage(requestId, body.sessionId, generated.jobId, generated.pollAfterMs);

    await sessionService.markResultReady(body.sessionId, image);
    logFunnelEvent({
      event: 'image_succeeded',
      requestId,
      sessionId: body.sessionId,
      latencyMs: Date.now() - generationStarted,
      ts: nowIso(),
    });

    return jsonSuccess(context, { image });
  } catch (error) {
    const requestId = (context.locals as Record<string, unknown>).requestId as string | undefined;
    const sessionId = ((await safeReadRequestBody(context.request)) as { sessionId?: string } | null)?.sessionId;
    if (requestId && sessionId && error instanceof ApiError) {
      logFunnelEvent({
        event: 'image_failed',
        requestId,
        sessionId,
        errorCode: error.code,
        latencyMs: 0,
        ts: nowIso(),
      });
    }
    return handleRouteError(context, error);
  }
};

const pollForImage = async (
  requestId: string,
  sessionId: string,
  jobId: string,
  initialWaitMs: number,
): Promise<{ type: 'url'; url: string; mimeType?: string } | { type: 'base64'; base64: string; mimeType: string }> => {
  let waitMs = initialWaitMs;
  for (let attempt = 1; attempt <= MAX_POLL_ATTEMPTS; attempt += 1) {
    await sleep(waitMs);
    const status = await nanoBananaAdapter.getStatus({ requestId, sessionId, jobId });
    if (status.status === 'completed') {
      return status.image;
    }
    if (status.status === 'failed') {
      throw new ApiError(status.code, undefined, undefined, status.retryable);
    }
    waitMs = status.pollAfterMs;
  }
  throw new ApiError('PROVIDER_TIMEOUT');
};

const sleep = async (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

const safeReadRequestBody = async (request: Request): Promise<unknown | null> => {
  try {
    return await request.clone().json();
  } catch {
    return null;
  }
};
