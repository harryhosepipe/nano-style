export const SESSION_COOKIE_NAME = 'nanostyle.sid';
export const SESSION_COOKIE_PATH = '/';
export const SESSION_COOKIE_HTTP_ONLY = true;
export const SESSION_COOKIE_SAME_SITE = 'lax' as const;
export const SESSION_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 12;

export const REQUEST_ID_HEADER = 'x-request-id';

export const API_ENDPOINTS = {
  templates: '/api/templates',
  sessionStart: '/api/session/start',
  sessionAnswer: '/api/session/answer',
  generate: '/api/generate',
} as const;
