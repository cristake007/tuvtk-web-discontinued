import { lazy, Suspense, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";

import { ApplicationState } from "@/components/ApplicationState";
import { fetchAuthenticationSession } from "@/features/auth/api";
import { authQueryKeys } from "@/features/auth/queryKeys";
import { AppShell } from "@/layout/AppShell";

const LoginPage = lazy(async () => {
  const module = await import("@/pages/LoginPage");
  return { default: module.LoginPage };
});

function DeferredView({
  children,
  description,
  title,
}: {
  children: ReactNode;
  description: string;
  title: string;
}) {
  return (
    <Suspense
      fallback={<ApplicationState description={description} loading title={title} />}
    >
      {children}
    </Suspense>
  );
}

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
    return (
      <DeferredView
        description="Loading the secure sign-in page."
        title="Preparing sign in"
      >
        <LoginPage />
      </DeferredView>
    );
  }

  return <AppShell />;
}
