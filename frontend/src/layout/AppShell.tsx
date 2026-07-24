import { useEffect, useMemo, useState, type CSSProperties } from "react";
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

const appContentGridStyle = {
  backgroundColor: "var(--background)",
  backgroundImage:
    "repeating-linear-gradient(-45deg, var(--background), var(--background) 13px, var(--muted) 13px, var(--muted) 14px)",
  backgroundSize: "40px 40px",
} as const;

type AppShellStyle = CSSProperties & {
  "--app-header-height": string;
};

export function AppShell() {
  const queryClient = useQueryClient();
  const [headerCompact, setHeaderCompact] = useState(false);

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
        description="Se încarcă navigația, permisiunile și configurația aplicației."
        loading
        title="Se pregătește aplicația"
      />
    );
  }

  if (bootstrapQuery.isError || !bootstrapQuery.data) {
    return (
      <ApplicationState
        actionLabel="Încearcă din nou"
        description="Configurația aplicației nu a putut fi încărcată din Django."
        onAction={() => void bootstrapQuery.refetch()}
        title="Aplicația nu este disponibilă"
      />
    );
  }

  const bootstrap = bootstrapQuery.data;
  const shellStyle: AppShellStyle = {
    "--app-header-height": headerCompact ? "4rem" : "5rem",
  };

  return (
    <TooltipProvider delay={0}>
      <SidebarProvider
        className="h-svh min-h-svh flex-col overflow-hidden"
        style={shellStyle}
      >
        <AppHeader
          compact={headerCompact}
          configuration={bootstrap.configuration}
          logoutPending={logoutMutation.isPending}
          navigation={bootstrap.navigation}
          onLogout={() => logoutMutation.mutate()}
          user={bootstrap.user}
        />

        <div className="flex min-h-0 w-full flex-1">
          <AppSidebar navigation={navigation} />

          <SidebarInset className="min-h-0 overflow-hidden bg-white">
            <div
              className="flex min-h-0 flex-1 flex-col overflow-auto"
              onScroll={(event) => {
                const compact = event.currentTarget.scrollTop > 24;
                setHeaderCompact((current) =>
                  current === compact ? current : compact,
                );
              }}
              style={appContentGridStyle}
            >
              <div className="flex w-full flex-1 flex-col">
                {logoutMutation.isError ? (
                  <Alert className="m-4 mb-0 border-warning/40 bg-warning/10 sm:m-6 sm:mb-0 lg:m-8 lg:mb-0">
                    <AlertTriangle aria-hidden="true" />
                    <AlertTitle>Deconectarea nu a reușit</AlertTitle>
                    <AlertDescription>
                      {logoutMutation.error instanceof ApiError
                        ? logoutMutation.error.message
                        : "Serverul nu a putut finaliza cererea. Încearcă din nou."}
                    </AlertDescription>
                  </Alert>
                ) : null}

                <Outlet />
              </div>
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </TooltipProvider>
  );
}
