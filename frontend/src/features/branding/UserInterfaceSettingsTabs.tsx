import { Menu, Palette, Settings2 } from "lucide-react";

import { QueryApplicationState } from "@/components/QueryApplicationState";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { BrandingPanel } from "./components/BrandingPanel";
import { GeneralSettingsCard } from "./components/GeneralSettingsCard";
import { LiveShellPreview } from "./components/LiveShellPreview";
import { MenuSettingsCard } from "./components/MenuSettingsCard";
import { TypographySettingsCard } from "./components/TypographySettingsCard";
import { SeparatorTitleDialog } from "./SeparatorTitleDialog";
import { useUserInterfaceSettings } from "./useUserInterfaceSettings";

export function UserInterfaceSettingsTabs() {
  const {
    configuratieMutation,
    culori,
    culorileSuntModificate,
    deschideDialogRedenumire,
    deschideDialogSeparatorNou,
    dialogSeparatorDeschis,
    dimensiuneaTextuluiEsteModificata,
    elementeMeniu,
    fontScale,
    meniuEsteGol,
    meniuInCurs,
    navigationQuery,
    numeAplicatie,
    numeEsteModificat,
    ordineEsteModificata,
    ordineMutation,
    redenumesteSeparatorMutation,
    salveazaCulorile,
    salveazaDimensiuneaTextului,
    salveazaNumele,
    salveazaOrdinea,
    salveazaSeparator,
    separatorEditat,
    separatorMutation,
    setCulori,
    setDialogSeparatorDeschis,
    setElementeMeniu,
    setFontScale,
    setNumeAplicatie,
    settingsQuery,
    stergeSeparator,
  } = useUserInterfaceSettings();

  if (settingsQuery.isPending || settingsQuery.isError || !settingsQuery.data) {
    return (
      <QueryApplicationState
        error={
          settingsQuery.error ??
          new Error("Configurarea interfeței utilizator nu a putut fi încărcată.")
        }
        errorDescription="Configurarea interfeței utilizator nu a putut fi încărcată."
        errorTitle="Interfața utilizator nu este disponibilă"
        loading={settingsQuery.isPending}
        loadingDescription="Se încarcă setările disponibile."
        loadingTitle="Se încarcă interfața utilizator"
        onRetry={() => void settingsQuery.refetch()}
      />
    );
  }

  return (
    <div className="grid w-full gap-8">
      <LiveShellPreview
        culori={culori}
        elemente={elementeMeniu}
        fontScale={fontScale}
        logoUrl={settingsQuery.data.logo_url}
        numeAplicatie={numeAplicatie}
        organizationName={settingsQuery.data.organization_name}
      />

      <Tabs defaultValue="general">
        <TabsList
          aria-label="Setări interfață utilizator"
          className="w-full justify-start overflow-x-auto"
          variant="line"
        >
          <TabsTrigger value="general">
            <Settings2 aria-hidden="true" />
            General
          </TabsTrigger>
          <TabsTrigger value="branding">
            <Palette aria-hidden="true" />
            Branding
          </TabsTrigger>
          <TabsTrigger value="meniu">
            <Menu aria-hidden="true" />
            Meniu
          </TabsTrigger>
        </TabsList>

        <TabsContent className="pt-4" value="general">
          <div className="grid gap-4">
            <GeneralSettingsCard
              esteModificat={numeEsteModificat}
              numeAplicatie={numeAplicatie}
              onChangeNume={setNumeAplicatie}
              onSubmit={salveazaNumele}
              saving={configuratieMutation.isPending}
            />
            <TypographySettingsCard
              esteModificat={dimensiuneaTextuluiEsteModificata}
              fontScale={fontScale}
              onChangeFontScale={setFontScale}
              onSubmit={salveazaDimensiuneaTextului}
              saving={configuratieMutation.isPending}
            />
          </div>
        </TabsContent>

        <TabsContent className="pt-4" value="branding">
          <BrandingPanel
            culori={culori}
            culorileSuntModificate={culorileSuntModificate}
            onChangeCuloare={(camp, valoare) =>
              setCulori((curente) => ({ ...curente, [camp]: valoare }))
            }
            onSubmitCulori={salveazaCulorile}
            savingCulori={configuratieMutation.isPending}
          />
        </TabsContent>

        <TabsContent className="pt-4" value="meniu">
          <MenuSettingsCard
            disabled={meniuInCurs}
            elemente={elementeMeniu}
            eroareIncarcare={navigationQuery.isError}
            esteGol={meniuEsteGol}
            esteModificat={ordineEsteModificata}
            onAdaugaSeparator={deschideDialogSeparatorNou}
            onRedenumesteSeparator={deschideDialogRedenumire}
            onSalveazaOrdinea={salveazaOrdinea}
            onSchimbaOrdinea={setElementeMeniu}
            onStergeSeparator={stergeSeparator}
            ordinePending={ordineMutation.isPending}
          />
          <SeparatorTitleDialog
            initialTitle={separatorEditat?.label}
            isPending={separatorMutation.isPending || redenumesteSeparatorMutation.isPending}
            onOpenChange={setDialogSeparatorDeschis}
            onSave={salveazaSeparator}
            open={dialogSeparatorDeschis}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
