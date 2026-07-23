import { useQuery } from "@tanstack/react-query";

import { ApiError, fetchCurrentUser } from "../api/client";
import { AppShell } from "../layout/AppShell";
import { LoginPage } from "../pages/LoginPage";


export function AuthenticationGate() {
  const sessionQuery = useQuery({
    queryKey: ["auth-session"],
    queryFn: fetchCurrentUser,
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

  if (sessionQuery.error instanceof ApiError && sessionQuery.error.status === 401) {
    return <LoginPage />;
  }

  if (sessionQuery.isError) {
    return (
      <div className="auth-state auth-state--error" role="alert">
        <strong>The application server could not be reached.</strong>
        <span>Check the Django container and reload the page.</span>
      </div>
    );
  }

  return <AppShell />;
}
