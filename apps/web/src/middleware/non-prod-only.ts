import { createMiddleware } from "@tanstack/react-start";

/**
 * Middleware that blocks requests in production.
 *
 * Only allows requests through when `SEMANTIC_ENV` is set to
 * `"development"` or `"staging"`. In production (or when the
 * variable is unset), returns a 404 so the route appears to
 * not exist.
 */
export const nonProdOnly = createMiddleware({ type: "request" }).server(
  ({ next }) => {
    if (
      process.env.SEMANTIC_ENV !== "development" &&
      process.env.SEMANTIC_ENV !== "staging"
    ) {
      throw new Response("", { status: 404 });
    }

    return next();
  },
);
