import type { FormEvent } from "react";
import { Palette } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import { CompanyLogoSettings } from "../CompanyLogoSettings";
import type { CuloriInterfata } from "../useUserInterfaceSettings";
import { BrandColorsSection } from "./BrandColorsSection";

export function BrandingPanel({
  culori,
  culorileSuntModificate,
  onChangeCuloare,
  onSubmitCulori,
  savingCulori,
}: {
  culori: CuloriInterfata;
  culorileSuntModificate: boolean;
  onChangeCuloare: (camp: keyof CuloriInterfata, valoare: string) => void;
  onSubmitCulori: (event: FormEvent<HTMLFormElement>) => void;
  savingCulori: boolean;
}) {
  return (
    <Card className="shadow-sm">
      <CardHeader className="border-b">
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
            <Palette aria-hidden="true" className="size-5" />
          </span>
          <div>
            <CardTitle as="h2">Branding</CardTitle>
            <CardDescription className="mt-1">
              Culorile și sigla care definesc identitatea vizuală a platformei.
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="divide-y">
        <div className="pb-6">
          <BrandColorsSection
            culori={culori}
            esteModificat={culorileSuntModificate}
            onChangeCuloare={onChangeCuloare}
            onSubmit={onSubmitCulori}
            saving={savingCulori}
          />
        </div>
        <div className="pt-6">
          <CompanyLogoSettings />
        </div>
      </CardContent>
    </Card>
  );
}
