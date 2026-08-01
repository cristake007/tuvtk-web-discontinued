import {
  ArrowRight,
  CalendarRange,
  FileCode2,
  History,
  ScanText,
} from "lucide-react";
import { Link } from "react-router-dom";

import { AntetAplicatie } from "@/components/AntetAplicatie";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const plannerModules = [
  {
    action: "Deschide generatorul",
    description:
      "Configurează lunile și regulile de distribuție, generează perioadele cursurilor și descarcă rezultatul în Excel.",
    href: "/planificator-cursuri/generator",
    icon: CalendarRange,
    name: "Generare perioade",
    status: "Disponibil",
    statusVariant: "secondary" as const,
  },
  {
    action: "Vezi istoricul",
    description:
      "Consultă generările salvate și descarcă fișierele disponibile pentru fiecare planificare.",
    href: "/planificator-cursuri/istoric",
    icon: History,
    name: "Istoric generări",
    status: "Disponibil",
    statusVariant: "secondary" as const,
  },
  {
    action: "Deschide modulul",
    description:
      "Pregătește și validează fișierele XML folosite pentru publicarea și transferul datelor cursurilor.",
    href: "/planificator-cursuri/xml",
    icon: FileCode2,
    name: "XML cursuri",
    status: "În pregătire",
    statusVariant: "outline" as const,
  },
  {
    action: "Deschide modulul",
    description:
      "Potrivește datele cursurilor cu documentele Word și verifică automat câmpurile care trebuie completate.",
    href: "/planificator-cursuri/word-matcher",
    icon: ScanText,
    name: "Word Matcher",
    status: "În pregătire",
    statusVariant: "outline" as const,
  },
] as const;

export function CoursePlannerPage() {
  return (
    <section className="flex min-w-0 flex-1 flex-col gap-6">
      <AntetAplicatie titlu="Planificator cursuri" />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {plannerModules.map((module) => {
          const Icon = module.icon;

          return (
            <Card className="h-full transition-shadow hover:shadow-md" key={module.href}>
              <CardHeader>
                <div className="flex items-start gap-3">
                  <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                    <Icon aria-hidden="true" className="size-5" />
                  </span>
                  <div className="min-w-0">
                    <CardTitle>{module.name}</CardTitle>
                    <CardDescription className="mt-1">Planificator cursuri</CardDescription>
                  </div>
                </div>
                <CardAction>
                  <Badge variant={module.statusVariant}>{module.status}</Badge>
                </CardAction>
              </CardHeader>
              <CardContent>
                <p className="text-base leading-6 text-muted-foreground">{module.description}</p>
              </CardContent>
              <CardFooter className="mt-auto justify-end">
                <Button
                  nativeButton={false}
                  render={<Link to={module.href} />}
                  variant="outline"
                >
                  {module.action}
                  <ArrowRight aria-hidden="true" />
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
