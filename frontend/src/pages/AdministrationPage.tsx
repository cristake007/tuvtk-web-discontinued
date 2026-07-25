import {
  ArrowRight,
  Database,
  Mail,
  PlugZap,
  Settings2,
  SlidersHorizontal,
  Users,
  type LucideIcon,
} from "lucide-react";
import { Link } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type AdministrationEntry = {
  description: string;
  href?: string;
  name: string;
};

type AdministrationGroup = {
  description: string;
  entries: AdministrationEntry[];
  icon: LucideIcon;
  name: string;
};

const administrationGroups: AdministrationGroup[] = [
  {
    description: "Setările generale și identitatea platformei.",
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
    description: "Conturi, echipe, roluri și drepturi de acces.",
    entries: [
      {
        description: "Gestionarea conturilor utilizatorilor platformei.",
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
    description: "Canalele de comunicare și mesajele platformei.",
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
    description: "Structura aplicației și procesele administrative.",
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
    description: "Importuri, fișiere și operațiuni asupra datelor.",
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
    description: "Servicii externe și sincronizări cu alte sisteme.",
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

function AdministrationEntryRow({ entry }: { entry: AdministrationEntry }) {
  const content = (
    <>
      <div className="min-w-0 flex-1">
        <p className="font-medium text-foreground">{entry.name}</p>
        <p className="mt-1 text-sm leading-5 text-muted-foreground">
          {entry.description}
        </p>
      </div>
      {entry.href ? (
        <>
          <Badge className="shrink-0" variant="secondary">
            Disponibil
          </Badge>
          <ArrowRight
            aria-hidden="true"
            className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary"
          />
        </>
      ) : (
        <Badge className="shrink-0" variant="outline">
          În pregătire
        </Badge>
      )}
    </>
  );

  const className =
    "group flex items-center gap-3 border-t px-4 py-3 text-left transition-colors first:border-t-0 hover:bg-muted/40";

  return entry.href ? (
    <Link className={className} to={entry.href}>
      {content}
    </Link>
  ) : (
    <div className={className}>{content}</div>
  );
}

export function AdministrationPage() {
  return (
    <section className="flex min-w-0 flex-1 flex-col gap-6">
      <header className="flex items-start gap-4">
        <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground shadow-sm">
          <Settings2 aria-hidden="true" className="size-6" />
        </span>
        <div>
          <p className="text-sm font-medium text-primary">Configurarea platformei</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
            Administrare
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
            Gestionează setările generale, utilizatorii, comunicarea, datele și
            serviciile externe ale platformei.
          </p>
        </div>
      </header>

      <div className="grid min-w-0 gap-5 xl:grid-cols-2">
        {administrationGroups.map((group) => {
          const Icon = group.icon;

          return (
            <Card className="overflow-hidden" key={group.name}>
              <CardHeader className="border-b bg-muted/20">
                <div className="flex items-start gap-3">
                  <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                    <Icon aria-hidden="true" className="size-5" />
                  </span>
                  <div>
                    <CardTitle>{group.name}</CardTitle>
                    <CardDescription className="mt-1">
                      {group.description}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {group.entries.map((entry) => (
                  <AdministrationEntryRow entry={entry} key={entry.name} />
                ))}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
