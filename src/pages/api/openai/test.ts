import type { APIRoute } from 'astro';

import { handleRouteError, jsonSuccess, parseJsonBody } from '../../../api/http';
import { OpenAITestRequestSchema } from '../../../schemas/api';
import { createOpenAIAdapter } from '../../../services/openai/client';

const openaiAdapter = createOpenAIAdapter();

export const POST: APIRoute = async (context) => {
  try {
    const body = OpenAITestRequestSchema.parse(await parseJsonBody(context));
    const requestId = (context.locals as Record<string, unknown>).requestId as string;
    const synthesis = await openaiAdapter.synthesizeText({
      text: body.text,
      requestId,
    });
    return jsonSuccess(context, { outputText: synthesis.nanobananaPrompt, model: synthesis.model });
  } catch (error) {
    return handleRouteError(context, error);
  }
};
