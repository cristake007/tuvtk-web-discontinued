import { ArrowLeft, Settings2 } from "lucide-react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { CompanyLogoSettings } from "@/features/branding/CompanyLogoSettings";

export function AdministrationSystemPage() {
  return (
    <section className="flex min-w-0 flex-1 flex-col gap-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <Settings2 aria-hidden="true" className="size-6" />
          </span>
          <div>
            <p className="text-sm font-medium text-primary">Administrare · Sistem</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
              Identitate vizuală
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
              Configurează elementele vizuale utilizate în interfața platformei.
            </p>
          </div>
        </div>

        <Button
          nativeButton={false}
          render={<Link to="/administrare" />}
          variant="outline"
        >
          <ArrowLeft aria-hidden="true" />
          Administrare
        </Button>
      </header>

      <CompanyLogoSettings />
    </section>
  );
}
