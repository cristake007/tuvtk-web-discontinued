import { useMemo, useState } from "react";
import { ArrowRight, LayoutGrid, Search } from "lucide-react";
import { Link } from "react-router-dom";

import { Card, CardContent } from "@/components/ui/card";
import { SectionTitle } from "@/components/ui/heading";
import { Input } from "@/components/ui/input";
import { StaticCatalogPage } from "@/components/StaticCatalogPage";
import {
  administrationGroups,
  type AdministrationEntry,
  type AdministrationGroup,
} from "@/features/administration/navigation";

function normalizeSearchValue(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("ro-RO");
}

function AdministrationEntryRow({ entry }: { entry: AdministrationEntry }) {
  const content = (
    <>
      <p
        className={`col-start-1 row-start-1 font-medium ${
          entry.href ? "text-primary" : "text-foreground"
        }`}
      >
        {entry.name}
      </p>
      <p className="col-start-1 row-start-2 text-sm leading-5 text-muted-foreground sm:col-start-2 sm:row-start-1">
        {entry.description}
      </p>
      {entry.href ? (
        <ArrowRight
          aria-hidden="true"
          className="col-start-2 row-span-2 row-start-1 size-4 shrink-0 self-center text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary sm:col-start-3 sm:row-span-1"
        />
      ) : (
        <span
          aria-hidden="true"
          className="col-start-2 row-span-2 row-start-1 size-4 sm:col-start-3 sm:row-span-1"
        />
      )}
    </>
  );

  const className =
    "group grid min-h-12 grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1 bg-background px-4 py-3 text-left sm:grid-cols-[minmax(0,15rem)_minmax(0,1fr)_auto]";

  return (
    <li className="border-t first:border-t-0">
      {entry.href ? (
        <Link className={`${className} transition-colors hover:bg-muted/40`} to={entry.href}>
          {content}
        </Link>
      ) : (
        <div className={className}>{content}</div>
      )}
    </li>
  );
}

export function AdministrationPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const normalizedQuery = normalizeSearchValue(searchQuery.trim());
  const hasQuery = normalizedQuery.length > 0;

  const filteredGroups = useMemo(() => {
    if (!hasQuery) {
      return [];
    }

    return administrationGroups.reduce<AdministrationGroup[]>((groups, group) => {
      const groupMatches = normalizeSearchValue(group.name).includes(normalizedQuery);
      const matchingEntries = groupMatches
        ? group.entries
        : group.entries.filter((entry) =>
            [entry.name, entry.description].some((value) =>
              normalizeSearchValue(value).includes(normalizedQuery),
            ),
          );

      if (matchingEntries.length > 0) {
        groups.push({ ...group, entries: matchingEntries });
      }

      return groups;
    }, []);
  }, [hasQuery, normalizedQuery]);

  return (
    <StaticCatalogPage>
      <div className="relative w-full">
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          aria-label="Caută în administrare"
          className="h-10 pl-9"
          onChange={(event) => setSearchQuery(event.currentTarget.value)}
          placeholder="Caută o secțiune sau o setare..."
          type="search"
          value={searchQuery}
        />
      </div>

      {!hasQuery ? (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed py-16 text-center">
          <LayoutGrid aria-hidden="true" className="size-6 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Alege o secțiune din meniu sau caută o setare.
          </p>
        </div>
      ) : filteredGroups.length > 0 ? (
        <ul className="grid min-w-0 gap-10">
          {filteredGroups.map((group) => {
            const Icon = group.icon;

            return (
              <li key={group.name}>
                <section className="grid min-w-0 gap-3">
                  <div className="flex items-center gap-2 px-1">
                    <Icon aria-hidden="true" className="size-5 shrink-0 text-primary" />
                    <SectionTitle>{group.name}</SectionTitle>
                  </div>

                  <Card className="gap-0 rounded-md bg-background py-0">
                    <ul>
                      {group.entries.map((entry) => (
                        <AdministrationEntryRow entry={entry} key={entry.name} />
                      ))}
                    </ul>
                  </Card>
                </section>
              </li>
            );
          })}
        </ul>
      ) : (
        <Card className="border-dashed bg-background">
          <CardContent className="flex flex-col items-center gap-2 py-10 text-center">
            <Search aria-hidden="true" className="size-5 text-muted-foreground" />
            <p className="font-medium">Nu am găsit rezultate</p>
            <p className="text-sm text-muted-foreground">Încearcă un alt termen de căutare.</p>
          </CardContent>
        </Card>
      )}
    </StaticCatalogPage>
  );
}
