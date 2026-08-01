import { ArrowLeft, Monitor } from "lucide-react";
import { Link } from "react-router-dom";

import { AntetAplicatie } from "@/components/AntetAplicatie";
import { Button } from "@/components/ui/button";
import { UserInterfaceSettingsTabs } from "@/features/branding/UserInterfaceSettingsTabs";

export function AdministrationUserInterfacePage() {
  return (
    <section className="flex min-w-0 flex-1 flex-col gap-6">
      <AntetAplicatie
        actiuni={
          <Button
          nativeButton={false}
          render={<Link to="/administrare" />}
          variant="outline"
          >
            <ArrowLeft aria-hidden="true" />
            Administrare
          </Button>
        }
        pictograma={Monitor}
        titlu="Interfață utilizator"
      />

      <UserInterfaceSettingsTabs />
    </section>
  );
}
