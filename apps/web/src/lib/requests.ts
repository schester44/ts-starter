import z from "zod";
import { logger } from "./logger";
import { AppError, UnauthorizedError } from "./errors";
import { toHttpError } from "./errors";

export async function requestBody<T extends z.ZodSchema>(
  request: Request,
  schema: T,
): Promise<z.infer<T>> {
  try {
    const body = await request.json();

    const parsedBody = await schema.safeParseAsync(body);

    if (!parsedBody.success) {
      logger.warn({
        msg: "Invalid request body",
        issues: parsedBody.error.issues,
      });

      throw Response.json(
        {
          error: "Invalid request body",
          details: parsedBody.error.issues,
        },
        { status: 400 },
      );
    }

    return parsedBody.data;
  } catch (error) {
    logger.error({ error });

    if (error instanceof Response) {
      throw error;
    }

    throw Response.json(
      {
        error: "Invalid JSON body",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 400 },
    );
  }
}

export async function urlParams<T extends z.ZodSchema>(
  params: Record<string, string>,
  schema: T,
): Promise<z.infer<T>> {
  const parsedQuery = await schema.safeParseAsync(params);

  if (!parsedQuery.success) {
    throw Response.json(
      {
        error: "Invalid URL parameters",
        details: parsedQuery.error.issues,
      },
      { status: 400 },
    );
  }

  return parsedQuery.data;
}

export async function queryParams<T extends z.ZodSchema>(
  request: Request,
  schema: T,
): Promise<z.infer<T>> {
  const url = new URL(request.url);

  const queryParams: Record<string, string | string[]> = {};

  for (const key of new Set(url.searchParams.keys())) {
    const values = url.searchParams.getAll(key);
    queryParams[key] = values.length > 1 ? values : values[0]!;
  }

  const parsedQuery = await schema.safeParseAsync(queryParams);

  if (!parsedQuery.success) {
    throw Response.json(
      {
        error: "Invalid query parameters",
        details: parsedQuery.error.issues,
      },
      { status: 400 },
    );
  }

  return parsedQuery.data;
}

export type TypedResponse<T> = Response & { __bodyType: T };

export async function response<T extends z.ZodSchema>({
  data,
  schema,
  status,
}: {
  data: z.infer<T>;
  schema: T;
  status?: number;
}): Promise<TypedResponse<z.infer<T>>> {
  const parsedResponse = await schema.safeParseAsync(data);

  if (!parsedResponse.success) {
    throw Response.json(
      {
        error: "Could not parse response",
        details: parsedResponse.error.issues,
      },
      { status: 500 },
    );
  }

  return Response.json(parsedResponse.data, {
    status: status ?? 200,
  }) as TypedResponse<z.infer<T>>;
}

export function notFound(resource: string) {
  return Response.json(
    {
      error: `${resource} not found`,
      details: { code: `${resource}_not_found`.toUpperCase() },
    },
    { status: 404 },
  ) as TypedResponse<{
    error: string;
    details: { code: string };
  }>;
}

export function notAuthorized() {
  return errorResponse(new UnauthorizedError("Unauthorized"));
}

export function errorResponse(error: AppError): Response;
export function errorResponse(
  error: string,
  code: string,
  opts?: { status?: number; details?: Record<string, unknown> },
): Response;
export function errorResponse(
  error: string | AppError,
  code?: string,
  opts: { status?: number; details?: Record<string, unknown> } = {},
) {
  if (error instanceof AppError) {
    const erro = toHttpError(error);

    return Response.json(erro.body, { status: erro.status });
  }

  return Response.json(
    {
      error,
      details: {
        code: code!.toUpperCase(),
        ...opts.details,
      },
    },
    { status: opts.status ?? 500 },
  );
}
