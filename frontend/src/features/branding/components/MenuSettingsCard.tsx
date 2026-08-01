import { Menu, Plus, Save } from "lucide-react";

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
import type { NavigationItem } from "@/features/core/types";

import { ListaMeniuSortabila } from "../SortableMenuList";
import { UnsavedBadge } from "./UnsavedBadge";

export function MenuSettingsCard({
  disabled,
  elemente,
  esteGol,
  esteModificat,
  eroareIncarcare,
  onAdaugaSeparator,
  onRedenumesteSeparator,
  onSalveazaOrdinea,
  onSchimbaOrdinea,
  onStergeSeparator,
  ordinePending,
}: {
  disabled: boolean;
  elemente: NavigationItem[];
  esteGol: boolean;
  esteModificat: boolean;
  eroareIncarcare: boolean;
  onAdaugaSeparator: () => void;
  onRedenumesteSeparator: (element: NavigationItem) => void;
  onSalveazaOrdinea: () => void;
  onSchimbaOrdinea: (elemente: NavigationItem[]) => void;
  onStergeSeparator: (key: string) => void;
  ordinePending: boolean;
}) {
  return (
    <Card className="shadow-sm">
      <CardHeader className="border-b">
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
            <Menu aria-hidden="true" className="size-5" />
          </span>
          <div>
            <CardTitle>Ordinea meniului</CardTitle>
            <CardDescription className="mt-1">
              Trage elementele principale în poziția dorită sau adaugă separatoare pentru
              a grupa vizual secțiunile meniului.
            </CardDescription>
          </div>
        </div>
        {esteModificat ? (
          <CardAction>
            <UnsavedBadge />
          </CardAction>
        ) : null}
      </CardHeader>

      <CardContent>
        {eroareIncarcare ? (
          <p className="text-sm text-destructive">Meniul nu a putut fi încărcat.</p>
        ) : esteGol ? (
          <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed py-10 text-center">
            <Menu aria-hidden="true" className="size-5 text-muted-foreground" />
            <p className="font-medium">Meniul este gol</p>
            <p className="max-w-xs text-sm text-muted-foreground">
              Elementele de meniu apar automat pe măsură ce activezi module ale platformei.
            </p>
          </div>
        ) : (
          <ListaMeniuSortabila
            disabled={disabled}
            elemente={elemente}
            onRedenumesteSeparator={onRedenumesteSeparator}
            onSchimbaOrdinea={onSchimbaOrdinea}
            onStergeSeparator={onStergeSeparator}
          />
        )}
      </CardContent>

      <CardFooter className="flex flex-wrap gap-2">
        <Button disabled={disabled} onClick={onAdaugaSeparator} type="button" variant="outline">
          <Plus aria-hidden="true" />
          Adaugă separator
        </Button>
        <Button disabled={elemente.length === 0 || disabled} onClick={onSalveazaOrdinea} type="button">
          <Save aria-hidden="true" />
          {ordinePending ? "Se salvează…" : "Salvează ordinea"}
        </Button>
      </CardFooter>
    </Card>
  );
}
