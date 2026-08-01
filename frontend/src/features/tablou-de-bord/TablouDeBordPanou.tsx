import { useQuery } from "@tanstack/react-query";

import { AntetAplicatie } from "@/components/AntetAplicatie";
import { QueryApplicationState } from "@/components/QueryApplicationState";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { cheieInterogareTablouDeBord, obtineRezumatTablouDeBord } from "./api";

export function TablouDeBordPanou() {
  const interogare = useQuery({
    queryKey: cheieInterogareTablouDeBord,
    queryFn: obtineRezumatTablouDeBord,
    staleTime: 5 * 60_000,
  });

  if (interogare.isPending || interogare.isError) {
    return (
      <QueryApplicationState
        error={interogare.error}
        errorDescription="Tabloul de bord nu a putut fi încărcat."
        errorTitle="Tabloul de bord nu este disponibil"
        loading={interogare.isPending}
        loadingDescription="Se pregătește spațiul de lucru."
        loadingTitle="Se încarcă Dashboard"
        onRetry={() => void interogare.refetch()}
      />
    );
  }

  const rezumat = interogare.data;

  return (
    <section className="flex min-w-0 flex-1 flex-col gap-6" aria-label="Tablou de bord">
      <AntetAplicatie titlu={rezumat.titlu} />

      <Card>
        <CardHeader>
          <CardTitle>Modulele tale vor apărea aici</CardTitle>
          <CardDescription>
            Pe măsură ce modulele sunt activate, acest tablou de bord le va centraliza
            accesul și informațiile utile.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-base leading-6 text-muted-foreground">
            Momentan nu există module configurate pentru afișare.
          </p>
        </CardContent>
      </Card>
    </section>
  );
}
