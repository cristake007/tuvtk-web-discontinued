import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { apiAuthorizationFailureEvent } from "@/api/http";

export function ApiAuthorizationHandler() {
  const queryClient = useQueryClient();

  useEffect(() => {
    function handleAuthorizationFailure(event: Event) {
      const status = (event as CustomEvent<{ status: number }>).detail.status;
      if (status === 401) {
        queryClient.clear();
        window.location.assign("/");
        return;
      }

      toast.error("Acces interzis", {
        description: "Contul tău nu are permisiunea necesară pentru această operațiune.",
      });
    }

    window.addEventListener(apiAuthorizationFailureEvent, handleAuthorizationFailure);
    return () =>
      window.removeEventListener(apiAuthorizationFailureEvent, handleAuthorizationFailure);
  }, [queryClient]);

  return null;
}
