const isDev = process.env.NODE_ENV === "development";

export class AppError extends Error {
  constructor(
    public kind:
      | "VALIDATION"
      | "NOT_FOUND"
      | "CONFLICT"
      | "UNAUTHORIZED"
      | "INTERNAL",
    message: string,
    public data: Record<string, unknown> = {},
    public type?: string,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Not found", data: Record<string, unknown> = {}) {
    super("NOT_FOUND", message, data, "NOT_FOUND");
    this.name = "NotFoundError";
  }
}

export class ValidationError extends AppError {
  constructor(
    message = "Validation failed",
    data: Record<string, unknown> = {},
  ) {
    super("VALIDATION", message, data, "VALIDATION");
    this.name = "ValidationError";
  }
}

export class ConflictError extends AppError {
  constructor(message = "Conflict", data: Record<string, unknown> = {}) {
    super("CONFLICT", message, data, "CONFLICT");
    this.name = "ConflictError";
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized", data: Record<string, unknown> = {}) {
    super("UNAUTHORIZED", message, data, "UNAUTHORIZED");
    this.name = "UnauthorizedError";
  }
}

export function toHttpError(err: unknown): {
  status: number;
  body: { error: string; details: Record<string, unknown> };
} {
  if (err instanceof AppError) {
    const status =
      err.kind === "VALIDATION"
        ? 400
        : err.kind === "NOT_FOUND"
          ? 404
          : err.kind === "CONFLICT"
            ? 409
            : err.kind === "UNAUTHORIZED"
              ? 401
              : 500;

    return {
      status,
      body: {
        error: err.message,
        details: {
          code: err.type,
          ...err.data,
          ...((isDev && { __dev__: err }) || {}),
        },
      },
    };
  }

  if (err instanceof Error) {
    return {
      status: 500,
      body: {
        error: isDev ? err.message : "Internal server error",
        details: {
          code: "INTERNAL_ERROR",
          ...((isDev && { __dev__: { stack: err.stack } }) || {}),
        },
      },
    };
  }

  return {
    status: 500,
    body: {
      error: "Internal server error",
      details: { code: "UNKNOWN_ERROR" },
    },
  };
}
