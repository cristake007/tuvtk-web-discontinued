import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle } from "lucide-react";
import { Outlet } from "react-router-dom";

import { coreBootstrapQueryKey } from "@/api/core";
import { ApiError } from "@/api/http";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { logout } from "@/features/auth/api";
import type { CoreBootstrap } from "@/features/core/types";

import { AppHeader } from "./app-shell/AppHeader";
import { AppSidebar } from "./app-shell/AppSidebar";
import { buildNavigationTree } from "./app-shell/navigation";

type AppShellStyle = CSSProperties & {
  "--app-header-height": string;
};

export function AppShell({ bootstrap }: { bootstrap: CoreBootstrap }) {
  const queryClient = useQueryClient();
  const [headerCompact, setHeaderCompact] = useState(false);
  const headerHeight = headerCompact ? "4rem" : "5rem";

  const logoutMutation = useMutation({
    mutationFn: logout,
    onSuccess: () => {
      queryClient.setQueryData<CoreBootstrap>(coreBootstrapQueryKey, {
        ...bootstrap,
        authenticated: false,
        navigation: [],
        user: null,
      });
    },
  });

  useEffect(() => {
    document.documentElement.style.setProperty("--app-header-height", headerHeight);

    return () => {
      document.documentElement.style.removeProperty("--app-header-height");
    };
  }, [headerHeight]);

  const navigation = useMemo(
    () => buildNavigationTree(bootstrap.navigation),
    [bootstrap.navigation],
  );

  if (!bootstrap.user) {
    return null;
  }

  const shellStyle: AppShellStyle = {
    "--app-header-height": headerHeight,
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

          <SidebarInset className="min-h-0 overflow-hidden bg-muted/30">
            <div
              className="flex min-h-0 flex-1 flex-col overflow-auto bg-background p-[15px]"
              onScroll={(event) => {
                const compact = event.currentTarget.scrollTop > 24;
                setHeaderCompact((current) =>
                  current === compact ? current : compact,
                );
              }}
            >
              <div className="flex min-h-full w-full flex-1 flex-col bg-background">
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
