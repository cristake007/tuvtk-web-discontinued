import { useEffect, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Menu, Palette, Plus, Save, Settings2 } from "lucide-react";
import { toast } from "sonner";

import { coreBootstrapQueryKey } from "@/api/core";
import { ApplicationState } from "@/components/ApplicationState";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { CoreBootstrap, NavigationItem, ShellConfiguration } from "@/features/core/types";
import { formatApiError } from "@/lib/api-errors";

import {
  createUserInterfaceSeparator,
  fetchUserInterfaceNavigation,
  fetchUserInterfaceSettings,
  removeUserInterfaceSeparator,
  updateUserInterfaceNavigation,
  updateUserInterfaceSettings,
} from "./api";
import { CompanyLogoSettings } from "./CompanyLogoSettings";
import { userInterfaceQueryKeys } from "./queryKeys";
import { ListaMeniuSortabila } from "./SortableMenuList";

type CuloriInterfata = Pick<
  ShellConfiguration,
  "culoare_primara" | "culoare_accent" | "culoare_fundal"
>;

function actualizeazaConfiguratiaDinCache(
  queryClient: ReturnType<typeof useQueryClient>,
  configuration: ShellConfiguration,
) {
  queryClient.setQueryData(userInterfaceQueryKeys.settings(), configuration);
  queryClient.setQueryData<CoreBootstrap>(coreBootstrapQueryKey, (current) =>
    current ? { ...current, configuration } : current,
  );
}

