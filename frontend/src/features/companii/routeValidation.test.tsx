import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { describe, expect, it, vi } from "vitest";

import { CompanieFormPage } from "@/pages/CompaniiPage";

const { createCompany, fetchCompany } = vi.hoisted(() => ({
  createCompany: vi.fn(),
  fetchCompany: vi.fn(),
}));

vi.mock("./api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./api")>()),
  fetchCompany,
  createCompany,
}));

describe("validarea rutei companiei", () => {
  it("redirecționează un identificator invalid fără a încărca sau crea o companie", async () => {
    const router = createMemoryRouter(
      [
        { path: "/crm/companii/:companyId/editare", element: <CompanieFormPage /> },
        { path: "/crm/companii", element: <p>Lista companiilor</p> },
      ],
      { initialEntries: ["/crm/companii/foo/editare"] },
    );
    render(
      <QueryClientProvider client={new QueryClient()}>
        <RouterProvider router={router} />
      </QueryClientProvider>,
    );

    await waitFor(() => expect(screen.getByText("Lista companiilor")).toBeInTheDocument());
    expect(fetchCompany).not.toHaveBeenCalled();
    expect(createCompany).not.toHaveBeenCalled();
  });
});
