import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ContactForm } from "./ContactForm";

vi.mock("../api", () => ({
  fetchContactCompanies: vi.fn().mockResolvedValue([]),
  fetchContactOwners: vi.fn().mockResolvedValue([]),
}));

function renderForm(onSubmit = vi.fn()) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <ContactForm pending={false} onSubmit={onSubmit} />
    </QueryClientProvider>,
  );
  return onSubmit;
}

describe("formular contact", () => {
  it("validează prenumele și numele obligatorii", () => {
    const onSubmit = renderForm();
    const form = screen.getByRole("button", { name: "Salvează" }).closest("form");
    expect(form).not.toBeNull();
    fireEvent.submit(form!);
    expect(screen.getByRole("alert")).toHaveTextContent("Prenumele este obligatoriu.");
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("validează formatul adresei de e-mail", () => {
    const onSubmit = renderForm();
    fireEvent.change(screen.getByLabelText("Prenume *"), { target: { value: "Ana" } });
    fireEvent.change(screen.getByLabelText("Nume *"), { target: { value: "Pop" } });
    fireEvent.change(screen.getByLabelText("E-mail"), { target: { value: "invalid" } });
    const form = screen.getByRole("button", { name: "Salvează" }).closest("form");
    expect(form).not.toBeNull();
    fireEvent.submit(form!);
    expect(screen.getByRole("alert")).toHaveTextContent("Adresa de e-mail nu este validă.");
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("permite salvarea fără companie", () => {
    const onSubmit = renderForm();
    fireEvent.change(screen.getByLabelText("Prenume *"), { target: { value: "Ana" } });
    fireEvent.change(screen.getByLabelText("Nume *"), { target: { value: "Pop" } });
    fireEvent.click(screen.getByRole("button", { name: "Salvează" }));
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ company: null }));
  });
});
