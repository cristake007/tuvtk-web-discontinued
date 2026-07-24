import { lazy, Suspense } from "react";
import { createBrowserRouter } from "react-router-dom";

import { ApplicationState } from "@/components/ApplicationState";
import { DashboardPage } from "@/pages/DashboardPage";
import { ModulePlaceholderPage } from "@/pages/ModulePlaceholderPage";
import { WorkspaceCardPage } from "@/pages/WorkspaceCardPage";

import { AuthenticationGate } from "./AuthenticationGate";

const SettingsPage = lazy(async () => {
  const module = await import("@/pages/SettingsPage");
  return { default: module.SettingsPage };
});

function SettingsRoute() {
  return (
    <Suspense
      fallback={
        <ApplicationState
          description="Se încarcă identitatea vizuală și configurarea aplicației."
          loading
          title="Se încarcă setările"
        />
      }
    >
      <SettingsPage />
    </Suspense>
  );
}

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AuthenticationGate />,
    children: [
      {
        index: true,
        element: <DashboardPage />,
      },
      {
        path: "companies",
        element: <WorkspaceCardPage ariaLabel="Conținut companii" />,
      },
      {
        path: "documents",
        element: <WorkspaceCardPage ariaLabel="Conținut documente" />,
      },
      {
        path: "settings",
        element: <SettingsRoute />,
      },
      {
        path: "*",
        element: (
          <ModulePlaceholderPage
            title="Pagina nu a fost găsită"
            description="Ruta solicitată nu există în aplicație."
          />
        ),
      },
    ],
  },
]);
