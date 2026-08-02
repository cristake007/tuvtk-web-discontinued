import { useRouteError } from "react-router";

import { ApplicationState } from "@/components/ApplicationState";

function isDynamicImportError(error: unknown): boolean {
  return error instanceof TypeError && /dynamically imported module/i.test(error.message);
}

export function RouteErrorBoundary() {
  const error = useRouteError();
  const dynamicImportFailed = isDynamicImportError(error);

  return (
    <ApplicationState
      description={
        dynamicImportFailed
          ? "O versiune nouă a aplicației este disponibilă sau modulul nu a putut fi încărcat."
          : "Pagina solicitată nu a putut fi încărcată momentan."
      }
      onRetry={() => window.location.reload()}
      retryLabel={dynamicImportFailed ? "Reîncarcă pagina" : "Încearcă din nou"}
      title={dynamicImportFailed ? "Actualizare disponibilă" : "Pagina nu este disponibilă"}
    />
  );
}
