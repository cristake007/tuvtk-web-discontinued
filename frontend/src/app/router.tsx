import { lazy, Suspense } from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";

import { ApplicationState } from "@/components/ApplicationState";
import { DocumentePage } from "@/pages/DocumentePage";
import { ModulePlaceholderPage } from "@/pages/ModulePlaceholderPage";
import { TablouDeBordPage } from "@/pages/TablouDeBordPage";
import { WorkspaceCardPage } from "@/pages/WorkspaceCardPage";

import { AuthenticationGate } from "./AuthenticationGate";
import { ApplicationAccessRoute } from "./ApplicationAccessRoute";

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

const UtilizatorFormPage = lazy(async () => {
  const module = await import("@/pages/UtilizatorFormPage");
  return { default: module.UtilizatorFormPage };
});

const GrupuriAplicatiiPage = lazy(async () => {
  const module = await import("@/pages/GrupuriAplicatiiPage");
  return { default: module.GrupuriAplicatiiPage };
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

function UtilizatorFormRoute() {
  return (
    <Suspense
      fallback={
        <ApplicationState
          description="Se încarcă formularul utilizatorului."
          loading
          title="Se încarcă utilizatorul"
        />
      }
    >
      <UtilizatorFormPage />
    </Suspense>
  );
}

function GrupuriAplicatiiRoute() {
  return (
    <Suspense fallback={<ApplicationState description="Se încarcă grupurile și accesul la aplicații." loading title="Se încarcă grupurile" />}>
      <GrupuriAplicatiiPage />
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
        element: <Navigate replace to="/tablou-de-bord" />,
      },
      {
        path: "tablou-de-bord",
        element: <TablouDeBordPage />,
      },
      {
        path: "crm",
        element: (
          <ModulePlaceholderPage
            title="CRM"
            description="Alege un modul CRM din meniul lateral pentru a continua."
          />
        ),
      },
      {
        path: "crm/companii",
        element: <ApplicationAccessRoute applicationKey="companies"><WorkspaceCardPage ariaLabel="Conținut companii" /></ApplicationAccessRoute>,
      },
      {
        path: "companies",
        element: <ApplicationAccessRoute applicationKey="companies"><WorkspaceCardPage ariaLabel="Conținut companii" /></ApplicationAccessRoute>,
      },
      {
        path: "crm/contacte",
        element: (
          <ModulePlaceholderPage
            title="Contacte"
            description="Modulul pentru gestionarea contactelor va fi disponibil aici."
          />
        ),
      },
      {
        path: "crm/oportunitati",
        element: (
          <ModulePlaceholderPage
            title="Oportunități"
            description="Modulul pentru gestionarea oportunităților va fi disponibil aici."
          />
        ),
      },
      {
        path: "crm/activitati",
        element: (
          <ModulePlaceholderPage
            title="Activități"
            description="Modulul pentru gestionarea activităților va fi disponibil aici."
          />
        ),
      },
      {
        path: "training/in-pregatire",
        element: (
          <ModulePlaceholderPage
            title="Training"
            description="Modulele pentru Training vor fi definite ulterior."
          />
        ),
      },
      {
        path: "certificari/in-pregatire",
        element: (
          <ModulePlaceholderPage
            title="Certificări"
            description="Modulele pentru Certificări vor fi definite ulterior."
          />
        ),
      },
      {
        path: "industrial/in-pregatire",
        element: (
          <ModulePlaceholderPage
            title="Industrial"
            description="Modulele pentru Industrial vor fi definite ulterior."
          />
        ),
      },
      {
        path: "documente",
        element: <ApplicationAccessRoute applicationKey="documents"><DocumentePage /></ApplicationAccessRoute>,
      },
      {
        path: "planificator-cursuri",
        element: <ApplicationAccessRoute applicationKey="course-planner"><CoursePlannerRoute /></ApplicationAccessRoute>,
      },
      {
        path: "planificator-cursuri/generator",
        element: <ApplicationAccessRoute applicationKey="course-planner"><CoursePlannerGeneratorRoute /></ApplicationAccessRoute>,
      },
      {
        path: "planificator-cursuri/istoric",
        element: <ApplicationAccessRoute applicationKey="course-planner"><CoursePlannerHistoryRoute /></ApplicationAccessRoute>,
      },
      {
        path: "planificator-cursuri/xml",
        element: <ApplicationAccessRoute applicationKey="course-planner">
          <ModulePlaceholderPage
            title="XML cursuri"
            description="Modulul pentru pregătirea și validarea fișierelor XML va fi disponibil aici."
          />
        </ApplicationAccessRoute>,
      },
      {
        path: "planificator-cursuri/word-matcher",
        element: <ApplicationAccessRoute applicationKey="course-planner">
          <ModulePlaceholderPage
            title="Word Matcher"
            description="Modulul pentru potrivirea datelor cursurilor cu documentele Word va fi disponibil aici."
          />
        </ApplicationAccessRoute>,
      },
      {
        path: "planificator-cursuri/update-wordpress",
        element: <ApplicationAccessRoute applicationKey="course-planner">
          <ModulePlaceholderPage
            title="Update WordPress"
            description="Modulul pentru actualizarea conținutului WordPress va fi disponibil aici."
          />
        </ApplicationAccessRoute>,
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
        path: "administrare/utilizatori/adaugare",
        element: <UtilizatorFormRoute />,
      },
      {
        path: "administrare/utilizatori/:userId",
        element: <UtilizatorFormRoute />,
      },
      {
        path: "administrare/grupuri",
        element: <GrupuriAplicatiiRoute />,
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
