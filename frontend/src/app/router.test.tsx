import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, render, screen, waitFor } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";

import { coreBootstrapQueryKey } from "@/api/core";
import type { CoreBootstrap } from "@/features/core/types";

import { appRoutes } from "./router";
import { LoadingOverlayProvider } from "./LoadingOverlayContext";

const normalUser = {
  id: 1,
  username: "utilizator",
  display_name: "Utilizator normal",
  email: "",
  is_staff: false,
  is_superuser: false,
};

function bootstrap(accessibleApplicationKeys: string[] = []): CoreBootstrap {
  return {
    authenticated: true,
    configuration: {
      site_name: "TUVTK",
      organization_name: "TUVTK",
      sidebar_title: "Workspace",
      logo_url: null,
      culoare_primara: "#164194",
      culoare_accent: "#d41131",
      culoare_fundal: "#ffffff",
      culoare_titluri: "#1b2230",
      font_scale: 1,
    },
    user: normalUser,
    navigation: [],
    accessible_application_keys: accessibleApplicationKeys,
  };
}

function renderRoute(path: string, data = bootstrap()) {
  const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
    if (String(input).includes("/api/v1/core/bootstrap")) {
      return new Response(JSON.stringify(data), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }
    return new Response(JSON.stringify({ detail: "Nu trebuie cerut" }), { status: 500 });
  });
  vi.stubGlobal("fetch", fetchMock);
  const router = createMemoryRouter(appRoutes, { initialEntries: [path] });
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={queryClient}>
      <LoadingOverlayProvider>
        <RouterProvider router={router} />
      </LoadingOverlayProvider>
    </QueryClientProvider>,
  );
  return { fetchMock, queryClient, router };
}

afterEach(() => vi.unstubAllGlobals());

describe("rutele protejate", () => {
  for (const path of [
    "/administrare",
    "/administrare/utilizatori",
    "/administrare/utilizatori/1",
    "/administrare/grupuri",
    "/administrare/integrari",
  ]) {
    it(`nu montează administrarea pentru utilizator normal: ${path}`, async () => {
      const { fetchMock } = renderRoute(path);
      await screen.findByRole("heading", { name: "Acces interzis" });
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });
  }

  for (const path of ["/planificator-cursuri/generator", "/planificator-cursuri/istoric"]) {
    it(`nu montează planificatorul fără acces: ${path}`, async () => {
      const { fetchMock } = renderRoute(path);
      await screen.findByRole("heading", { name: "Acces interzis" });
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });
  }

  it("nu expune o pagină pentru rădăcina planificatorului", async () => {
    renderRoute("/planificator-cursuri", bootstrap(["planificator-cursuri"]));

    await screen.findByRole("heading", { name: "Pagina nu a fost găsită" });
    expect(screen.getByText("Eroare 404")).toBeInTheDocument();
  });

  it("folosește prezentarea 404 pentru o rută inexistentă", async () => {
    renderRoute("/ruta-inexistenta");

    const heading = await screen.findByRole("heading", { name: "Pagina nu a fost găsită" });
    expect(screen.getByText("Eroare 404")).toBeInTheDocument();
    expect(screen.queryByText("Modul în pregătire")).not.toBeInTheDocument();
    expect(heading.closest("section")?.parentElement).toHaveAttribute(
      "data-slot",
      "app-content-scroll",
    );
  });

  it("reflectă numele configurat al aplicației în titlul filei de browser", async () => {
    document.title = "TUVTK";
    const data = bootstrap();
    const { queryClient } = renderRoute("/ruta-inexistenta", {
      ...data,
      configuration: { ...data.configuration, site_name: "Portal cursuri" },
    });

    await screen.findByRole("heading", { name: "Pagina nu a fost găsită" });
    expect(document.title).toBe("Pagina nu a fost găsită | Portal cursuri");

    act(() => {
      queryClient.setQueryData<CoreBootstrap>(coreBootstrapQueryKey, (current) =>
        current
          ? {
              ...current,
              configuration: { ...current.configuration, site_name: "Portal actualizat" },
            }
          : current,
      );
    });

    await waitFor(() => expect(document.title).toBe("Pagina nu a fost găsită | Portal actualizat"));
  });

  it("aplică și actualizează scala globală a textului", async () => {
    const data = bootstrap();
    const { queryClient } = renderRoute("/ruta-inexistenta", {
      ...data,
      configuration: { ...data.configuration, font_scale: 1.125 },
    });

    await waitFor(() =>
      expect(document.documentElement.style.getPropertyValue("--app-font-scale")).toBe("1.125"),
    );

    act(() => {
      queryClient.setQueryData<CoreBootstrap>(coreBootstrapQueryKey, (current) =>
        current
          ? {
              ...current,
              configuration: { ...current.configuration, font_scale: 1.25 },
            }
          : current,
      );
    });

    await waitFor(() =>
      expect(document.documentElement.style.getPropertyValue("--app-font-scale")).toBe("1.25"),
    );
  });

  it("combină titlul rutei curente cu numele aplicației", async () => {
    const data = bootstrap(["contacte", "oportunitati"]);
    const { router } = renderRoute("/crm/contacte", {
      ...data,
      configuration: { ...data.configuration, site_name: "Portal cursuri" },
    });

    await screen.findByRole("heading", { name: "Contacte" });
    expect(document.title).toBe("Contacte | Portal cursuri");

    await act(() => router.navigate("/crm/oportunitati"));
    await screen.findByRole("heading", { name: "Oportunități" });
    expect(document.title).toBe("Oportunități | Portal cursuri");
  });
});
