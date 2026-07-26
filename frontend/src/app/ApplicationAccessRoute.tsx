import type { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";

import { coreBootstrapQueryKey, fetchCoreBootstrap } from "@/api/core";
import { ApplicationState } from "@/components/ApplicationState";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function ApplicationAccessRoute({
  applicationKey,
  children,
}: {
  applicationKey: string;
  children: ReactNode;
}) {
  const bootstrapQuery = useQuery({
    queryKey: coreBootstrapQueryKey,
    queryFn: fetchCoreBootstrap,
    staleTime: 60_000,
  });

  if (bootstrapQuery.isPending) {
    return <ApplicationState description="Se verifică accesul la aplicație." loading title="Se încarcă aplicația" />;
  }
  if (bootstrapQuery.isError || !bootstrapQuery.data?.accessible_application_keys.includes(applicationKey)) {
    return (
      <section className="flex min-w-0 flex-1 items-start justify-center py-10">
        <Card className="w-full max-w-xl">
          <CardHeader>
            <CardTitle>Acces interzis</CardTitle>
            <CardDescription>Nu ai acces la această aplicație.</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Contactează un administrator dacă ai nevoie de acces.
          </CardContent>
        </Card>
      </section>
    );
  }
  return children;
}
