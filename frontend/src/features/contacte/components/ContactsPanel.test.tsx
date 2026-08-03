import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it, vi } from "vitest";

import { LoadingOverlayProvider } from "@/app/LoadingOverlayContext";

import { fetchContactCompanies, fetchContactOwners, fetchContacts } from "../api";
import { ContactsPanel } from "./ContactsPanel";

vi.mock("../api", () => ({
  fetchContacts: vi.fn(),
  fetchContactCompanies: vi.fn(),
  fetchContactOwners: vi.fn(),
}));

describe("lista contactelor", () => {
  it("face contactele arhivate accesibile prin filtrul din interfață", async () => {
    vi.mocked(fetchContactCompanies).mockResolvedValue([]);
    vi.mocked(fetchContactOwners).mockResolvedValue([]);
    vi.mocked(fetchContacts).mockImplementation(async (filters) => ({
      count: filters.archived ? 1 : 0,
      next: null,
      previous: null,
      results: filters.archived
        ? [
            {
              id: 11,
              first_name: "Ana",
              last_name: "Arhivată",
              job_title: "",
              company: null,
              company_detail: null,
              email: "",
              phone: "",
              mobile_phone: "",
              status: "INACTIV",
              status_label: "Inactiv",
              owner: null,
              owner_detail: null,
              notes: "",
              is_archived: true,
              archived_at: "2026-08-02T10:00:00Z",
              created_at: "2026-08-01T10:00:00Z",
              updated_at: "2026-08-02T10:00:00Z",
            },
          ]
        : [],
    }));
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <MemoryRouter>
        <LoadingOverlayProvider>
          <QueryClientProvider client={client}>
            <ContactsPanel />
          </QueryClientProvider>
        </LoadingOverlayProvider>
      </MemoryRouter>,
    );
    await screen.findByText("Nu există contacte");
    fireEvent.click(screen.getByRole("checkbox", { name: "Afișează arhivate" }));
    expect(await screen.findByText("Ana Arhivată")).toBeInTheDocument();
    expect(screen.getByText("Fără companie")).toBeInTheDocument();
    await waitFor(() =>
      expect(fetchContacts).toHaveBeenLastCalledWith(expect.objectContaining({ archived: true })),
    );
  });
});
