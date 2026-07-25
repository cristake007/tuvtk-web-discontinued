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

const CoursePlannerGeneratorPage = lazy(async () => {
  const module = await import("@/pages/CoursePlannerGeneratorPage");
  return { default: module.CoursePlannerGeneratorPage };
});

const CoursePlannerHistoryPage = lazy(async () => {
  const module = await import("@/pages/CoursePlannerHistoryPage");
  return { default: module.CoursePlannerHistoryPage };
});

const AdministrationPage = lazy(async () => {
  const module = await import("@/pages/AdministrationPage");
  return { default: module.AdministrationPage };
});

const AdministrationUserInterfacePage = lazy(async () => {
  const module = await import("@/pages/AdministrationUserInterfacePage");
  return { default: module.AdministrationUserInterfacePage };
});

const UtilizatoriPage = lazy(async () => {
  const module = await import("@/pages/UtilizatoriPage");
  return { default: module.UtilizatoriPage };
});

const IntegrationsPage = lazy(async () => {
  const module = await import("@/pages/IntegrationsPage");
  return { default: module.IntegrationsPage };
});

const PublicHolidaysIntegrationPage = lazy(async () => {
  const module = await import("@/pages/PublicHolidaysIntegrationPage");
  return { default: module.PublicHolidaysIntegrationPage };
});

function CoursePlannerRoute() {
  return (
    <Suspense
      fallback={
        <ApplicationState
          description="Se încarcă instrumentele disponibile pentru cursuri."
          loading
          title="Se încarcă planificatorul"
        />
      }
    >
      <CoursePlannerPage />
    </Suspense>
  );
}

function CoursePlannerGeneratorRoute() {
  return (
    <Suspense
      fallback={
        <ApplicationState
          description="Se încarcă instrumentele pentru generarea perioadelor."
          loading
          title="Se încarcă generatorul"
        />
      }
    >
      <CoursePlannerGeneratorPage />
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

function AdministrationRoute() {
  return (
    <Suspense
      fallback={
        <ApplicationState
          description="Se încarcă opțiunile de administrare ale platformei."
          loading
          title="Se încarcă administrarea"
        />
      }
    >
      <AdministrationPage />
    </Suspense>
  );
}

function AdministrationUserInterfaceRoute() {
  return (
    <Suspense
      fallback={
        <ApplicationState
          description="Se încarcă opțiunile interfeței utilizator."
          loading
          title="Se încarcă interfața utilizator"
        />
      }
    >
      <AdministrationUserInterfacePage />
    </Suspense>
  );
}

function UtilizatoriRoute() {
  return (
    <Suspense
      fallback={
        <ApplicationState
          description="Se încarcă utilizatorii și drepturile conturilor."
          loading
          title="Se încarcă utilizatorii"
        />
      }
    >
      <UtilizatoriPage />
    </Suspense>
  );
}

function IntegrationsRoute() {
  return (
    <Suspense
      fallback={
        <ApplicationState
          description="Se încarcă serviciile disponibile pentru configurare."
          loading
          title="Se încarcă integrările"
        />
      }
    >
      <IntegrationsPage />
    </Suspense>
  );
}

function PublicHolidaysIntegrationRoute() {
  return (
    <Suspense
      fallback={
        <ApplicationState
          description="Se încarcă integrarea pentru zile libere și sărbători."
          loading
          title="Se încarcă integrarea"
        />
      }
    >
      <PublicHolidaysIntegrationPage />
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
        path: "planificator-cursuri/generator",
        element: <CoursePlannerGeneratorRoute />,
      },
      {
        path: "planificator-cursuri/istoric",
        element: <CoursePlannerHistoryRoute />,
      },
      {
        path: "planificator-cursuri/xml",
        element: (
          <ModulePlaceholderPage
            title="XML cursuri"
            description="Modulul pentru pregătirea și validarea fișierelor XML va fi disponibil aici."
          />
        ),
      },
      {
        path: "planificator-cursuri/word-matcher",
        element: (
          <ModulePlaceholderPage
            title="Word Matcher"
            description="Modulul pentru potrivirea datelor cursurilor cu documentele Word va fi disponibil aici."
          />
        ),
      },
      {
        path: "administrare",
        element: <AdministrationRoute />,
      },
      {
        path: "administrare/sistem/interfata-utilizator",
        element: <AdministrationUserInterfaceRoute />,
      },
      {
        path: "administrare/utilizatori",
        element: <UtilizatoriRoute />,
      },
      {
        path: "administrare/integrari",
        element: <IntegrationsRoute />,
      },
      {
        path: "administrare/integrari/zile-libere",
        element: <PublicHolidaysIntegrationRoute />,
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
