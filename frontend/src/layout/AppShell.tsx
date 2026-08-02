import { useEffect, useMemo, type CSSProperties, type ReactNode } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router";

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

export function AppShell({
  bootstrap,
  children,
}: {
  bootstrap: CoreBootstrap;
  children?: ReactNode;
}) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const headerHeight = "4rem";

  const logoutMutation = useMutation({
    mutationFn: logout,
    onMutate: async () => {
      await queryClient.cancelQueries();
      queryClient.removeQueries({
        predicate: (query) => query.queryKey[0] !== coreBootstrapQueryKey[0],
      });
      queryClient.setQueryData<CoreBootstrap>(coreBootstrapQueryKey, {
        ...bootstrap,
        authenticated: false,
        accessible_application_keys: [],
        navigation: [],
        user: null,
      });
      navigate("/tablou-de-bord", { replace: true });
    },
    onSuccess: async () => {
      await queryClient.resetQueries({ queryKey: coreBootstrapQueryKey });
    },
    onError: async () => {
      await queryClient.resetQueries({ queryKey: coreBootstrapQueryKey });
    },
  });

  useEffect(() => {
    document.documentElement.style.setProperty("--app-header-height", headerHeight);

    return () => {
      document.documentElement.style.removeProperty("--app-header-height");
    };
  }, [headerHeight]);

  useEffect(() => {
    const root = document.documentElement;
    const { culoare_accent, culoare_fundal, culoare_primara, culoare_titluri } =
      bootstrap.configuration;
    root.style.setProperty("--primary", culoare_primara);
    root.style.setProperty("--brand-red", culoare_accent);
    root.style.setProperty("--background", culoare_fundal);
    root.style.setProperty("--heading", culoare_titluri);

    return () => {
      root.style.removeProperty("--primary");
      root.style.removeProperty("--brand-red");
      root.style.removeProperty("--background");
      root.style.removeProperty("--heading");
    };
  }, [bootstrap.configuration]);

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
      <SidebarProvider className="h-svh min-h-svh flex-col overflow-hidden" style={shellStyle}>
        <AppHeader
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
              className="min-h-0 flex-1 overflow-auto bg-background p-[15px] pb-6 sm:pb-8"
              data-slot="app-content-scroll"
            >
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

              {children}
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </TooltipProvider>
  );
}
