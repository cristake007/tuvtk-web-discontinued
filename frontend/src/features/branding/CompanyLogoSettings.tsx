import { ImageUp, Trash2 } from "lucide-react";

import { ApplicationState } from "@/components/ApplicationState";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { useCompanyLogoSettings } from "./useCompanyLogoSettings";

export function CompanyLogoSettings() {
  const {
    bootstrapQuery,
    configuredLogoUrl,
    displayedLogoUrl,
    fileInputRef,
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

  if (bootstrapQuery.isPending) {
    return (
      <ApplicationState
        description="Loading the current application configuration."
        loading
        title="Loading settings"
      />
    );
  }

  if (bootstrapQuery.isError || !bootstrapQuery.data) {
    return (
      <ApplicationState
        actionLabel="Try again"
        description="The application settings could not be loaded."
        onAction={() => void bootstrapQuery.refetch()}
        title="Settings are unavailable"
      />
    );
  }

  if (!bootstrapQuery.data.user.is_staff) {
    return (
      <ApplicationState
        description="Administrator access is required to change application branding."
        title="Access denied"
      />
    );
  }

  return (
    <Card className="max-w-3xl">
      <CardHeader>
        <CardTitle>Company logo</CardTitle>
        <CardDescription>
          Upload a UTF-8 SVG file. Scripts, external resources, event handlers,
          and unsafe CSS are rejected by the backend.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <div className="flex min-h-28 items-center justify-center border border-dashed border-border bg-muted/30 p-5">
          {displayedLogoUrl ? (
            <img
              alt={`${bootstrapQuery.data.configuration.organization_name} logo preview`}
              className="max-h-20 max-w-full object-contain"
              src={displayedLogoUrl}
            />
          ) : (
            <div className="text-center text-sm text-muted-foreground">
              No company logo is configured.
            </div>
          )}
        </div>

        <div className="grid gap-2">
          <label className="text-sm font-medium" htmlFor="company-logo">
            SVG file
          </label>
          <input
            accept=".svg,image/svg+xml"
            className="block w-full cursor-pointer rounded-lg border border-input bg-background px-3 py-2 text-sm file:mr-3 file:cursor-pointer file:border-0 file:bg-secondary file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-secondary-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isSaving}
            id="company-logo"
            onChange={(event) => selectLogo(event.currentTarget.files?.[0])}
            ref={fileInputRef}
            type="file"
          />
          <p className="text-xs text-muted-foreground">
            Maximum size: 256 KB. Only one SVG logo is stored.
          </p>
        </div>

        {selectionError || mutationError ? (
          <Alert variant="destructive">
            <AlertTitle>Logo update failed</AlertTitle>
            <AlertDescription>{selectionError ?? mutationError}</AlertDescription>
          </Alert>
        ) : null}

        {uploadSuccess ? (
          <Alert>
            <AlertTitle>Logo updated</AlertTitle>
            <AlertDescription>
              The new company logo is now displayed in the sidebar.
            </AlertDescription>
          </Alert>
        ) : null}

        {removeSuccess ? (
          <Alert>
            <AlertTitle>Logo removed</AlertTitle>
            <AlertDescription>
              The sidebar now uses the default branding fallback.
            </AlertDescription>
          </Alert>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <Button
            disabled={!selectedFile || isSaving}
            onClick={uploadSelectedLogo}
            type="button"
          >
            <ImageUp aria-hidden="true" />
            {uploadPending ? "Uploading..." : "Upload logo"}
          </Button>
          <Button
            disabled={!configuredLogoUrl || isSaving}
            onClick={removeConfiguredLogo}
            type="button"
            variant="destructive"
          >
            <Trash2 aria-hidden="true" />
            {removePending ? "Removing..." : "Remove logo"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
