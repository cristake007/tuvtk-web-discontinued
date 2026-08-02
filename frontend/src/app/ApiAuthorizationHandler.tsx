import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { coreBootstrapQueryKey } from "@/api/core";
import { apiAuthorizationFailureEvent, type ApiAuthorizationFailureDetail } from "@/api/http";

import { router } from "./router";

export function ApiAuthorizationHandler() {
  const queryClient = useQueryClient();

  useEffect(() => {
    async function handleAuthorizationFailure(event: Event) {
      const detail = (event as CustomEvent<ApiAuthorizationFailureDetail>).detail;
      if (detail.status === 401) {
        await queryClient.cancelQueries();
        queryClient.removeQueries({
          predicate: (query) => query.queryKey[0] !== coreBootstrapQueryKey[0],
        });
        await queryClient.resetQueries({ queryKey: coreBootstrapQueryKey });
        await router.navigate("/tablou-de-bord", { replace: true });
        return;
      }

      if (detail.code === "csrf_failed" || detail.code === "csrf_missing") {
        toast.error("Sesiune de securitate expirată", {
          description: "Reîncarcă pagina și încearcă din nou.",
        });
        return;
      }

      toast.error("Acces interzis", {
        description: "Nu ai permisiunea necesară pentru această acțiune.",
      });
    }

    window.addEventListener(apiAuthorizationFailureEvent, handleAuthorizationFailure);
    return () =>
      window.removeEventListener(apiAuthorizationFailureEvent, handleAuthorizationFailure);
  }, [queryClient]);

  return null;
}
