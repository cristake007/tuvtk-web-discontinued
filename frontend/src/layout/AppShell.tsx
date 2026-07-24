import { useEffect, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle } from "lucide-react";
import { Outlet } from "react-router-dom";

import { coreBootstrapQueryKey, fetchCoreBootstrap } from "@/api/core";
import { ApiError } from "@/api/http";
import { ApplicationState } from "@/components/ApplicationState";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { logout } from "@/features/auth/api";
import { authQueryKeys } from "@/features/auth/queryKeys";
import type { AuthenticationSession } from "@/features/auth/types";

import { AppHeader } from "./app-shell/AppHeader";
import { AppSidebar } from "./app-shell/AppSidebar";
import { buildNavigationTree } from "./app-shell/navigation";

const unauthenticatedSession: AuthenticationSession = {
  authenticated: false,
  user: null,
};

export function AppShell() {
  const queryClient = useQueryClient();

  const bootstrapQuery = useQuery({
    queryKey: coreBootstrapQueryKey,
    queryFn: fetchCoreBootstrap,
    retry: false,
    staleTime: 60_000,
  });

  const logoutMutation = useMutation({
    mutationFn: logout,
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: coreBootstrapQueryKey });
      queryClient.setQueryData(authQueryKeys.session, unauthenticatedSession);
    },
  });

  useEffect(() => {
    if (bootstrapQuery.error instanceof ApiError && bootstrapQuery.error.status === 401) {
      queryClient.removeQueries({ queryKey: coreBootstrapQueryKey });
      queryClient.setQueryData(authQueryKeys.session, unauthenticatedSession);
    }
  }, [bootstrapQuery.error, queryClient]);

  const navigation = useMemo(
    () => buildNavigationTree(bootstrapQuery.data?.navigation ?? []),
    [bootstrapQuery.data?.navigation],
  );

  if (bootstrapQuery.isPending) {
    return (
      <ApplicationState
        description="Loading your navigation, permissions, and workspace configuration."
        loading
        title="Preparing the application"
      />
    );
  }

  if (bootstrapQuery.isError || !bootstrapQuery.data) {
    return (
      <ApplicationState
        actionLabel="Try again"
        description="The application configuration could not be loaded from Django."
        onAction={() => void bootstrapQuery.refetch()}
        title="The workspace is unavailable"
      />
    );
  }

  const bootstrap = bootstrapQuery.data;

  return (
    <TooltipProvider delay={0}>
      <SidebarProvider>
        <AppSidebar
          configuration={bootstrap.configuration}
          navigation={navigation}
        />

        <SidebarInset className="min-h-svh overflow-hidden bg-white">
          <AppHeader
            logoutPending={logoutMutation.isPending}
            navigation={bootstrap.navigation}
            onLogout={() => logoutMutation.mutate()}
            user={bootstrap.user}
          />

          <div className="flex min-h-0 flex-1 flex-col overflow-auto bg-white">
            <div className="mx-auto flex w-full max-w-screen-2xl flex-1 flex-col p-4 sm:p-6 lg:p-8">
              {logoutMutation.isError ? (
                <Alert className="mb-4 border-warning/40 bg-warning/10">
                  <AlertTriangle aria-hidden="true" />
                  <AlertTitle>Sign out failed</AlertTitle>
                  <AlertDescription>
                    {logoutMutation.error instanceof ApiError
                      ? logoutMutation.error.message
                      : "The server could not complete the request. Please try again."}
                  </AlertDescription>
                </Alert>
              ) : null}

              <Outlet />
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
