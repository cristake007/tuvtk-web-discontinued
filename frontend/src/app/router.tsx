import { lazy, Suspense } from "react";
import { createBrowserRouter } from "react-router-dom";

import { ApplicationState } from "@/components/ApplicationState";
import { DashboardPage } from "@/pages/DashboardPage";
import { ModulePlaceholderPage } from "@/pages/ModulePlaceholderPage";
import { WorkspaceCardPage } from "@/pages/WorkspaceCardPage";

import { AuthenticationGate } from "./AuthenticationGate";

const CoursePlannerPage = lazy(async () => {
  const module = await import("@/pages/CoursePlannerPage");
  return { default: module.CoursePlannerPage };
});

const CoursePlannerHistoryPage = lazy(async () => {
  const module = await import("@/pages/CoursePlannerHistoryPage");
  return { default: module.CoursePlannerHistoryPage };
});

const SettingsPage = lazy(async () => {
  const module = await import("@/pages/SettingsPage");
  return { default: module.SettingsPage };
});

const IntegrationsPage = lazy(async () => {
  const module = await import("@/pages/IntegrationsPage");
  return { default: module.IntegrationsPage };
});

function CoursePlannerRoute() {
  return (
    <Suspense
      fallback={
        <ApplicationState
          description="Se încarcă instrumentele pentru generarea perioadelor."
          loading
          title="Se încarcă planificatorul"
        />
      }
    >
      <CoursePlannerPage />
    </Suspense>
  );
}

function CoursePlannerHistoryRoute() {
  return (
    <Suspense
      fallback={
        <ApplicationState
          description="Se încarcă generările și fișierele disponibile."
          loading
          title="Se încarcă istoricul"
        />
      }
    >
      <CoursePlannerHistoryPage />
    </Suspense>
  );
}

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

function IntegrationsRoute() {
  return (
    <Suspense
      fallback={
        <ApplicationState
          description="Se încarcă serviciile externe și calendarul zilelor nelucrătoare."
          loading
          title="Se încarcă integrările"
        />
      }
    >
      <IntegrationsPage />
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
        path: "planificator-cursuri",
        element: <CoursePlannerRoute />,
      },
      {
        path: "planificator-cursuri/istoric",
        element: <CoursePlannerHistoryRoute />,
      },
      {
        path: "settings",
        element: <SettingsRoute />,
      },
      {
        path: "settings/integrations",
        element: <IntegrationsRoute />,
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
