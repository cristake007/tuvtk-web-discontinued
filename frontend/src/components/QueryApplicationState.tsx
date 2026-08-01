import { ApplicationState } from "@/components/ApplicationState";
import { formatApiError } from "@/lib/api-errors";

export function QueryApplicationState({
  error,
  errorDescription,
  errorTitle,
  loading,
  loadingDescription,
  loadingTitle,
  onRetry,
}: {
  error: unknown;
  errorDescription: string;
  errorTitle: string;
  loading: boolean;
  loadingDescription: string;
  loadingTitle: string;
  onRetry: () => void;
}) {
  if (loading) {
    return (
      <ApplicationState
        description={loadingDescription}
        loading
        title={loadingTitle}
      />
    );
  }

  if (error) {
    return (
      <ApplicationState
        actionLabel="Încearcă din nou"
        description={formatApiError(error, errorDescription)}
        onAction={onRetry}
        title={errorTitle}
      />
    );
  }

  return null;
}
