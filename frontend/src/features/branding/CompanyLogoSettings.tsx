import { useEffect } from "react";
import { ImageUp, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { ApplicationState } from "@/components/ApplicationState";
import { FileUploadField } from "@/components/FileUploadField";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";

import { useCompanyLogoSettings } from "./useCompanyLogoSettings";

export function CompanyLogoSettings() {
  const {
    bootstrapQuery,
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

  if (bootstrapQuery.isPending) {
    return (
      <ApplicationState
        description="Se încarcă configurația vizuală a aplicației."
        loading
        title="Se încarcă setările"
      />
    );
  }

  if (bootstrapQuery.isError || !bootstrapQuery.data) {
    return (
      <ApplicationState
        actionLabel="Încearcă din nou"
        description="Setările aplicației nu au putut fi încărcate."
        onAction={() => void bootstrapQuery.refetch()}
        title="Setările nu sunt disponibile"
      />
    );
  }

  if (!bootstrapQuery.data.user?.is_staff) {
    return (
      <ApplicationState
        description="Este necesar acces de administrator pentru modificarea identității vizuale."
        title="Acces restricționat"
      />
    );
  }

  return (
    <Card className="max-w-4xl shadow-sm">
      <CardHeader className="border-b">
        <CardTitle>Sigla companiei</CardTitle>
        <CardDescription>
          Sigla este afișată în antetul meniului lateral pentru utilizatorii autentificați.
        </CardDescription>
      </CardHeader>

      <CardContent className="grid gap-6 pt-1 lg:grid-cols-[minmax(0,1fr)_18rem]">
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
                alt={`Previzualizare siglă ${bootstrapQuery.data.configuration.organization_name}`}
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
            Scripturile, resursele externe și stilurile nesigure sunt respinse la încărcare.
          </p>
        </div>
      </CardContent>

      <CardFooter className="flex flex-wrap gap-2">
        <Button
          disabled={!selectedFile || isSaving}
          onClick={uploadSelectedLogo}
          type="button"
        >
          {uploadPending ? <Spinner /> : <ImageUp aria-hidden="true" />}
          {uploadPending ? "Se încarcă…" : "Încarcă sigla"}
        </Button>
        <Button
          disabled={!configuredLogoUrl || isSaving}
          onClick={removeConfiguredLogo}
          type="button"
          variant="destructive"
        >
          {removePending ? <Spinner /> : <Trash2 aria-hidden="true" />}
          {removePending ? "Se elimină…" : "Elimină sigla"}
        </Button>
      </CardFooter>
    </Card>
  );
}
