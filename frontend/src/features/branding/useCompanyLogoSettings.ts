import { useEffect, useState } from "react";
import { type QueryClient, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { coreBootstrapQueryKey } from "@/api/core";
import type { CoreBootstrap, ShellConfiguration } from "@/features/core/types";
import { formatApiError } from "@/lib/api-errors";

import { fetchUserInterfaceSettings, removeCompanyLogo, uploadCompanyLogo } from "./api";
import { userInterfaceQueryKeys } from "./queryKeys";
import { validateCompanyLogo } from "./validation";

const mutationErrorFallback = "Sigla companiei nu a putut fi actualizată. Încearcă din nou.";

function updateCachedConfiguration(queryClient: QueryClient, configuration: ShellConfiguration) {
  queryClient.setQueryData(userInterfaceQueryKeys.settings(), configuration);
  queryClient.setQueryData<CoreBootstrap>(coreBootstrapQueryKey, (current) =>
    current ? { ...current, configuration } : current,
  );
}

export function useCompanyLogoSettings() {
  const queryClient = useQueryClient();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectionError, setSelectionError] = useState<string | null>(null);

  const settingsQuery = useQuery({
    queryKey: userInterfaceQueryKeys.settings(),
    queryFn: fetchUserInterfaceSettings,
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
      const current = queryClient.getQueryData<ShellConfiguration>(
        userInterfaceQueryKeys.settings(),
      );
      if (current) {
        updateCachedConfiguration(queryClient, {
          ...current,
          logo_url: null,
        });
      } else {
        void queryClient.invalidateQueries({
          queryKey: userInterfaceQueryKeys.settings(),
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

  const configuredLogoUrl = settingsQuery.data?.logo_url ?? null;

  return {
    configuredLogoUrl,
    displayedLogoUrl: previewUrl ?? configuredLogoUrl,
    isSaving: uploadMutation.isPending || removeMutation.isPending,
    mutationError: uploadMutation.error
      ? formatApiError(uploadMutation.error, mutationErrorFallback)
      : removeMutation.error
        ? formatApiError(removeMutation.error, mutationErrorFallback)
        : null,
    removeConfiguredLogo,
    removePending: removeMutation.isPending,
    removeSuccess: removeMutation.isSuccess,
    selectedFile,
    selectionError,
    selectLogo,
    settingsQuery,
    uploadPending: uploadMutation.isPending,
    uploadSelectedLogo,
    uploadSuccess: uploadMutation.isSuccess,
  };
}
