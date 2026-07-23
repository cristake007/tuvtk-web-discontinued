import { useQuery } from "@tanstack/react-query";

import { fetchAuthenticationSession } from "../features/auth/api";
import { authQueryKeys } from "../features/auth/queryKeys";
import { AppShell } from "../layout/AppShell";
import { LoginPage } from "../pages/LoginPage";

export function AuthenticationGate() {
  const sessionQuery = useQuery({
    queryKey: authQueryKeys.session,
    queryFn: fetchAuthenticationSession,
    retry: false,
    staleTime: 60_000,
  });

  if (sessionQuery.isPending) {
    return (
      <div className="auth-state" role="status">
        <div className="auth-state__spinner" />
        <span>Checking your session…</span>
      </div>
    );
  }

  if (sessionQuery.isError) {
    return (
      <div className="auth-state auth-state--error" role="alert">
        <strong>The application server could not be reached.</strong>
        <span>Check the Django container and reload the page.</span>
      </div>
    );
  }

  if (!sessionQuery.data.authenticated || !sessionQuery.data.user) {
    return <LoginPage />;
  }

  return <AppShell />;
}
