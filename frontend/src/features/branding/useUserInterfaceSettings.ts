import { useEffect, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { coreBootstrapQueryKey } from "@/api/core";
import type { CoreBootstrap, NavigationItem, ShellConfiguration } from "@/features/core/types";
import { formatApiError } from "@/lib/api-errors";

import {
  createUserInterfaceSeparator,
  fetchUserInterfaceNavigation,
  fetchUserInterfaceSettings,
  removeUserInterfaceSeparator,
  renameUserInterfaceSeparator,
  updateUserInterfaceNavigation,
  updateUserInterfaceSettings,
} from "./api";
import type { FontScale } from "./fontScale";
import { userInterfaceQueryKeys } from "./queryKeys";

export type CuloriInterfata = Pick<
  ShellConfiguration,
  "culoare_primara" | "culoare_accent" | "culoare_fundal" | "culoare_titluri"
>;

const culoriImplicite: CuloriInterfata = {
  culoare_primara: "#164194",
  culoare_accent: "#d41131",
  culoare_fundal: "#ffffff",
  culoare_titluri: "#1b2230",
};

function actualizeazaConfiguratiaDinCache(
  queryClient: ReturnType<typeof useQueryClient>,
  configuration: ShellConfiguration,
) {
  queryClient.setQueryData(userInterfaceQueryKeys.settings(), configuration);
  queryClient.setQueryData<CoreBootstrap>(coreBootstrapQueryKey, (current) =>
    current ? { ...current, configuration } : current,
  );
}

function actualizeazaNavigatiaDinCache(
  queryClient: ReturnType<typeof useQueryClient>,
  actualizare: (elemente: NavigationItem[]) => NavigationItem[],
) {
  queryClient.setQueryData<NavigationItem[]>(userInterfaceQueryKeys.navigation(), (current) =>
    current ? actualizare(current) : current,
  );
  queryClient.setQueryData<CoreBootstrap>(coreBootstrapQueryKey, (current) =>
    current ? { ...current, navigation: actualizare(current.navigation) } : current,
  );
  void queryClient.invalidateQueries({ queryKey: coreBootstrapQueryKey });
}

export function useUserInterfaceSettings() {
  const queryClient = useQueryClient();
  const settingsQuery = useQuery({
    queryKey: userInterfaceQueryKeys.settings(),
    queryFn: fetchUserInterfaceSettings,
    retry: false,
    staleTime: 60_000,
  });
  const navigationQuery = useQuery({
    queryKey: userInterfaceQueryKeys.navigation(),
    queryFn: fetchUserInterfaceNavigation,
    retry: false,
    staleTime: 60_000,
  });

  const [numeAplicatie, setNumeAplicatie] = useState("");
  const [culori, setCulori] = useState<CuloriInterfata>(culoriImplicite);
  const [fontScale, setFontScale] = useState<FontScale>(1);
  const [elementeMeniu, setElementeMeniu] = useState<NavigationItem[]>([]);
  const [dialogSeparatorDeschis, setDialogSeparatorDeschis] = useState(false);
  const [separatorEditat, setSeparatorEditat] = useState<NavigationItem | null>(null);

  useEffect(() => {
    if (!settingsQuery.data) {
      return;
    }
    setNumeAplicatie(settingsQuery.data.site_name);
    setCulori({
      culoare_primara: settingsQuery.data.culoare_primara,
      culoare_accent: settingsQuery.data.culoare_accent,
      culoare_fundal: settingsQuery.data.culoare_fundal,
      culoare_titluri: settingsQuery.data.culoare_titluri,
    });
    setFontScale(settingsQuery.data.font_scale);
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
      const actualizare = (curente: NavigationItem[]) => [...curente, separator];
      setElementeMeniu(actualizare);
      actualizeazaNavigatiaDinCache(queryClient, actualizare);
      setDialogSeparatorDeschis(false);
      toast.success("Separatorul a fost adăugat.");
    },
    onError: (error) =>
      toast.error("Separatorul nu a putut fi adăugat", {
        description: formatApiError(error, "Încearcă din nou."),
      }),
  });
  const redenumesteSeparatorMutation = useMutation({
    mutationFn: ({ key, label }: { key: string; label: string }) =>
      renameUserInterfaceSeparator(key, label),
    onSuccess: (separator) => {
      const actualizare = (curente: NavigationItem[]) =>
        curente.map((element) => (element.key === separator.key ? separator : element));
      setElementeMeniu(actualizare);
      actualizeazaNavigatiaDinCache(queryClient, actualizare);
      setDialogSeparatorDeschis(false);
      toast.success("Separatorul a fost redenumit.");
    },
    onError: (error) =>
      toast.error("Separatorul nu a putut fi redenumit", {
        description: formatApiError(error, "Încearcă din nou."),
      }),
  });
  const stergeSeparatorMutation = useMutation({
    mutationFn: removeUserInterfaceSeparator,
    onSuccess: (_, key) => {
      const actualizare = (curente: NavigationItem[]) =>
        curente.filter((element) => element.key !== key);
      setElementeMeniu(actualizare);
      actualizeazaNavigatiaDinCache(queryClient, actualizare);
      toast.success("Separatorul a fost eliminat.");
    },
    onError: (error) =>
      toast.error("Separatorul nu a putut fi eliminat", {
        description: formatApiError(error, "Încearcă din nou."),
      }),
  });

  function salveazaNumele(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    configuratieMutation.mutate({ site_name: numeAplicatie.trim() });
  }

  function salveazaCulorile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    configuratieMutation.mutate(culori);
  }

  function salveazaDimensiuneaTextului(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    configuratieMutation.mutate({ font_scale: fontScale });
  }

  function deschideDialogSeparatorNou() {
    setSeparatorEditat(null);
    setDialogSeparatorDeschis(true);
  }

  function deschideDialogRedenumire(element: NavigationItem) {
    setSeparatorEditat(element);
    setDialogSeparatorDeschis(true);
  }

  function salveazaSeparator(label: string) {
    if (separatorEditat) {
      redenumesteSeparatorMutation.mutate({ key: separatorEditat.key, label });
      return;
    }
    separatorMutation.mutate(label);
  }

  function salveazaOrdinea() {
    ordineMutation.mutate(elementeMeniu.map((element) => element.key));
  }

  const numeEsteModificat =
    settingsQuery.data !== undefined && numeAplicatie.trim() !== settingsQuery.data.site_name;
  const culorileSuntModificate =
    settingsQuery.data !== undefined &&
    (culori.culoare_primara !== settingsQuery.data.culoare_primara ||
      culori.culoare_accent !== settingsQuery.data.culoare_accent ||
      culori.culoare_fundal !== settingsQuery.data.culoare_fundal ||
      culori.culoare_titluri !== settingsQuery.data.culoare_titluri);
  const dimensiuneaTextuluiEsteModificata =
    settingsQuery.data !== undefined && fontScale !== settingsQuery.data.font_scale;
  const ordineEsteModificata =
    navigationQuery.data !== undefined &&
    (elementeMeniu.length !== navigationQuery.data.length ||
      elementeMeniu.some((element, index) => element.key !== navigationQuery.data?.[index]?.key));

  const meniuInCurs =
    ordineMutation.isPending ||
    separatorMutation.isPending ||
    redenumesteSeparatorMutation.isPending ||
    stergeSeparatorMutation.isPending;

  return {
    configuratieMutation,
    culori,
    culorileSuntModificate,
    deschideDialogRedenumire,
    deschideDialogSeparatorNou,
    dialogSeparatorDeschis,
    dimensiuneaTextuluiEsteModificata,
    elementeMeniu,
    fontScale,
    meniuEsteGol: navigationQuery.isSuccess && elementeMeniu.length === 0,
    meniuInCurs,
    navigationQuery,
    numeAplicatie,
    numeEsteModificat,
    ordineEsteModificata,
    ordineMutation,
    redenumesteSeparatorMutation,
    salveazaCulorile,
    salveazaDimensiuneaTextului,
    salveazaNumele,
    salveazaOrdinea,
    salveazaSeparator,
    separatorEditat,
    separatorMutation,
    setCulori,
    setDialogSeparatorDeschis,
    setElementeMeniu,
    setFontScale,
    setNumeAplicatie,
    settingsQuery,
    stergeSeparator: (key: string) => stergeSeparatorMutation.mutate(key),
    stergeSeparatorMutation,
  };
}
