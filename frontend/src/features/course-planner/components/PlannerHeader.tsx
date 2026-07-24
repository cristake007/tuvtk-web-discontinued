import { CalendarRange, History } from "lucide-react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";

export function PlannerHeader() {
  return (
    <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div className="flex min-w-0 items-start gap-4">
        <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground shadow-sm">
          <CalendarRange aria-hidden="true" className="size-6" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-medium text-primary">Planificator cursuri</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
            Generare perioade cursuri
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
            Configurează planificarea, generează perioadele și păstrează automat fiecare
            rezultat în istoric.
          </p>
        </div>
      </div>

      <Button render={<Link to="/planificator-cursuri/istoric" />} variant="outline">
        <History aria-hidden="true" />
        Istoric generări
      </Button>
    </header>
  );
}
