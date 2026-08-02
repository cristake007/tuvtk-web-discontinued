import { useEffect } from "react";
import { ImageUp, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { textVariants } from "@/components/ui/text";
import { SectionTitle } from "@/components/ui/heading";
import { QueryApplicationState } from "@/components/QueryApplicationState";
import { FileUploadField } from "@/components/FileUploadField";
import { Button } from "@/components/ui/button";

import { useCompanyLogoSettings } from "./useCompanyLogoSettings";

export function CompanyLogoSettings() {
  const {
    configuredLogoUrl,
    displayedLogoUrl,
    isSaving,
    mutationError,
    removeConfiguredLogo,
    removePending,
    removeSuccess,
    selectedFile,
    selectionError,
    selectLogo,
    settingsQuery,
    uploadPending,
    uploadSelectedLogo,
    uploadSuccess,
  } = useCompanyLogoSettings();

  useEffect(() => {
    if (selectionError) {
      toast.warning("Fișierul selectat nu este valid", {
        description: selectionError,
      });
    }
  }, [selectionError]);

  useEffect(() => {
    if (mutationError) {
      toast.error("Sigla nu a putut fi actualizată", {
        description: mutationError,
      });
    }
  }, [mutationError]);

  useEffect(() => {
    if (uploadSuccess) {
      toast.success("Sigla companiei a fost actualizată.");
    }
  }, [uploadSuccess]);

  useEffect(() => {
    if (removeSuccess) {
      toast.success("Sigla companiei a fost eliminată.");
    }
  }, [removeSuccess]);

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
        loadingDescription="Se încarcă opțiunile interfeței utilizator."
        loadingTitle="Se încarcă interfața utilizator"
        onRetry={() => void settingsQuery.refetch()}
      />
    );
  }

  return (
    <div>
      <SectionTitle
        as="h3"
        className={textVariants({
          variant: "eticheta",
          className: "tracking-normal text-card-foreground sm:text-sm",
        })}
      >
        Sigla companiei
      </SectionTitle>
      <p
        className={textVariants({ variant: "interfata", className: "mt-1 text-muted-foreground" })}
      >
        Sigla este afișată în antetul meniului lateral pentru utilizatorii autentificați.
      </p>

      <div className="mt-4 grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <FileUploadField
          accept=".svg,image/svg+xml"
          description="Este acceptat un singur fișier SVG UTF-8, cu dimensiunea maximă de 256 KB."
          disabled={isSaving}
          emptyDescription="Trage aici fișierul SVG sau apasă pentru a-l selecta."
          emptyTitle="Selectează sigla companiei"
          file={selectedFile}
          icon={ImageUp}
          id="company-logo"
          label="Fișier SVG"
          onFileChange={selectLogo}
        />

        <div className="grid content-start gap-2">
          <p className={textVariants({ variant: "eticheta" })}>Previzualizare</p>
          <div className="flex min-h-44 items-center justify-center rounded-xl border bg-muted/20 p-5">
            {displayedLogoUrl ? (
              <img
                alt={`Previzualizare siglă ${settingsQuery.data.organization_name}`}
                className="max-h-24 max-w-full object-contain"
                src={displayedLogoUrl}
              />
            ) : (
              <div
                className={textVariants({
                  variant: "interfata",
                  className: "text-center text-muted-foreground",
                })}
              >
                Nu este configurată nicio siglă.
              </div>
            )}
          </div>
          <p
            className={textVariants({
              variant: "detaliu",
              className: "leading-5 text-muted-foreground",
            })}
          >
            Scripturile, resursele externe și stilurile nesigure sunt respinse la încărcare.
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button disabled={!selectedFile || isSaving} onClick={uploadSelectedLogo} type="button">
          <ImageUp aria-hidden="true" />
          {uploadPending ? "Se încarcă…" : "Încarcă sigla"}
        </Button>
        <Button
          disabled={!configuredLogoUrl || isSaving}
          onClick={removeConfiguredLogo}
          type="button"
          variant="destructive"
        >
          <Trash2 aria-hidden="true" />
          {removePending ? "Se elimină…" : "Elimină sigla"}
        </Button>
      </div>
    </div>
  );
}
