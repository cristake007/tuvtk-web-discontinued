import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";

import { Card } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

import { administrationGroups, type AdministrationGroup } from "./navigation";

function grupConineRutaActiva(group: AdministrationGroup, pathname: string) {
  return group.entries.some((entry) => entry.href && pathname.startsWith(entry.href));
}

function intrareaAreRutaDescendenta(group: AdministrationGroup, href: string) {
  return group.entries.some(
    (entry) => entry.href && entry.href.startsWith(`${href}/`),
  );
}

function AdminRailGroup({
  group,
  pathname,
}: {
  group: AdministrationGroup;
  pathname: string;
}) {
  const Icon = group.icon;
  const contineRutaActiva = grupConineRutaActiva(group, pathname);
  const [deschis, setDeschis] = useState(contineRutaActiva);

  useEffect(() => {
    if (contineRutaActiva) {
      setDeschis(true);
    }
  }, [contineRutaActiva]);

  return (
    <Collapsible onOpenChange={setDeschis} open={deschis}>
      <CollapsibleTrigger className="flex w-full cursor-pointer items-center gap-2 rounded-md px-2.5 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted/60">
        <Icon aria-hidden="true" className="size-4 shrink-0 text-primary" />
        <span className="flex-1 text-left">{group.name}</span>
        <ChevronDown
          aria-hidden="true"
          className={cn(
            "size-3.5 shrink-0 text-muted-foreground transition-transform",
            deschis && "rotate-180",
          )}
        />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <ul className="ml-[1.15rem] grid gap-0.5 border-l py-1 pl-3">
          {group.entries.map((entry) =>
            entry.href ? (
              <li key={entry.name}>
                <NavLink
                  className={({ isActive }) =>
                    cn(
                      "block rounded-md px-2.5 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-primary/5 hover:text-brand-red",
                      isActive && "bg-primary/5 font-medium text-brand-red",
                    )
                  }
                  end={intrareaAreRutaDescendenta(group, entry.href)}
                  to={entry.href}
                >
                  {entry.name}
                </NavLink>
              </li>
            ) : (
              <li key={entry.name}>
                <span className="flex items-center justify-between gap-2 px-2.5 py-1.5 text-sm text-muted-foreground/60">
                  {entry.name}
                  <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
                    Curând
                  </span>
                </span>
              </li>
            ),
          )}
        </ul>
      </CollapsibleContent>
    </Collapsible>
  );
}

export function AdminRail() {
  const location = useLocation();

  return (
    <Card className="w-full shrink-0 gap-0 p-2 sm:w-64">
      <nav aria-label="Secțiuni de administrare">
        <ul className="grid gap-1">
          {administrationGroups.map((group) => (
            <li key={group.name}>
              <AdminRailGroup group={group} pathname={location.pathname} />
            </li>
          ))}
        </ul>
      </nav>
    </Card>
  );
}
