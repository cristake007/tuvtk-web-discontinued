import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";

import { appRoutes } from "./router";
import { LoadingOverlayProvider } from "./LoadingOverlayContext";

vi.mock("@/pages/CoursePlannerPage", () => ({
  CoursePlannerPage: () => <h1>Planificator montat</h1>,
}));

const normalUser = {
  id: 1,
  username: "utilizator",
  display_name: "Utilizator normal",
  email: "",
  is_staff: false,
  is_superuser: false,
};

function bootstrap(accessibleApplicationKeys: string[] = []) {
  return {
    authenticated: true,
    configuration: {
      site_name: "TUVTK", organization_name: "TUVTK", sidebar_title: "Workspace",
      logo_url: null, culoare_primara: "#164194", culoare_accent: "#d41131", culoare_fundal: "#ffffff", culoare_titluri: "#1b2230",
    },
    user: normalUser,
    navigation: [],
    accessible_application_keys: accessibleApplicationKeys,
  };
}

function renderRoute(path: string, data = bootstrap()) {
  const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
    if (String(input).includes("/api/v1/core/bootstrap")) {
      return new Response(JSON.stringify(data), { status: 200, headers: { "Content-Type": "application/json" } });
    }
    return new Response(JSON.stringify({ detail: "Nu trebuie cerut" }), { status: 500 });
  });
  vi.stubGlobal("fetch", fetchMock);
  const router = createMemoryRouter(appRoutes, { initialEntries: [path] });
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(<QueryClientProvider client={queryClient}><LoadingOverlayProvider><RouterProvider router={router} /></LoadingOverlayProvider></QueryClientProvider>);
  return fetchMock;
}

afterEach(() => vi.unstubAllGlobals());

describe("rutele protejate", () => {
  for (const path of ["/administrare", "/administrare/utilizatori", "/administrare/utilizatori/1", "/administrare/grupuri", "/administrare/integrari"]) {
    it(`nu montează administrarea pentru utilizator normal: ${path}`, async () => {
      const fetchMock = renderRoute(path);
      await screen.findByRole("heading", { name: "Acces interzis" });
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });
  }

  for (const path of ["/planificator-cursuri", "/planificator-cursuri/generator", "/planificator-cursuri/istoric"]) {
    it(`nu montează planificatorul fără acces: ${path}`, async () => {
      const fetchMock = renderRoute(path);
      await screen.findByRole("heading", { name: "Acces interzis" });
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });
  }

  it("montează pagina planificatorului pentru cheia ACL acordată", async () => {
    renderRoute("/planificator-cursuri", bootstrap(["course-planner"]));
    await waitFor(() => expect(screen.getByRole("heading", { name: "Planificator montat" })).toBeInTheDocument());
  });
});
