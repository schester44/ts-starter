import { usePermission } from "@/hooks/use-permission";
import { statement } from "@/lib/auth/permissions";
import type { ReactNode } from "react";

type PermissionGateProps<R, A> = {
  resource: R;
  action: A;
  children: ReactNode;
  fallback?: ReactNode;
};

export function PermissionGate<
  Resource extends keyof typeof statement,
  Action extends (typeof statement)[Resource][number],
>({
  resource,
  action,
  children,
  fallback = null,
}: PermissionGateProps<Resource, Action>) {
  const { hasPermission } = usePermission();

  const allowed = hasPermission(resource, action);

  return allowed ? <>{children}</> : <>{fallback}</>;
}
