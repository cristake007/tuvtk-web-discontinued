import { useQuery } from "@tanstack/react-query";

import { ApplicationState } from "@/components/ApplicationState";
import { AppShell } from "@/layout/AppShell";
import { LoginPage } from "@/pages/LoginPage";

import { fetchAuthenticationSession } from "./api";
import { authQueryKeys } from "./queryKeys";

export function AuthenticationGate() {
  const sessionQuery = useQuery({
    queryKey: authQueryKeys.session,
    queryFn: fetchAuthenticationSession,
    retry: false,
    staleTime: 60_000,
  });

  if (sessionQuery.isPending) {
    return (
      <ApplicationState
        description="Verifying your Django session before loading the workspace."
        loading
        title="Checking your session"
      />
    );
  }

  if (sessionQuery.isError) {
    return (
      <ApplicationState
        actionLabel="Try again"
        description="The application server could not be reached. Check the Django container and retry."
        onAction={() => void sessionQuery.refetch()}
        title="The server is unavailable"
      />
    );
  }

  if (!sessionQuery.data.authenticated || !sessionQuery.data.user) {
    return <LoginPage />;
  }

  return <AppShell />;
}
