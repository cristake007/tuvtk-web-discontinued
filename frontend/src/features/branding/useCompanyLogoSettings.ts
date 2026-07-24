import { useEffect, useState } from "react";
import {
  type QueryClient,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { coreBootstrapQueryKey, fetchCoreBootstrap } from "@/api/core";
import { ApiError } from "@/api/http";
import type { CoreBootstrap, ShellConfiguration } from "@/features/core/types";

import { removeCompanyLogo, uploadCompanyLogo } from "./api";
import { validateCompanyLogo } from "./validation";

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
    : "Sigla companiei nu a putut fi actualizată. Încearcă din nou.";
}

export function useCompanyLogoSettings() {
  const queryClient = useQueryClient();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectionError, setSelectionError] = useState<string | null>(null);

  const bootstrapQuery = useQuery({
    queryKey: coreBootstrapQueryKey,
    queryFn: fetchCoreBootstrap,
    retry: false,
    staleTime: 60_000,
  });

  function resetSelection() {
    setSelectedFile(null);
    setSelectionError(null);
  }

  const uploadMutation = useMutation({
    mutationFn: uploadCompanyLogo,
    onSuccess: (configuration) => {
      updateCachedConfiguration(queryClient, configuration);
      resetSelection();
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
      resetSelection();
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

  function selectLogo(file: File | undefined) {
    uploadMutation.reset();
    removeMutation.reset();

    const error = validateCompanyLogo(file);
    setSelectionError(error);

    if (!file || error) {
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
  }

  function uploadSelectedLogo() {
    if (selectedFile) {
      uploadMutation.mutate(selectedFile);
    }
  }

  function removeConfiguredLogo() {
    uploadMutation.reset();
    setSelectionError(null);
    removeMutation.mutate();
  }

  const configuredLogoUrl = bootstrapQuery.data?.configuration.logo_url ?? null;

  return {
    bootstrapQuery,
    configuredLogoUrl,
    displayedLogoUrl: previewUrl ?? configuredLogoUrl,
    isSaving: uploadMutation.isPending || removeMutation.isPending,
    mutationError:
      formatMutationError(uploadMutation.error) ??
      formatMutationError(removeMutation.error),
    removeConfiguredLogo,
    removePending: removeMutation.isPending,
    removeSuccess: removeMutation.isSuccess,
    selectedFile,
    selectionError,
    selectLogo,
    uploadPending: uploadMutation.isPending,
    uploadSelectedLogo,
    uploadSuccess: uploadMutation.isSuccess,
  };
}
