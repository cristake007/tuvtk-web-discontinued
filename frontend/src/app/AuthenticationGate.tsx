import { lazy, Suspense, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";

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
  const bootstrapQuery = useQuery({
    queryKey: coreBootstrapQueryKey,
    queryFn: fetchCoreBootstrap,
    retry: false,
    staleTime: 60_000,
  });

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
        actionLabel="Încearcă din nou"
        description="Serverul aplicației nu a putut fi accesat. Verifică serviciul Django și încearcă din nou."
        onAction={() => void bootstrapQuery.refetch()}
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
