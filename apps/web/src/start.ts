import { createStart, createCsrfMiddleware } from "@tanstack/react-start";

export default createStart(() => ({
  functionMiddleware: [createCsrfMiddleware()],
}));
