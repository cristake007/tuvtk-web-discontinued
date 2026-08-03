import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { LoadingOverlayProvider } from "@/app/LoadingOverlayContext";

import { fetchCompanies, fetchOwners, restoreCompany } from "../api";
import type { Company } from "../types";
import { CompaniesPanel } from "./CompaniesPanel";
import { CompanyDetail } from "./CompanyDetail";

vi.mock("../api", () => ({
  archiveCompany: vi.fn(),
  fetchCompanies: vi.fn(),
  fetchOwners: vi.fn(),
  restoreCompany: vi.fn(),
}));
vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

const archivedCompany: Company = {
  id: 7,
  name: "Companie arhivată SRL",
  legal_name: "",
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
  is_archived: true,
  archived_at: "2026-08-01T10:00:00Z",
  created_at: "2026-08-01T10:00:00Z",
  updated_at: "2026-08-01T10:00:00Z",
};

const activeCompany: Company = {
  ...archivedCompany,
  id: 8,
  name: "Companie activă SRL",
  is_archived: false,
  archived_at: null,
};

beforeEach(() => {
  vi.mocked(fetchCompanies).mockReset();
  vi.mocked(fetchOwners).mockReset().mockResolvedValue([]);
  vi.mocked(restoreCompany).mockReset().mockResolvedValue({
    ...archivedCompany,
    is_archived: false,
    archived_at: null,
  });
  vi.mocked(fetchCompanies).mockImplementation(async (filters) => ({
    count: 1,
    next: null,
    previous: null,
    results: filters.archived ? [archivedCompany] : [activeCompany],
  }));
});

describe("lista companiilor", () => {
  it("permite găsirea unei companii arhivate și restaurarea ei", async () => {
    const client = new QueryClient({
      defaultOptions: { mutations: { retry: false }, queries: { retry: false } },
    });
    render(
      <MemoryRouter initialEntries={["/crm/companii"]}>
        <LoadingOverlayProvider>
          <QueryClientProvider client={client}>
            <Routes>
              <Route path="/crm/companii" element={<CompaniesPanel />} />
              <Route
                path="/crm/companii/:companyId"
                element={<CompanyDetail company={archivedCompany} />}
              />
            </Routes>
          </QueryClientProvider>
        </LoadingOverlayProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByText(activeCompany.name)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("checkbox", { name: "Afișează arhivate" }));

    expect(await screen.findByText(archivedCompany.name)).toBeInTheDocument();
    await waitFor(() =>
      expect(fetchCompanies).toHaveBeenLastCalledWith(expect.objectContaining({ archived: true })),
    );

    fireEvent.click(screen.getByText(archivedCompany.name));
    fireEvent.click(await screen.findByRole("button", { name: "Restaurează" }));
    fireEvent.click(await screen.findByRole("button", { name: "Confirmă" }));

    await waitFor(() => expect(restoreCompany).toHaveBeenCalledWith(archivedCompany.id));
  });
});
