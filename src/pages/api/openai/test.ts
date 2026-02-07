import type { APIRoute } from 'astro';

import { ApiError } from '../../../api/errors';
import { handleRouteError, jsonSuccess } from '../../../api/http';
import { OpenAITestRequestSchema } from '../../../schemas/api';
import { createOpenAIAdapter } from '../../../services/openai/client';

const openaiAdapter = createOpenAIAdapter();
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const SUPPORTED_IMAGE_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/gif']);

export const POST: APIRoute = async (context) => {
  try {
    const body = await parseOpenAITestBody(context.request);
    const requestId = (context.locals as Record<string, unknown>).requestId as string;
    const synthesis = await openaiAdapter.synthesizeText({
      text: body.text,
      imageDataUrl: body.imageDataUrl,
      requestId,
    });
    return jsonSuccess(context, { outputText: synthesis.nanobananaPrompt, model: synthesis.model });
  } catch (error) {
    return handleRouteError(context, error);
  }
};

const parseOpenAITestBody = async (request: Request) => {
  const contentType = request.headers.get('content-type') ?? '';
  if (contentType.includes('multipart/form-data')) {
    return parseMultipartBody(request);
  }
  return parseJsonOrThrow(request);
};

const parseMultipartBody = async (request: Request) => {
  const formData = await request.formData();
  const text = formData.get('text');
  if (typeof text !== 'string') {
    throw new ApiError('VALIDATION_ERROR', 400, 'Text is required.', false);
  }

  const image = formData.get('image');
  const imageDataUrl = await toImageDataUrl(image);
  return OpenAITestRequestSchema.parse({
    text,
    ...(imageDataUrl ? { imageDataUrl } : {}),
  });
};

const toImageDataUrl = async (image: FormDataEntryValue | null): Promise<string | undefined> => {
  if (!image) {
    return undefined;
  }
  if (!(image instanceof File)) {
    throw new ApiError('VALIDATION_ERROR', 400, 'Image upload is invalid.', false);
  }
  if (image.size === 0) {
    return undefined;
  }
  if (!SUPPORTED_IMAGE_TYPES.has(image.type)) {
    throw new ApiError('VALIDATION_ERROR', 400, 'Use PNG, JPEG, WEBP, or GIF image files.', false);
  }
  if (image.size > MAX_IMAGE_BYTES) {
    throw new ApiError('VALIDATION_ERROR', 400, 'Image must be 10MB or smaller.', false);
  }

  const bytes = await image.arrayBuffer();
  return `data:${image.type};base64,${arrayBufferToBase64(bytes)}`;
};

const parseJsonOrThrow = async (request: Request) => {
  try {
    return OpenAITestRequestSchema.parse(await request.json());
  } catch {
    throw new ApiError('VALIDATION_ERROR');
  }
};

const arrayBufferToBase64 = (bytes: ArrayBuffer): string => {
  const view = new Uint8Array(bytes);
  let binary = '';
  for (const byte of view) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
};
