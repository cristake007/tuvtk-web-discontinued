import type { FormEvent } from "react";
import { Save, Settings2 } from "lucide-react";

import { textVariants } from "@/components/ui/text";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { UnsavedBadge } from "./UnsavedBadge";

const NUME_APLICATIE_MAX_LENGTH = 120;

export function GeneralSettingsCard({
  esteModificat,
  numeAplicatie,
  onChangeNume,
  onSubmit,
  saving,
}: {
  esteModificat: boolean;
  numeAplicatie: string;
  onChangeNume: (nume: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  saving: boolean;
}) {
  return (
    <Card className="shadow-sm">
      <CardHeader className="border-b">
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
            <Settings2 aria-hidden="true" className="size-5" />
          </span>
          <div>
            <CardTitle>Identitatea aplicației</CardTitle>
            <CardDescription className="mt-1">
              Numele afișat în antet, în titlul filei de browser și pe paginile publice.
            </CardDescription>
          </div>
        </div>
        {esteModificat ? (
          <CardAction>
            <UnsavedBadge />
          </CardAction>
        ) : null}
      </CardHeader>

      <form onSubmit={onSubmit}>
        <CardContent>
          <div className="grid gap-2 sm:grid-cols-[12rem_minmax(0,28rem)] sm:items-center sm:gap-6">
            <Label htmlFor="nume-aplicatie">Numele aplicației</Label>
            <div className="space-y-1.5">
              <Input
                autoComplete="off"
                id="nume-aplicatie"
                maxLength={NUME_APLICATIE_MAX_LENGTH}
                onChange={(event) => onChangeNume(event.target.value)}
                value={numeAplicatie}
              />
              <p
                aria-live="polite"
                className={textVariants({
                  variant: "detaliu",
                  className: "text-right text-muted-foreground",
                })}
              >
                {numeAplicatie.length}/{NUME_APLICATIE_MAX_LENGTH}
              </p>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button disabled={!numeAplicatie.trim() || saving} type="submit">
            <Save aria-hidden="true" />
            Salvează
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
