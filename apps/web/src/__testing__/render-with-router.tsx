import { render, waitFor, type RenderOptions } from "@testing-library/react";
import type { ReactElement } from "react";
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
  Outlet,
} from "@tanstack/react-router";
import type { Role } from "@/lib/auth/roles";

interface AuthedUser {
  id: string;
  name: string;
  role: Role | null;
}

interface TestRouterOptions {
  /** Partial user to merge with defaults. Use `{ role }` as a shorthand. */
  user?: Partial<AuthedUser>;
  /** Initial URL the router navigates to (default: "/") */
  initialEntry?: string;
}

interface PendingRoute {
  path?: string;
  id?: string;
  component: () => ReactElement;
}

const DEFAULT_USER: AuthedUser = {
  id: "test-user-id",
  name: "Test User",
  role: "member",
};

/**
 * Create a test router builder that provides the `/_authed` route context.
 *
 * @example Basic usage
 * ```tsx
 * const router = createTestRouter({ user: { role: "admin" } });
 * const { getByText } = await router.render(<MyComponent />);
 * ```
 *
 * @example Adding extra routes
 * ```tsx
 * const router = createTestRouter({ user: { role: "admin" } });
 * router.addRoute({ path: "/settings", component: () => <Settings /> });
 * const { getByText } = await router.render(<MyComponent />);
 * ```
 */
export function createTestRouter(options: TestRouterOptions = {}) {
  const { user, initialEntry = "/" } = options;
  const testUser: AuthedUser = { ...DEFAULT_USER, ...user };
  const pendingRoutes: PendingRoute[] = [];
  let rendered = false;

  return {
    /**
     * Register an additional child route under `/_authed`.
     * Must be called before `render()`.
     */
    addRoute(route: PendingRoute) {
      if (rendered) {
        throw new Error(
          "createTestRouter: addRoute() must be called before render(). " +
            "Routes cannot be added after the router has been created.",
        );
      }

      pendingRoutes.push(route);

      return this;
    },

    /**
     * Build the router, render the component inside `/_authed`, and wait
     * for the router to settle. Returns all RTL queries plus `waitForRouter`.
     */
    async render(
      ui: ReactElement,
      renderOptions?: Omit<RenderOptions, "wrapper">,
    ) {
      rendered = true;
      const rootRoute = createRootRoute();

      const hasChildren = pendingRoutes.length > 0;

      const authedRoute = createRoute({
        getParentRoute: () => rootRoute,
        id: "_authed",
        beforeLoad: () => ({
          user: testUser,
          theme: "light",
        }),
        component: hasChildren
          ? () => (
              <>
                {ui}
                <Outlet />
              </>
            )
          : () => ui,
      });

      const childRoutes = pendingRoutes.map((r, i) => {
        const base = {
          getParentRoute: () => authedRoute,
          component: r.component,
        };

        return r.path
          ? createRoute({ ...base, path: r.path })
          : createRoute({ ...base, id: r.id ?? `test-route-${i}` });
      });

      if (childRoutes.length > 0) {
        authedRoute.addChildren(childRoutes);
      }

      const routeTree = rootRoute.addChildren([authedRoute]);

      const router = createRouter({
        routeTree,
        history: createMemoryHistory({ initialEntries: [initialEntry] }),
      });

      const result = render(<RouterProvider router={router} />, renderOptions);

      await waitFor(() => {
        if (router.state.status !== "idle") {
          throw new Error("Router still loading");
        }
      });

      return result;
    },
  };
}

/**
 * Shorthand: render a component inside a test router and wait for it to settle.
 *
 * @example
 * ```tsx
 * const { getByText } = await renderWithRouter(<MyComponent />, { user: { role: "admin" } });
 * ```
 */
export async function renderWithRouter(
  ui: ReactElement,
  options?: TestRouterOptions & Omit<RenderOptions, "wrapper">,
) {
  const { user, initialEntry, ...renderOptions } = options ?? {};

  return createTestRouter({ user, initialEntry }).render(ui, renderOptions);
}
