import { useMemo, useState } from "react";
import {
  ArrowRight,
  Database,
  Mail,
  PlugZap,
  Search,
  Settings2,
  SlidersHorizontal,
  Users,
  type LucideIcon,
} from "lucide-react";
import { Link } from "react-router-dom";

import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type AdministrationEntry = {
  description: string;
  href?: string;
  name: string;
};

type AdministrationGroup = {
  entries: AdministrationEntry[];
  icon: LucideIcon;
  name: string;
};

const administrationGroups: AdministrationGroup[] = [
  {
    entries: [
      {
        description:
          "Configurează identitatea vizuală și opțiunile de prezentare ale platformei.",
        href: "/administrare/sistem/interfata-utilizator",
        name: "Interfață utilizator",
      },
      {
        description: "Parametrii generali utilizați în întreaga platformă.",
        name: "Setări generale",
      },
      {
        description: "Politicile de autentificare și securitate a accesului.",
        name: "Autentificare",
      },
      {
        description: "Preferințele pentru notificările din aplicație.",
        name: "Notificări",
      },
    ],
    icon: Settings2,
    name: "Sistem",
  },
  {
    entries: [
      {
        description: "Gestionarea conturilor utilizatorilor platformei.",
        href: "/administrare/utilizatori",
        name: "Utilizatori",
      },
      {
        description: "Organizarea utilizatorilor în echipe și departamente.",
        name: "Echipe",
      },
      {
        description: "Rolurile și permisiunile disponibile în fiecare modul.",
        name: "Roluri și permisiuni",
      },
      {
        description: "Istoricul autentificărilor și al sesiunilor utilizatorilor.",
        name: "Istoric autentificări",
      },
    ],
    icon: Users,
    name: "Utilizatori",
  },
  {
    entries: [
      {
        description: "Serviciul utilizat pentru trimiterea e-mailurilor.",
        name: "E-mailuri de ieșire",
      },
      {
        description: "Conturile de e-mail conectate la platformă.",
        name: "Conturi e-mail",
      },
      {
        description: "Modelele reutilizabile pentru mesajele trimise.",
        name: "Șabloane e-mail",
      },
    ],
    icon: Mail,
    name: "Mesagerie",
  },
  {
    entries: [
      {
        description: "Elementele, ordinea și accesul în meniul aplicației.",
        name: "Navigație aplicație",
      },
      {
        description: "Procesele automate executate în fundal.",
        name: "Sarcini programate",
      },
      {
        description: "Istoricul acțiunilor administrative importante.",
        name: "Jurnal de activitate",
      },
    ],
    icon: SlidersHorizontal,
    name: "Configurare",
  },
  {
    entries: [
      {
        description: "Importul controlat al datelor în platformă.",
        name: "Import date",
      },
      {
        description: "Fișierele încărcate și utilizate de module.",
        name: "Fișiere atașate",
      },
      {
        description: "Evenimentele și erorile tehnice ale aplicației.",
        name: "Jurnal aplicație",
      },
    ],
    icon: Database,
    name: "Date",
  },
  {
    entries: [
      {
        description:
          "Sincronizează sărbătorile legale și gestionează zilele interne nelucrătoare.",
        href: "/administrare/integrari/zile-libere",
        name: "Zile libere și sărbători",
      },
      {
        description: "Configurează serviciile externe disponibile în platformă.",
        href: "/administrare/integrari",
        name: "Toate integrările",
      },
    ],
    icon: PlugZap,
    name: "Integrări",
  },
];

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
    "group grid min-h-12 grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1 border-t bg-background px-4 py-3 text-left first:border-t-0 sm:grid-cols-[minmax(0,15rem)_minmax(0,1fr)_auto]";

  return entry.href ? (
    <Link className={`${className} transition-colors hover:bg-muted/40`} to={entry.href}>
      {content}
    </Link>
  ) : (
    <div className={className}>{content}</div>
  );
}

export function AdministrationPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredGroups = useMemo(() => {
    const normalizedQuery = normalizeSearchValue(searchQuery.trim());

    if (!normalizedQuery) {
      return administrationGroups;
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
  }, [searchQuery]);

  return (
    <section className="flex min-w-0 flex-1 flex-col gap-6 bg-background">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Administrare
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
          Gestionează setările generale, utilizatorii, comunicarea, datele și
          serviciile externe ale platformei.
        </p>
      </header>

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

      <div className="grid min-w-0 gap-10">
        {filteredGroups.map((group) => {
          const Icon = group.icon;

          return (
            <section className="grid min-w-0 gap-3" key={group.name}>
              <div className="flex items-center gap-2 px-1">
                <Icon aria-hidden="true" className="size-5 shrink-0 text-primary" />
                <h2 className="text-lg font-semibold tracking-tight text-primary">
                  {group.name}
                </h2>
              </div>

              <Card className="gap-0 rounded-md bg-background py-0">
                {group.entries.map((entry) => (
                  <AdministrationEntryRow entry={entry} key={entry.name} />
                ))}
              </Card>
            </section>
          );
        })}

        {filteredGroups.length === 0 ? (
          <Card className="border-dashed bg-background">
            <CardContent className="flex flex-col items-center gap-2 py-10 text-center">
              <Search aria-hidden="true" className="size-5 text-muted-foreground" />
              <p className="font-medium">Nu am găsit rezultate</p>
              <p className="text-sm text-muted-foreground">
                Încearcă un alt termen de căutare.
              </p>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </section>
  );
}
