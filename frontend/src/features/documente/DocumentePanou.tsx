import { useQuery } from "@tanstack/react-query";

import { textVariants } from "@/components/ui/text";
import { AntetAplicatie } from "@/components/AntetAplicatie";
import { QueryApplicationState } from "@/components/QueryApplicationState";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import { cheieInterogareDocumente, obtineRezumatDocumente } from "./api";

export function DocumentePanou() {
  const interogare = useQuery({
    queryKey: cheieInterogareDocumente,
    queryFn: obtineRezumatDocumente,
    staleTime: 5 * 60_000,
  });

  if (interogare.isPending || interogare.isError) {
    return (
      <QueryApplicationState
        error={interogare.error}
        errorDescription="Modulul de documente nu a putut fi încărcat."
        errorTitle="Documentele nu sunt disponibile"
        loading={interogare.isPending}
        loadingDescription="Se pregătește spațiul pentru documente."
        loadingTitle="Se încarcă documentele"
        onRetry={() => void interogare.refetch()}
      />
    );
  }

  const rezumat = interogare.data;

  return (
    <section className="flex min-w-0 flex-1 flex-col gap-6" aria-label="Documente">
      <AntetAplicatie titlu={rezumat.titlu} />

      <Card>
        <CardHeader>
          <CardTitle as="h2">Documentele vor apărea aici</CardTitle>
          <CardDescription>
            Modulul este pregătit pentru fluxurile viitoare de încărcare, organizare și consultare a
            documentelor.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p
            className={textVariants({
              variant: "corp",
              className: "leading-6 text-muted-foreground",
            })}
          >
            Momentan nu există documente disponibile.
          </p>
        </CardContent>
      </Card>
    </section>
  );
}
