import type { ReactNode } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { LoadingOverlayProvider } from "@/app/LoadingOverlayContext";

import { ApplicationState } from "./ApplicationState";
import { QueryApplicationState } from "./QueryApplicationState";

function renderState(component: ReactNode) {
  return render(<LoadingOverlayProvider>{component}</LoadingOverlayProvider>);
}

describe("ApplicationState", () => {
  it("folosește o secțiune etichetată, fără să introducă un al doilea main", () => {
    const { container } = renderState(
      <ApplicationState
        description="Datele nu au putut fi încărcate."
        title="Pagina nu este disponibilă"
      />,
    );

    expect(container.querySelector("main")).not.toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Pagina nu este disponibilă" })).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 1, name: "Pagina nu este disponibilă" }),
    ).toBeInTheDocument();
  });

  it("afișează acțiunea standard de retry", () => {
    const onRetry = vi.fn();
    renderState(
      <ApplicationState
        description="Datele nu au putut fi încărcate."
        onRetry={onRetry}
        title="Pagina nu este disponibilă"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Încearcă din nou" }));
    expect(onRetry).toHaveBeenCalledOnce();
  });
});

describe("QueryApplicationState", () => {
  it("transmite retry-ul query-ului către starea comună", () => {
    const onRetry = vi.fn();
    renderState(
      <QueryApplicationState
        error={new Error("Eroare")}
        errorDescription="Datele nu au putut fi încărcate."
        errorTitle="Pagina nu este disponibilă"
        loading={false}
        loadingDescription="Se încarcă datele."
        loadingTitle="Se încarcă pagina"
        onRetry={onRetry}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Încearcă din nou" }));
    expect(onRetry).toHaveBeenCalledOnce();
  });
});
