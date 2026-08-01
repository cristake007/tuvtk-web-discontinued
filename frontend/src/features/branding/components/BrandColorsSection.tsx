import { useEffect, useState, type FormEvent } from "react";
import { Save } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import type { CuloriInterfata } from "../useUserInterfaceSettings";
import { UnsavedBadge } from "./UnsavedBadge";

const HEX_COLOR_PATTERN = /^#[0-9a-f]{6}$/i;

const CAMPURI_CULORI: ReadonlyArray<{
  camp: keyof CuloriInterfata;
  descriere: string;
  eticheta: string;
}> = [
  {
    camp: "culoare_primara",
    descriere: "Antet, butoane principale și elemente de accent puternic.",
    eticheta: "Culoare primară",
  },
  {
    camp: "culoare_accent",
    descriere: "Evidențieri, notificări și stări active.",
    eticheta: "Culoare accent",
  },
  {
    camp: "culoare_fundal",
    descriere: "Fundalul paginilor publice ale aplicației.",
    eticheta: "Culoare fundal",
  },
  {
    camp: "culoare_titluri",
    descriere: "Titlurile de pagină, secțiune și card din toată aplicația.",
    eticheta: "Culoare titluri",
  },
];

function CampCuloare({
  camp,
  descriere,
  disabled,
  eticheta,
  onChange,
  valoare,
}: {
  camp: string;
  descriere: string;
  disabled: boolean;
  eticheta: string;
  onChange: (valoare: string) => void;
  valoare: string;
}) {
  const [textIntrodus, setTextIntrodus] = useState(valoare);

  useEffect(() => {
    setTextIntrodus(valoare);
  }, [valoare]);

  const esteValid = HEX_COLOR_PATTERN.test(textIntrodus);
  const idCamp = `culoare-${camp}`;

  return (
    <div className="space-y-2">
      <Label htmlFor={idCamp}>{eticheta}</Label>
      <div className="flex items-center gap-2">
        <Input
          aria-label={`Selector vizual pentru ${eticheta.toLowerCase()}`}
          className="h-9 w-11 shrink-0 p-1"
          disabled={disabled}
          onChange={(event) => {
            setTextIntrodus(event.target.value);
            onChange(event.target.value);
          }}
          type="color"
          value={esteValid ? textIntrodus : valoare}
        />
        <Input
          aria-invalid={!esteValid}
          className="font-mono text-sm"
          disabled={disabled}
          id={idCamp}
          maxLength={7}
          onBlur={() => {
            if (!esteValid) {
              setTextIntrodus(valoare);
            }
          }}
          onChange={(event) => {
            const text = event.target.value;
            setTextIntrodus(text);
            if (HEX_COLOR_PATTERN.test(text)) {
              onChange(text);
            }
          }}
          spellCheck={false}
          value={textIntrodus}
        />
      </div>
      <p className="text-xs leading-5 text-muted-foreground">{descriere}</p>
      {!esteValid ? (
        <p className="text-xs text-destructive">
          Introdu un cod hexazecimal valid, de exemplu <code>#164194</code>.
        </p>
      ) : null}
    </div>
  );
}

export function BrandColorsSection({
  culori,
  esteModificat,
  onChangeCuloare,
  onSubmit,
  saving,
}: {
  culori: CuloriInterfata;
  esteModificat: boolean;
  onChangeCuloare: (camp: keyof CuloriInterfata, valoare: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  saving: boolean;
}) {
  return (
    <form onSubmit={onSubmit}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-medium">Culori de bază</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Alege culorile folosite pentru elementele principale ale interfeței.
          </p>
        </div>
        {esteModificat ? <UnsavedBadge /> : null}
      </div>

      <fieldset className="mt-4" disabled={saving}>
        <legend className="sr-only">Culori de bază ale interfeței</legend>
        <ul className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {CAMPURI_CULORI.map(({ camp, descriere, eticheta }) => (
            <li key={camp}>
              <CampCuloare
                camp={camp}
                descriere={descriere}
                disabled={saving}
                eticheta={eticheta}
                onChange={(valoare) => onChangeCuloare(camp, valoare)}
                valoare={culori[camp]}
              />
            </li>
          ))}
        </ul>
      </fieldset>

      <Button className="mt-4" disabled={saving} type="submit">
        <Save aria-hidden="true" />
        Salvează culorile
      </Button>
    </form>
  );
}
