import { Suspense, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Outlet, useMatches } from "react-router";

import { coreBootstrapQueryKey, fetchCoreBootstrap } from "@/api/core";
import { ApplicationState } from "@/components/ApplicationState";
import { AppShell } from "@/layout/AppShell";

import { AuthenticatedBootstrapProvider } from "./AuthenticatedBootstrapContext";
import { lazyRoute } from "./lazyRoute";

const LoginPage = lazyRoute(() => import("@/pages/LoginPage"), "LoginPage");

export function AuthenticationGate() {
  const matches = useMatches();
  const bootstrapQuery = useQuery({
    queryKey: coreBootstrapQueryKey,
    queryFn: fetchCoreBootstrap,
    retry: false,
    staleTime: 60_000,
  });
  const siteName = bootstrapQuery.data?.configuration.site_name;
  const fontScale = bootstrapQuery.data?.configuration.font_scale;
  const authenticated = Boolean(bootstrapQuery.data?.authenticated && bootstrapQuery.data.user);
  const pageTitle = matches
    .map((match) => (match.handle as { pageTitle?: string } | undefined)?.pageTitle)
    .findLast((title): title is string => Boolean(title));

  useEffect(() => {
    if (siteName) {
      const currentPageTitle = authenticated ? pageTitle : "Autentificare";
      document.title = currentPageTitle ? `${currentPageTitle} | ${siteName}` : siteName;
    }
  }, [authenticated, pageTitle, siteName]);

  useEffect(() => {
    if (fontScale === undefined) {
      return;
    }

    const root = document.documentElement;
    root.style.setProperty("--app-font-scale", String(fontScale));

    return () => {
      root.style.removeProperty("--app-font-scale");
    };
  }, [fontScale]);

  if (bootstrapQuery.isPending) {
    return (
      <ApplicationState
        description="Se verifică sesiunea și se încarcă configurația aplicației."
        loading
        title="Se pregătește aplicația"
      />
    );
  }

  if (bootstrapQuery.isError || !bootstrapQuery.data) {
    return (
      <ApplicationState
        description="Serverul aplicației nu a putut fi accesat. Verifică serviciul Django și încearcă din nou."
        onRetry={() => void bootstrapQuery.refetch()}
        title="Serverul nu este disponibil"
      />
    );
  }

  const { configuration } = bootstrapQuery.data;
  const deferredContent = (
    <Suspense fallback={<ApplicationState description="" loading title="" />}>
      {!bootstrapQuery.data.authenticated || !bootstrapQuery.data.user ? (
        <LoginPage
          branding={{
            logo_url: configuration.logo_url,
            organization_name: configuration.organization_name,
            site_name: configuration.site_name,
            culoare_primara: configuration.culoare_primara,
            culoare_accent: configuration.culoare_accent,
            culoare_fundal: configuration.culoare_fundal,
            culoare_titluri: configuration.culoare_titluri,
            font_scale: configuration.font_scale,
          }}
        />
      ) : (
        <Outlet />
      )}
    </Suspense>
  );

  if (!bootstrapQuery.data.authenticated || !bootstrapQuery.data.user) {
    return deferredContent;
  }

  return (
    <AuthenticatedBootstrapProvider value={bootstrapQuery.data}>
      <AppShell bootstrap={bootstrapQuery.data}>{deferredContent}</AppShell>
    </AuthenticatedBootstrapProvider>
  );
}
