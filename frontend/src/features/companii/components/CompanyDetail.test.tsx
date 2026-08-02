import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { toast } from "sonner";

import { archiveCompany, restoreCompany } from "../api";
import type { Company } from "../types";
import { CompanyDetail } from "./CompanyDetail";

vi.mock("../api", () => ({
  archiveCompany: vi.fn(),
  restoreCompany: vi.fn(),
}));
vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

const company: Company = {
  id: 7,
  name: "Exemplu SRL",
  legal_name: "Exemplu SRL",
  cui: "12345678",
  trade_registry_number: "J40/1/2026",
  vat_status: "TVA_PLATITOR",
  vat_status_label: "Plătitor de TVA",
  status: "ACTIV",
  status_label: "Activă",
  website: "",
  email: "",
  phone: "",
  street: "",
  city: "București",
  county: "București",
  postal_code: "",
  country: "România",
  owner: null,
  owner_detail: null,
  notes: "",
  is_archived: false,
  archived_at: null,
  created_at: "2026-08-01T10:00:00Z",
  updated_at: "2026-08-01T10:00:00Z",
};

function renderDetail(companyValue = company) {
  const client = new QueryClient({
    defaultOptions: { mutations: { retry: false }, queries: { retry: false } },
  });
  return render(
    <MemoryRouter>
      <QueryClientProvider client={client}>
        <CompanyDetail company={companyValue} />
      </QueryClientProvider>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.mocked(archiveCompany).mockReset();
  vi.mocked(restoreCompany).mockReset();
  vi.mocked(toast.error).mockReset();
  vi.mocked(toast.success).mockReset();
});

describe("detalii companie", () => {
  it("închide dialogul de confirmare după arhivarea reușită", async () => {
    vi.mocked(archiveCompany).mockResolvedValue({
      ...company,
      is_archived: true,
      archived_at: "2026-08-02T10:00:00Z",
    });
    renderDetail();

    fireEvent.click(screen.getByRole("button", { name: "Arhivează" }));
    fireEvent.click(await screen.findByRole("button", { name: "Confirmă" }));

    await waitFor(() => expect(archiveCompany).toHaveBeenCalledWith(company.id));
    await waitFor(() =>
      expect(
        screen.queryByRole("alertdialog", { name: "Arhivezi compania?" }),
      ).not.toBeInTheDocument(),
    );
  });

  it("închide dialogul de confirmare după restaurarea reușită", async () => {
    const archivedCompany = {
      ...company,
      is_archived: true,
      archived_at: "2026-08-01T10:00:00Z",
    };
    vi.mocked(restoreCompany).mockResolvedValue({
      ...archivedCompany,
      is_archived: false,
      archived_at: null,
    });
    renderDetail(archivedCompany);

    fireEvent.click(screen.getByRole("button", { name: "Restaurează" }));
    fireEvent.click(await screen.findByRole("button", { name: "Confirmă" }));

    await waitFor(() => expect(restoreCompany).toHaveBeenCalledWith(company.id));
    await waitFor(() =>
      expect(
        screen.queryByRole("alertdialog", { name: "Restaurezi compania?" }),
      ).not.toBeInTheDocument(),
    );
  });

  it("păstrează dialogul deschis când arhivarea eșuează", async () => {
    vi.mocked(archiveCompany).mockRejectedValue(new Error("Eroare"));
    renderDetail();

    fireEvent.click(screen.getByRole("button", { name: "Arhivează" }));
    fireEvent.click(await screen.findByRole("button", { name: "Confirmă" }));

    await waitFor(() => expect(archiveCompany).toHaveBeenCalledWith(company.id));
    expect(screen.getByRole("alertdialog", { name: "Arhivezi compania?" })).toBeInTheDocument();
    expect(toast.error).toHaveBeenCalledWith("Compania nu a putut fi arhivată. Încearcă din nou.");
  });
});
