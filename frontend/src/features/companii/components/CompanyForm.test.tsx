import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { CompanyForm } from "./CompanyForm";

function renderForm(onSubmit = vi.fn()) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  render(
    <QueryClientProvider client={client}>
      <CompanyForm pending={false} onSubmit={onSubmit} />
    </QueryClientProvider>,
  );
  return onSubmit;
}

describe("formular companie", () => {
  it("afișează validarea pentru numele obligatoriu", () => {
    const onSubmit = renderForm();
    fireEvent.click(screen.getByRole("button", { name: "Salvează" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Numele companiei este obligatoriu.");
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("respinge un CUI cu litere după prefix", () => {
    const onSubmit = renderForm();
    fireEvent.change(screen.getByLabelText("Nume companie *"), { target: { value: "Acme" } });
    fireEvent.change(screen.getByLabelText("CUI"), { target: { value: "RO12A" } });
    fireEvent.click(screen.getByRole("button", { name: "Salvează" }));
    expect(screen.getByRole("alert")).toHaveTextContent("CUI-ul poate conține doar cifre");
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