export function UserInterfaceSettingsTabs() {
  const queryClient = useQueryClient();
  const settingsQuery = useQuery({
    queryKey: userInterfaceQueryKeys.settings(),
    queryFn: fetchUserInterfaceSettings,
    retry: false,
    staleTime: 60_000,
  });
  const navigationQuery = useQuery({
    queryKey: [...userInterfaceQueryKeys.all, "navigation"],
    queryFn: fetchUserInterfaceNavigation,
    retry: false,
    staleTime: 60_000,
  });
  const [numeAplicatie, setNumeAplicatie] = useState("");
  const [culori, setCulori] = useState<CuloriInterfata>({
    culoare_primara: "#164194",
    culoare_accent: "#d41131",
    culoare_fundal: "#ffffff",
  });
  const [elementeMeniu, setElementeMeniu] = useState<NavigationItem[]>([]);

  useEffect(() => {
    if (!settingsQuery.data) {
      return;
    }
    setNumeAplicatie(settingsQuery.data.site_name);
    setCulori({
      culoare_primara: settingsQuery.data.culoare_primara,
      culoare_accent: settingsQuery.data.culoare_accent,
      culoare_fundal: settingsQuery.data.culoare_fundal,
    });
  }, [settingsQuery.data]);

  useEffect(() => {
    if (navigationQuery.data) {
      setElementeMeniu(navigationQuery.data);
    }
  }, [navigationQuery.data]);

  const configuratieMutation = useMutation({
    mutationFn: updateUserInterfaceSettings,
    onSuccess: (configuration) => {
      actualizeazaConfiguratiaDinCache(queryClient, configuration);
      toast.success("Setările interfeței au fost salvate.");
    },
    onError: (error) =>
      toast.error("Setările nu au putut fi salvate", {
        description: formatApiError(error, "Încearcă din nou."),
      }),
  });
  const ordineMutation = useMutation({
    mutationFn: updateUserInterfaceNavigation,
    onSuccess: (elemente) => {
      setElementeMeniu(elemente);
      void queryClient.invalidateQueries({ queryKey: coreBootstrapQueryKey });
      toast.success("Ordinea meniului a fost salvată.");
    },
    onError: (error) =>
      toast.error("Ordinea meniului nu a putut fi salvată", {
        description: formatApiError(error, "Încearcă din nou."),
      }),
  });
  const separatorMutation = useMutation({
    mutationFn: createUserInterfaceSeparator,
    onSuccess: (separator) => {
      setElementeMeniu((curente) => [...curente, separator]);
      toast.success("Separatorul a fost adăugat.");
    },
    onError: (error) =>
      toast.error("Separatorul nu a putut fi adăugat", {
        description: formatApiError(error, "Încearcă din nou."),
      }),
  });
  const stergeSeparatorMutation = useMutation({
    mutationFn: removeUserInterfaceSeparator,
    onSuccess: (_, key) => {
      setElementeMeniu((curente) => curente.filter((element) => element.key !== key));
      toast.success("Separatorul a fost eliminat.");
    },
    onError: (error) =>
      toast.error("Separatorul nu a putut fi eliminat", {
        description: formatApiError(error, "Încearcă din nou."),
      }),
  });

  if (settingsQuery.isPending) {
    return <ApplicationState description="Se încarcă setările disponibile." loading title="Se încarcă interfața utilizator" />;
  }

  if (settingsQuery.isError || !settingsQuery.data) {
    return (
      <ApplicationState
        actionLabel="Încearcă din nou"
        description="Configurarea interfeței utilizator nu a putut fi încărcată."
        onAction={() => void settingsQuery.refetch()}
        title="Interfața utilizator nu este disponibilă"
      />
    );
  }

  function salveazaNumele(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    configuratieMutation.mutate({ site_name: numeAplicatie.trim() });
  }

  function salveazaCulorile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    configuratieMutation.mutate(culori);
  }

  return (
    <Tabs defaultValue="general">
      <TabsList aria-label="Setări interfață utilizator" className="w-full justify-start overflow-x-auto" variant="line">
        <TabsTrigger value="general"><Settings2 aria-hidden="true" />General</TabsTrigger>
        <TabsTrigger value="branding"><Palette aria-hidden="true" />Branding</TabsTrigger>
        <TabsTrigger value="meniu"><Menu aria-hidden="true" />Meniu</TabsTrigger>
      </TabsList>

      <TabsContent className="pt-4" value="general">
        <Card className="max-w-2xl">
          <form onSubmit={salveazaNumele}>
            <CardHeader><CardTitle>Identitatea aplicației</CardTitle><CardDescription>Poți schimba numele afișat în antet și în paginile publice.</CardDescription></CardHeader>
            <CardContent><Label htmlFor="nume-aplicatie">Numele aplicației</Label><Input className="mt-2" id="nume-aplicatie" maxLength={120} onChange={(event) => setNumeAplicatie(event.target.value)} value={numeAplicatie} /></CardContent>
            <CardFooter><Button disabled={!numeAplicatie.trim() || configuratieMutation.isPending} type="submit"><Save aria-hidden="true" />Salvează</Button></CardFooter>
          </form>
        </Card>
      </TabsContent>

      <TabsContent className="space-y-6 pt-4" value="branding">
        <Card className="max-w-2xl">
          <form onSubmit={salveazaCulorile}>
            <CardHeader><CardTitle>Culori de bază</CardTitle><CardDescription>Alege culorile folosite pentru elementele principale ale interfeței.</CardDescription></CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-3">
              {([['culoare_primara', 'Culoare primară'], ['culoare_accent', 'Culoare accent'], ['culoare_fundal', 'Culoare fundal']] as const).map(([camp, eticheta]) => (
                <div key={camp}><Label htmlFor={camp}>{eticheta}</Label><div className="mt-2 flex items-center gap-2"><Input className="h-10 w-14 p-1" id={camp} onChange={(event) => setCulori((curente) => ({ ...curente, [camp]: event.target.value }))} type="color" value={culori[camp]} /><span className="font-mono text-sm text-muted-foreground">{culori[camp]}</span></div></div>
              ))}
            </CardContent>
            <CardFooter><Button disabled={configuratieMutation.isPending} type="submit"><Save aria-hidden="true" />Salvează culorile</Button></CardFooter>
          </form>
        </Card>
        <CompanyLogoSettings />
      </TabsContent>

      <TabsContent className="pt-4" value="meniu">
        <Card className="max-w-2xl">
          <CardHeader><CardTitle>Ordinea meniului</CardTitle><CardDescription>Trage elementele principale în poziția dorită, apoi salvează noua ordine.</CardDescription></CardHeader>
          <CardContent>
            {navigationQuery.isError ? <p className="text-sm text-destructive">Meniul nu a putut fi încărcat.</p> : <ListaMeniuSortabila disabled={ordineMutation.isPending || separatorMutation.isPending || stergeSeparatorMutation.isPending} elemente={elementeMeniu} onSchimbaOrdinea={setElementeMeniu} onStergeSeparator={(key) => stergeSeparatorMutation.mutate(key)} />}
          </CardContent>
          <CardFooter className="flex flex-wrap gap-2"><Button disabled={separatorMutation.isPending || stergeSeparatorMutation.isPending} onClick={() => separatorMutation.mutate()} type="button" variant="outline"><Plus aria-hidden="true" />Adaugă separator</Button><Button disabled={elementeMeniu.length === 0 || ordineMutation.isPending || separatorMutation.isPending || stergeSeparatorMutation.isPending} onClick={() => ordineMutation.mutate(elementeMeniu.map((element) => element.key))} type="button"><Save aria-hidden="true" />Salvează ordinea</Button></CardFooter>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
