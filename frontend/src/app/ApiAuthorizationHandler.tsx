import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  apiAuthorizationFailureEvent,
  type ApiAuthorizationFailureDetail,
} from "@/api/http";

export function ApiAuthorizationHandler() {
  const queryClient = useQueryClient();

  useEffect(() => {
    function handleAuthorizationFailure(event: Event) {
      const detail = (event as CustomEvent<ApiAuthorizationFailureDetail>).detail;
      if (detail.status === 401) {
        queryClient.clear();
        window.location.assign("/");
        return;
      }

      if (detail.code === "csrf_failed" || detail.code === "csrf_missing") {
        toast.error("Sesiune de securitate expirată", {
          description: detail.detail,
        });
        return;
      }

      toast.error("Acces interzis", {
        description: detail.detail,
      });
    }

    window.addEventListener(apiAuthorizationFailureEvent, handleAuthorizationFailure);
    return () =>
      window.removeEventListener(apiAuthorizationFailureEvent, handleAuthorizationFailure);
  }, [queryClient]);

  return null;
}
