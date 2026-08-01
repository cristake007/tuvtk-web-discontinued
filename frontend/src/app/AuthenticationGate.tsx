import { lazy, Suspense, useEffect, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { useMatches } from "react-router-dom";

import { coreBootstrapQueryKey, fetchCoreBootstrap } from "@/api/core";
import { ApplicationState } from "@/components/ApplicationState";
import { AppShell } from "@/layout/AppShell";

import { AuthenticatedBootstrapProvider } from "./AuthenticatedBootstrapContext";

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
  const matches = useMatches();
  const bootstrapQuery = useQuery({
    queryKey: coreBootstrapQueryKey,
    queryFn: fetchCoreBootstrap,
    retry: false,
    staleTime: 60_000,
  });
  const siteName = bootstrapQuery.data?.configuration.site_name;
  const fontScale = bootstrapQuery.data?.configuration.font_scale;
  const authenticated = Boolean(
    bootstrapQuery.data?.authenticated && bootstrapQuery.data.user,
  );
  const pageTitle = matches
    .map(
      (match) =>
        (match.handle as { pageTitle?: string } | undefined)?.pageTitle,
    )
    .findLast((title): title is string => Boolean(title));

  useEffect(() => {
    if (siteName) {
      const currentPageTitle = authenticated ? pageTitle : "Autentificare";
      document.title = currentPageTitle
        ? `${currentPageTitle} | ${siteName}`
        : siteName;
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

  if (!bootstrapQuery.data.authenticated || !bootstrapQuery.data.user) {
    const { configuration } = bootstrapQuery.data;
    return (
      <DeferredView
        description="Se încarcă pagina securizată de autentificare."
        title="Se pregătește autentificarea"
      >
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
      </DeferredView>
    );
  }

  return (
    <AuthenticatedBootstrapProvider value={bootstrapQuery.data}>
      <AppShell bootstrap={bootstrapQuery.data} />
    </AuthenticatedBootstrapProvider>
  );
}
