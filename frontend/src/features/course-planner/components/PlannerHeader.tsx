import { CalendarRange, History, LayoutGrid } from "lucide-react";
import { Link } from "react-router-dom";

import { AntetAplicatie } from "@/components/AntetAplicatie";
import { Button } from "@/components/ui/button";

export function PlannerHeader() {
  return (
    <AntetAplicatie
      actiuni={
        <>
        <Button
          nativeButton={false}
          render={<Link to="/planificator-cursuri" />}
          variant="outline"
        >
          <LayoutGrid aria-hidden="true" />
          Toate modulele
        </Button>
        <Button
          nativeButton={false}
          render={<Link to="/planificator-cursuri/istoric" />}
          variant="outline"
        >
          <History aria-hidden="true" />
          Istoric generări
        </Button>
        </>
      }
      pictograma={CalendarRange}
      titlu="Generare perioade cursuri"
    />
  );
}
