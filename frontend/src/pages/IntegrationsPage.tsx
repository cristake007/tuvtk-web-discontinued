import { ArrowRight, CalendarDays } from "lucide-react";
import { Link } from "react-router-dom";

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

const integrations = [
  {
    description:
      "Sincronizează sărbătorile legale din România și gestionează zilele interne folosite în întreaga platformă.",
    href: "/administrare/integrari/zile-libere",
    icon: CalendarDays,
    name: "Zile libere și sărbători",
    provider: "Nager.Date",
    status: "Disponibilă",
  },
] as const;

export function IntegrationsPage() {
  return (
    <section className="flex min-w-0 flex-1 flex-col gap-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {integrations.map((integration) => {
          const Icon = integration.icon;

          return (
            <Card className="h-full transition-shadow hover:shadow-md" key={integration.href}>
              <CardHeader>
                <div className="flex items-start gap-3">
                  <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                    <Icon aria-hidden="true" className="size-5" />
                  </span>
                  <div className="min-w-0">
                    <CardTitle>{integration.name}</CardTitle>
                    <CardDescription className="mt-1">
                      {integration.provider}
                    </CardDescription>
                  </div>
                </div>
                <CardAction>
                  <Badge variant="secondary">{integration.status}</Badge>
                </CardAction>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-6 text-muted-foreground">
                  {integration.description}
                </p>
              </CardContent>
              <CardFooter className="mt-auto justify-end">
                <Button
                  nativeButton={false}
                  render={<Link to={integration.href} />}
                  variant="outline"
                >
                  Configurează
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
