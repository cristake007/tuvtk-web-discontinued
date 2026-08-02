import { lazy, Suspense } from "react";
import { createBrowserRouter, Navigate } from "react-router";

import { ApplicationState } from "@/components/ApplicationState";
import { AdministrationHeader } from "@/features/administration/AdministrationHeader";
import { AdministrationUserInterfaceHeader } from "@/features/branding/AdministrationUserInterfaceHeader";
import { IntegrationsHeader } from "@/features/integrations/IntegrationsHeader";
import { PublicHolidaysIntegrationHeader } from "@/features/integrations/public-holidays/PublicHolidaysIntegrationHeader";
import { GrupuriAplicatiiHeader } from "@/features/utilizatori/GrupuriAplicatiiHeader";
import { UtilizatoriHeader } from "@/features/utilizatori/UtilizatoriHeader";
import { UtilizatorFormHeader } from "@/features/utilizatori/UtilizatorFormHeader";
import { DocumentePage } from "@/pages/DocumentePage";
import { ModulePlaceholderPage } from "@/pages/ModulePlaceholderPage";
import { NotFoundPage } from "@/pages/NotFoundPage";
import { TablouDeBordPage } from "@/pages/TablouDeBordPage";
import { WorkspaceCardPage } from "@/pages/WorkspaceCardPage";

import { AdministrationLayout } from "./AdministrationLayout";
import { AuthenticationGate } from "./AuthenticationGate";
import { ApplicationAccessRoute } from "./ApplicationAccessRoute";
import { StaffRoute } from "./StaffRoute";
import { RouteErrorBoundary } from "./RouteErrorBoundary";

const CoursePlannerGeneratorPage = lazy(async () => {
  const module = await import("@/pages/CoursePlannerGeneratorPage");
  return { default: module.CoursePlannerGeneratorPage };
});

const CoursePlannerHistoryPage = lazy(async () => {
  const module = await import("@/pages/CoursePlannerHistoryPage");
  return { default: module.CoursePlannerHistoryPage };
});

const CoursePlannerXmlPage = lazy(async () => {
  const module = await import("@/pages/CoursePlannerXmlPage");
  return { default: module.CoursePlannerXmlPage };
});

const CoursePlannerWordMatcherPage = lazy(async () => {
  const module = await import("@/pages/CoursePlannerWordMatcherPage");
  return { default: module.CoursePlannerWordMatcherPage };
});

