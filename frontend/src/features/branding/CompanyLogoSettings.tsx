import { useEffect } from "react";
import { ImageUp, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { ApplicationState } from "@/components/ApplicationState";
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

  if (settingsQuery.isPending) {
    return (
      <ApplicationState
        description="Se încarcă opțiunile interfeței utilizator."
        loading
        title="Se încarcă interfața utilizator"
      />
    );
  }

  if (settingsQuery.isError || !settingsQuery.data) {
    return (
      <ApplicationState
        actionLabel="Încearcă din nou"
        description="Configurarea interfeței utilizator nu a putut fi încărcată."
        onAction={() => void settingsQuery.refetch()}
        title="Interfața utilizator nu este disponibilă"
      />
    );
  }

  return (
    <div>
      <h3 className="text-sm font-medium">Sigla companiei</h3>
      <p className="mt-1 text-sm text-muted-foreground">
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
          <p className="text-sm font-medium">Previzualizare</p>
          <div className="flex min-h-44 items-center justify-center rounded-xl border bg-muted/20 p-5">
            {displayedLogoUrl ? (
              <img
                alt={`Previzualizare siglă ${settingsQuery.data.organization_name}`}
                className="max-h-24 max-w-full object-contain"
                src={displayedLogoUrl}
              />
            ) : (
              <div className="text-center text-sm text-muted-foreground">
                Nu este configurată nicio siglă.
              </div>
            )}
          </div>
          <p className="text-xs leading-5 text-muted-foreground">
            Scripturile, resursele externe și stilurile nesigure sunt respinse la
            încărcare.
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          disabled={!selectedFile || isSaving}
          onClick={uploadSelectedLogo}
          type="button"
        >
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
