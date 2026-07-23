import { notAuthorized } from "@/lib/requests";
import { createMiddleware } from "@tanstack/react-start";

/**
 * Middleware that gates a route behind a static admin API key.
 *
 * Expects the key in the `Authorization: Bearer <key>` header
 * and compares it against the `ADMIN_API_KEY` environment variable.
 * Returns 401 if the key is missing, empty, or does not match.
 */
export const adminApiKey = createMiddleware({ type: "request" }).server(
  async ({ next, request }) => {
    const authorizationHeader = request.headers.get("authorization");

    if (!authorizationHeader) {
      return notAuthorized();
    }

    const token = authorizationHeader.replace("Bearer ", "");

    if (!token) {
      return notAuthorized();
    }

    const adminKey = process.env.ADMIN_API_KEY;

    if (!adminKey) {
      return notAuthorized();
    }

    if (token !== adminKey) {
      return notAuthorized();
    }

    return next();
  },
);
