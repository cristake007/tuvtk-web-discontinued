import type { ReactNode } from "react";
import { Outlet } from "react-router-dom";

import { AccessDenied } from "./StaffRoute";
import { useAuthenticatedBootstrap } from "./AuthenticatedBootstrapContext";
import { canAccessApplicationRoute } from "./routeAccess";
export function ApplicationAccessRoute({
  applicationKey,
  children,
}: {
  applicationKey: string;
  children?: ReactNode;
}) {
  const bootstrap = useAuthenticatedBootstrap();

  if (!canAccessApplicationRoute(bootstrap.accessible_application_keys, applicationKey)) {
    return <AccessDenied />;
  }
  return children ?? <Outlet />;
}
