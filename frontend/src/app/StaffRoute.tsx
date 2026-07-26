import { Outlet } from "react-router-dom";

import { useAuthenticatedBootstrap } from "./AuthenticatedBootstrapContext";
import { canAccessStaffRoute } from "./routeAccess";

export function StaffRoute() {
  const { user } = useAuthenticatedBootstrap();

  if (!canAccessStaffRoute(user)) {
    return <AccessDenied />;
  }

  return <Outlet />;
}

export function AccessDenied() {
  return (
    <section className="flex min-w-0 flex-1 items-start justify-center py-10">
      <div className="w-full max-w-xl rounded-xl border bg-card p-6 text-card-foreground shadow-sm">
        <h1 className="text-lg font-semibold">Acces interzis</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Nu ai permisiunea necesară pentru această pagină.
        </p>
      </div>
    </section>
  );
}
