import { useRouteContext } from "@tanstack/react-router";
import { checkPermission } from "@/lib/auth/check-permission";
import { statement } from "@/lib/auth/permissions";
import type { Role } from "@/lib/auth/roles";
import { useRef } from "react";

export function usePermission() {
  const context = useRouteContext({ from: "/_authed" });
  const cachedRole = useRef(context.session?.user?.role as Role | null);

  if (context.session?.user?.role && context.session.user.role !== cachedRole.current) {
    cachedRole.current = context.session.user.role as Role;
  }

  const hasPermission = <
    Resource extends keyof typeof statement,
    Action extends (typeof statement)[Resource][number],
  >(
    resource: Resource,
    action: Action,
  ): boolean => {
    return checkPermission(cachedRole.current, resource, action);
  };

  return { hasPermission, role: cachedRole.current };
}
