import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { MemoryRouter } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ContactsByCompany } from "./ContactsByCompany";

function response() {
  return new Response(
    JSON.stringify({
      count: 1,
      next: null,
      previous: null,
      results: [
        {
          id: 11,
          first_name: "Ana",
          last_name: "Popescu",
          job_title: "Director",
          company: 7,
          company_detail: { id: 7, name: "Exemplu SRL", is_archived: false },
          email: "ana@example.test",
          phone: "",
          mobile_phone: "",
          status: "ACTIV",
          status_label: "Activ",
          owner: null,
          owner_detail: null,
          notes: "",
          is_archived: false,
          archived_at: null,
          created_at: "2026-08-01T10:00:00Z",
          updated_at: "2026-08-01T10:00:00Z",
        },
      ],
    }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );
}

function renderComponent(element: ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <MemoryRouter>
      <QueryClientProvider client={client}>{element}</QueryClientProvider>
    </MemoryRouter>,
  );
}

afterEach(() => vi.unstubAllGlobals());

describe("contacte după companie", () => {
  it("folosește filtrul de companie și redă lista standalone", async () => {
    const fetchMock = vi.fn().mockResolvedValue(response());
    vi.stubGlobal("fetch", fetchMock);
    renderComponent(<ContactsByCompany companyId={7} />);
    expect(await screen.findByText("Ana Popescu")).toBeInTheDocument();
    expect(String(fetchMock.mock.calls[0]?.[0])).toContain("company=7");
  });

  it("redă aceeași implementare în detaliul companiei", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response()));
    renderComponent(
      <section>
        <h2>Detalii companie</h2>
        <ContactsByCompany companyId={7} />
      </section>,
    );
    expect(screen.getByRole("heading", { name: "Detalii companie" })).toBeInTheDocument();
    expect(await screen.findByText("Ana Popescu")).toBeInTheDocument();
  });
});
