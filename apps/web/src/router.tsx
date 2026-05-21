import { createRouter as createTanStackRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import { ErrorPage } from "./components/error-page";

export function getRouter() {
  return createTanStackRouter({
    routeTree,
    defaultPreload: "intent",
    scrollRestoration: true,
    defaultErrorComponent: ({ error }) => <ErrorPage message={error.message} />,
    defaultNotFoundComponent: () => (
      <div className="p-4">
        <h1 className="text-2xl font-bold">Not Found</h1>
        <p className="mt-2 text-muted-foreground">
          The page you're looking for doesn't exist.
        </p>
      </div>
    ),
  });
}
