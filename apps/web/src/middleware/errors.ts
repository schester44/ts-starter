import { toHttpError } from "@/lib/errors";
import { createMiddleware } from "@tanstack/react-start";

export const errorHandlingMiddleware = createMiddleware({
  type: "request",
}).server(async ({ next }) => {
  try {
    const response = await next();

    return response;
  } catch (error) {
    const erro = toHttpError(error);

    return Response.json(erro.body, { status: erro.status });
  }
});
