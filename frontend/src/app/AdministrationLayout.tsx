import type { ReactNode } from "react";
import { Outlet, useMatches } from "react-router";

import { AdminRail } from "@/features/administration/AdminRail";

type AdministrationRouteHandle = {
  header?: ReactNode;
};

export function AdministrationLayout() {
  const matches = useMatches();
  const header = matches
    .map((match) => (match.handle as AdministrationRouteHandle | undefined)?.header)
    .findLast((value): value is ReactNode => value !== undefined);

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-6">
      {header ?? null}

      <div className="flex min-w-0 flex-1 flex-col gap-6 lg:flex-row lg:items-start lg:gap-8">
        <AdminRail />
        <div className="min-w-0 flex-1">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
