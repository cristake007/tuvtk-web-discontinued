import type { FormEvent } from "react";
import { Save, Type } from "lucide-react";

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
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

import { FONT_SCALE_OPTIONS, type FontScale } from "../fontScale";
import { UnsavedBadge } from "./UnsavedBadge";

export function TypographySettingsCard({
  esteModificat,
  fontScale,
  onChangeFontScale,
  onSubmit,
  saving,
}: {
  esteModificat: boolean;
  fontScale: FontScale;
  onChangeFontScale: (value: FontScale) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  saving: boolean;
}) {
  return (
    <Card className="shadow-sm">
      <CardHeader className="border-b">
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
            <Type aria-hidden="true" className="size-5" />
          </span>
          <div>
            <CardTitle as="h2">Tipografie</CardTitle>
            <CardDescription className="mt-1">
              Dimensiunea textului se aplică global tuturor utilizatorilor și paginilor.
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
          <fieldset className="grid gap-3">
            <legend className={textVariants({ variant: "eticheta", className: "mb-1" })}>
              Dimensiunea textului
            </legend>
            <RadioGroup
              aria-label="Dimensiunea globală a textului"
              disabled={saving}
              name="font-scale"
              onValueChange={(value) => onChangeFontScale(value as FontScale)}
              value={fontScale}
            >
              {FONT_SCALE_OPTIONS.map((option) => (
                <div
                  className={[
                    "flex items-start gap-3 rounded-lg border p-3 transition-colors",
                    option.value === fontScale
                      ? "border-primary bg-primary/5"
                      : "border-border hover:bg-muted/40",
                  ].join(" ")}
                  key={option.value}
                >
                  <RadioGroupItem
                    aria-describedby={`font-scale-${option.value}-description`}
                    id={`font-scale-${option.value}`}
                    value={option.value}
                  />
                  <Label
                    className="grid flex-1 cursor-pointer gap-1"
                    htmlFor={`font-scale-${option.value}`}
                  >
                    <span>{option.label}</span>
                    <span
                      className="font-normal text-muted-foreground"
                      id={`font-scale-${option.value}-description`}
                    >
                      {option.description}
                    </span>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </fieldset>
        </CardContent>
        <CardFooter>
          <Button disabled={!esteModificat || saving} type="submit">
            <Save aria-hidden="true" />
            Salvează
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
