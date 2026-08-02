import type { ReactNode } from "react";
import { Link } from "react-router";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { PageTitle } from "@/components/ui/heading";

export type AdminBreadcrumbCrumb = {
  href?: string;
  label: string;
};

export function AdminPageHeader({
  action,
  crumbs,
  description,
  title,
}: {
  action?: ReactNode;
  crumbs?: AdminBreadcrumbCrumb[];
  description: string;
  title: string;
}) {
  return (
    <header>
      <div className="min-w-0">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            {crumbs && crumbs.length > 0 ? (
              <Breadcrumb>
                <BreadcrumbList>
                  {crumbs.flatMap((crumb, index) => {
                    const item = (
                      <BreadcrumbItem key={crumb.label}>
                        {crumb.href ? (
                          <BreadcrumbLink render={<Link to={crumb.href} />}>
                            {crumb.label}
                          </BreadcrumbLink>
                        ) : (
                          <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                        )}
                      </BreadcrumbItem>
                    );
                    return index === 0
                      ? [item]
                      : [<BreadcrumbSeparator key={`${crumb.label}-sep`} />, item];
                  })}
                </BreadcrumbList>
              </Breadcrumb>
            ) : null}
            <PageTitle className="mt-1">{title}</PageTitle>
          </div>
          {action ? <div className="flex shrink-0 flex-wrap gap-2">{action}</div> : null}
        </div>
        <p className="mt-2 max-w-3xl text-base leading-6 text-muted-foreground">{description}</p>
      </div>
    </header>
  );
}
