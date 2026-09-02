import { createStart } from "@tanstack/react-start";

// NOTE: TanStack Start's client hydration imports `{ startInstance }` from
// this file (via the #tanstack-start-entry alias) — a default export is
// never picked up, which silently breaks hydration: the page renders as
// static SSR HTML, with no interactivity and no HMR.
//
// createCsrfMiddleware is intentionally NOT used: it doesn't exist in the
// @tanstack/react-start version pinned by yarn.lock (first ships in
// 1.168.10), and on newer versions it 403s server-function calls during
// SSR, which crashes dehydration. Revisit alongside a coordinated
// TanStack Start upgrade.
export const startInstance = createStart(() => ({}));