const UpdateWordPressPage = lazy(async () => {
  const module = await import("@/pages/UpdateWordPressPage");
  return { default: module.UpdateWordPressPage };
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

function CoursePlannerXmlRoute() {
  return (
    <Suspense
      fallback={
        <ApplicationState
          description="Se încarcă instrumentele pentru formatarea XML."
          loading
          title="Se încarcă XML cursuri"
        />
      }
    >
      <CoursePlannerXmlPage />
    </Suspense>
  );
}

function CoursePlannerWordMatcherRoute() {
  return (
    <Suspense
      fallback={
        <ApplicationState
          description="Se încarcă instrumentele pentru potrivirea cursurilor."
          loading
          title="Se încarcă Word Matcher"
        />
      }
    >
      <CoursePlannerWordMatcherPage />
    </Suspense>
  );
}

function UpdateWordPressRoute() {
  return (
    <Suspense
      fallback={
        <ApplicationState
          description="Se încarcă instrumentele pentru actualizarea WordPress."
          loading
          title="Se încarcă Update WordPress"
        />
      }
    >
      <UpdateWordPressPage />
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
    <Suspense
      fallback={
        <ApplicationState
          description="Se încarcă grupurile și accesul la aplicații."
          loading
          title="Se încarcă grupurile"
        />
      }
    >
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

export const appRoutes = [
  {
    path: "/",
    element: <AuthenticationGate />,
    errorElement: <RouteErrorBoundary />,
    children: [
      {
        index: true,
        element: <Navigate replace to="/tablou-de-bord" />,
      },
      {
        path: "tablou-de-bord",
        element: <TablouDeBordPage />,
        handle: { pageTitle: "Dashboard" },
      },
      {
        element: <ApplicationAccessRoute applicationKey="crm" />,
        children: [
          {
            path: "crm",
            element: (
              <ModulePlaceholderPage
                title="CRM"
                description="Alege un modul CRM din meniul lateral pentru a continua."
              />
            ),
            handle: { pageTitle: "CRM" },
          },
        ],
      },
      {
        element: <ApplicationAccessRoute applicationKey="companii" />,
        children: [
          {
            path: "crm/companii",
            element: <WorkspaceCardPage ariaLabel="Conținut companii" />,
            handle: { pageTitle: "Companii" },
          },
        ],
      },
      {
        element: <ApplicationAccessRoute applicationKey="contacte" />,
        children: [
          {
            path: "crm/contacte",
            element: (
              <ModulePlaceholderPage
                title="Contacte"
                description="Modulul pentru gestionarea contactelor va fi disponibil aici."
              />
            ),
            handle: { pageTitle: "Contacte" },
          },
        ],
      },
      {
        element: <ApplicationAccessRoute applicationKey="oportunitati" />,
        children: [
          {
            path: "crm/oportunitati",
            element: (
              <ModulePlaceholderPage
                title="Oportunități"
                description="Modulul pentru gestionarea oportunităților va fi disponibil aici."
              />
            ),
            handle: { pageTitle: "Oportunități" },
          },
        ],
      },
      {
        element: <ApplicationAccessRoute applicationKey="activitati" />,
        children: [
          {
            path: "crm/activitati",
            element: (
              <ModulePlaceholderPage
                title="Activități"
                description="Modulul pentru gestionarea activităților va fi disponibil aici."
              />
            ),
            handle: { pageTitle: "Activități" },
          },
        ],
      },
      {
        element: <ApplicationAccessRoute applicationKey="instruiri" />,
        children: [
          {
            path: "training/in-pregatire",
            element: (
              <ModulePlaceholderPage
                title="Training"
                description="Modulele pentru Training vor fi definite ulterior."
              />
            ),
            handle: { pageTitle: "Training" },
          },
        ],
      },
      {
        element: <ApplicationAccessRoute applicationKey="certificari" />,
        children: [
          {
            path: "certificari/in-pregatire",
            element: (
              <ModulePlaceholderPage
                title="Certificări"
                description="Modulele pentru Certificări vor fi definite ulterior."
              />
            ),
            handle: { pageTitle: "Certificări" },
          },
        ],
      },
      {
        element: <ApplicationAccessRoute applicationKey="industrial" />,
        children: [
          {
            path: "industrial/in-pregatire",
            element: (
              <ModulePlaceholderPage
                title="Industrial"
                description="Modulele pentru Industrial vor fi definite ulterior."
              />
            ),
            handle: { pageTitle: "Industrial" },
          },
        ],
      },
      {
        element: <ApplicationAccessRoute applicationKey="documente" />,
        children: [
          {
            path: "documente",
            element: <DocumentePage />,
            handle: { pageTitle: "Documente" },
          },
        ],
      },
      {
        element: <ApplicationAccessRoute applicationKey="planificator-cursuri" />,
        children: [
          {
            path: "planificator-cursuri/generator",
            element: <CoursePlannerGeneratorRoute />,
            handle: { pageTitle: "Generare perioade" },
          },
          {
            path: "planificator-cursuri/istoric",
            element: <CoursePlannerHistoryRoute />,
            handle: { pageTitle: "Istoric generări" },
          },
          {
            path: "planificator-cursuri/xml",
            element: <CoursePlannerXmlRoute />,
            handle: { pageTitle: "XML cursuri" },
          },
          {
            path: "planificator-cursuri/word-matcher",
            element: <CoursePlannerWordMatcherRoute />,
            handle: { pageTitle: "Word Matcher" },
          },
          {
            path: "planificator-cursuri/update-wordpress",
            element: <UpdateWordPressRoute />,
            handle: { pageTitle: "Update WordPress" },
          },
        ],
      },
      {
        path: "administrare",
        element: <StaffRoute />,
        children: [
          {
            element: <AdministrationLayout />,
            children: [
              {
                index: true,
                element: <AdministrationRoute />,
                handle: { header: <AdministrationHeader />, pageTitle: "Administrare" },
              },
              {
                path: "sistem/interfata-utilizator",
                element: <AdministrationUserInterfaceRoute />,
                handle: {
                  header: <AdministrationUserInterfaceHeader />,
                  pageTitle: "Interfață utilizator",
                },
              },
              {
                path: "utilizatori",
                element: <UtilizatoriRoute />,
                handle: { header: <UtilizatoriHeader />, pageTitle: "Utilizatori" },
              },
              {
                path: "utilizatori/adaugare",
                element: <UtilizatorFormRoute />,
                handle: { header: <UtilizatorFormHeader />, pageTitle: "Adaugă utilizator" },
              },
              {
                path: "utilizatori/:userId",
                element: <UtilizatorFormRoute />,
                handle: { header: <UtilizatorFormHeader />, pageTitle: "Editează utilizator" },
              },
              {
                path: "grupuri",
                element: <GrupuriAplicatiiRoute />,
                handle: {
                  header: <GrupuriAplicatiiHeader />,
                  pageTitle: "Grupuri și acces aplicații",
                },
              },
              {
                path: "integrari",
                element: <IntegrationsRoute />,
                handle: { header: <IntegrationsHeader />, pageTitle: "Integrări" },
              },
              {
                path: "integrari/zile-libere",
                element: <PublicHolidaysIntegrationRoute />,
                handle: {
                  header: <PublicHolidaysIntegrationHeader />,
                  pageTitle: "Zile libere și sărbători",
                },
              },
            ],
          },
        ],
      },
      {
        path: "*",
        element: <NotFoundPage />,
        handle: { pageTitle: "Pagina nu a fost găsită" },
      },
    ],
  },
];

export const router = createBrowserRouter(appRoutes);
