import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export type AdminBreadcrumbCrumb = {
  href?: string;
  label: string;
};

export function AdminPageHeader({
  action,
  crumbs,
  description,
  icon: Icon,
  title,
}: {
  action?: ReactNode;
  crumbs?: AdminBreadcrumbCrumb[];
  description: string;
  icon?: LucideIcon;
  title: string;
}) {
  return (
    <header className="flex items-start gap-4">
      {Icon ? (
        <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground shadow-sm">
          <Icon aria-hidden="true" className="size-6" />
        </span>
      ) : null}

      <div className="min-w-0 flex-1">
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
            <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
              {title}
            </h1>
          </div>
          {action ? <div className="flex shrink-0 flex-wrap gap-2">{action}</div> : null}
        </div>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
          {description}
        </p>
      </div>
    </header>
  );
}
