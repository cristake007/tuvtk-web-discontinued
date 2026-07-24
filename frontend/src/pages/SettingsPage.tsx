import { useEffect, useRef, useState } from "react";
import {
  type QueryClient,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { ImageUp, Trash2 } from "lucide-react";

import {
  coreBootstrapQueryKey,
  fetchCoreBootstrap,
  removeCompanyLogo,
  uploadCompanyLogo,
} from "@/api/core";
import { ApiError } from "@/api/http";
import type { CoreBootstrap, ShellConfiguration } from "@/api/types";
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

const MAX_LOGO_BYTES = 256 * 1024;

function updateCachedConfiguration(
  queryClient: QueryClient,
  configuration: ShellConfiguration,
) {
  queryClient.setQueryData<CoreBootstrap>(coreBootstrapQueryKey, (current) =>
    current ? { ...current, configuration } : current,
  );
}

function formatMutationError(error: Error | null): string | null {
  if (!error) {
    return null;
  }

  return error instanceof ApiError
    ? error.message
    : "The company logo could not be updated. Please try again.";
}

export function SettingsPage() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectionError, setSelectionError] = useState<string | null>(null);

  const bootstrapQuery = useQuery({
    queryKey: coreBootstrapQueryKey,
    queryFn: fetchCoreBootstrap,
    retry: false,
    staleTime: 60_000,
  });

  const uploadMutation = useMutation({
    mutationFn: uploadCompanyLogo,
    onSuccess: (configuration) => {
      updateCachedConfiguration(queryClient, configuration);
      setSelectedFile(null);
      setSelectionError(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
  });

  const removeMutation = useMutation({
    mutationFn: removeCompanyLogo,
    onSuccess: () => {
      const current = queryClient.getQueryData<CoreBootstrap>(coreBootstrapQueryKey);
      if (current) {
        updateCachedConfiguration(queryClient, {
          ...current.configuration,
          logo_url: null,
        });
      }
      setSelectedFile(null);
      setSelectionError(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
  });

  useEffect(() => {
    if (!selectedFile) {
      setPreviewUrl(null);
      return undefined;
    }

    const objectUrl = URL.createObjectURL(selectedFile);
    setPreviewUrl(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [selectedFile]);

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

  const configuredLogoUrl = bootstrapQuery.data.configuration.logo_url;
  const displayedLogoUrl = previewUrl ?? configuredLogoUrl;
  const mutationError =
    formatMutationError(uploadMutation.error) ??
    formatMutationError(removeMutation.error);
  const isSaving = uploadMutation.isPending || removeMutation.isPending;

  function clearFileInput() {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function selectLogo(file: File | undefined) {
    uploadMutation.reset();
    removeMutation.reset();
    setSelectionError(null);

    if (!file) {
      setSelectedFile(null);
      return;
    }

    const isSvg =
      file.type === "image/svg+xml" || file.name.toLowerCase().endsWith(".svg");

    if (!isSvg) {
      clearFileInput();
      setSelectedFile(null);
      setSelectionError("Select an SVG file.");
      return;
    }

    if (file.size > MAX_LOGO_BYTES) {
      clearFileInput();
      setSelectedFile(null);
      setSelectionError("The SVG file must be 256 KB or smaller.");
      return;
    }

    setSelectedFile(file);
  }

  function removeConfiguredLogo() {
    uploadMutation.reset();
    setSelectionError(null);
    removeMutation.mutate();
  }

  return (
    <section className="flex w-full flex-col gap-6">
      <div>
        <p className="text-sm font-medium text-primary">Application settings</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">Company branding</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
          The configured logo is stored in the core database and displayed in the
          sidebar header for authenticated users.
        </p>
      </div>

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

          {uploadMutation.isSuccess ? (
            <Alert>
              <AlertTitle>Logo updated</AlertTitle>
              <AlertDescription>
                The new company logo is now displayed in the sidebar.
              </AlertDescription>
            </Alert>
          ) : null}

          {removeMutation.isSuccess ? (
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
              onClick={() => {
                if (selectedFile) {
                  uploadMutation.mutate(selectedFile);
                }
              }}
              type="button"
            >
              <ImageUp aria-hidden="true" />
              {uploadMutation.isPending ? "Uploading..." : "Upload logo"}
            </Button>
            <Button
              disabled={!configuredLogoUrl || isSaving}
              onClick={removeConfiguredLogo}
              type="button"
              variant="destructive"
            >
              <Trash2 aria-hidden="true" />
              {removeMutation.isPending ? "Removing..." : "Remove logo"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
