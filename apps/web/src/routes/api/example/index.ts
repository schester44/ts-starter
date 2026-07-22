import { createFileRoute } from "@tanstack/react-router";
import z from "zod";
import { tracingMiddleware } from "@/middleware/tracing";
import { apiKeyAuth } from "@/middleware/api-key-auth";
import {
  requestBody,
  queryParams,
  response,
  notFound,
  notAuthorized,
  errorResponse,
} from "@/lib/requests";

const GetQuerySchema = z.object({
  search: z.string().optional(),
  limit: z.coerce.number().int().positive().default(10),
});

const GetResponseSchema = z.object({
  message: z.string(),
  apiKeyId: z.string(),
  organizationId: z.string(),
  search: z.string().optional(),
  limit: z.number(),
});

const PostBodySchema = z.object({
  name: z.string().min(1),
  value: z.string(),
});

const PostResponseSchema = z.object({
  message: z.string(),
  received: z.object({
    name: z.string(),
    value: z.string(),
  }),
});

export const Route = createFileRoute("/api/example/")({
  server: {
    middleware: [tracingMiddleware, apiKeyAuth],
    handlers: {
      GET: async ({ request, context }) => {
        const query = await queryParams(request, GetQuerySchema);

        return response({
          data: {
            message: "Authenticated successfully",
            apiKeyId: context.apiKeyId,
            organizationId: context.activeOrganizationId,
            search: query.search,
            limit: query.limit,
          },
          schema: GetResponseSchema,
        });
      },
      POST: async ({ request, context }) => {
        const body = await requestBody(request, PostBodySchema);

        return response({
          data: {
            message: "Created successfully",
            received: body,
          },
          schema: PostResponseSchema,
          status: 201,
        });
      },
    },
  },
});
