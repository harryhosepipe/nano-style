import type { APIRoute } from 'astro';

import { handleRouteError, jsonSuccess } from '../../api/http';
import { TemplateCatalogSchema } from '../../schemas/domain';
import { TEMPLATE_CATALOG } from '../../session/templates';

export const GET: APIRoute = async (context) => {
  try {
    const templates = TemplateCatalogSchema.parse(TEMPLATE_CATALOG);
    return jsonSuccess(context, { templates });
  } catch (error) {
    return handleRouteError(context, error);
  }
};
