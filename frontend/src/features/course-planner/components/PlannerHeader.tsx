import { History } from "lucide-react";
import { Link } from "react-router";

import { AntetAplicatie } from "@/components/AntetAplicatie";
import { Button } from "@/components/ui/button";

export function PlannerHeader() {
  return (
    <AntetAplicatie
      actiuni={
        <Button
          nativeButton={false}
          render={<Link to="/planificator-cursuri/istoric" />}
          variant="outline"
        >
          <History aria-hidden="true" />
          Istoric generări
        </Button>
      }
      titlu="Generare perioade cursuri"
    />
  );
}
