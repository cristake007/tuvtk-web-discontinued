import { createBrowserRouter, Navigate } from "react-router";

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

import { AdministrationLayout } from "./AdministrationLayout";
import { AuthenticationGate } from "./AuthenticationGate";
import { ApplicationAccessRoute } from "./ApplicationAccessRoute";
import { lazyRoute } from "./lazyRoute";
import { placeholderRoutes } from "./placeholderRoutes";
import { RouteErrorBoundary } from "./RouteErrorBoundary";
import { StaffRoute } from "./StaffRoute";

const CoursePlannerGeneratorPage = lazyRoute(
  () => import("@/pages/CoursePlannerGeneratorPage"),
  "CoursePlannerGeneratorPage",
);
const CoursePlannerHistoryPage = lazyRoute(
  () => import("@/pages/CoursePlannerHistoryPage"),
  "CoursePlannerHistoryPage",
);
const CoursePlannerXmlPage = lazyRoute(
  () => import("@/pages/CoursePlannerXmlPage"),
  "CoursePlannerXmlPage",
);
const CoursePlannerWordMatcherPage = lazyRoute(
  () => import("@/pages/CoursePlannerWordMatcherPage"),
  "CoursePlannerWordMatcherPage",
);
const UpdateWordPressPage = lazyRoute(
  () => import("@/pages/UpdateWordPressPage"),
  "UpdateWordPressPage",
);
const AdministrationPage = lazyRoute(
  () => import("@/pages/AdministrationPage"),
  "AdministrationPage",
);
const AdministrationUserInterfacePage = lazyRoute(
  () => import("@/pages/AdministrationUserInterfacePage"),
  "AdministrationUserInterfacePage",
);
const UtilizatoriPage = lazyRoute(() => import("@/pages/UtilizatoriPage"), "UtilizatoriPage");
const UtilizatorFormPage = lazyRoute(
  () => import("@/pages/UtilizatorFormPage"),
  "UtilizatorFormPage",
);
const GrupuriAplicatiiPage = lazyRoute(
  () => import("@/pages/GrupuriAplicatiiPage"),
  "GrupuriAplicatiiPage",
);
const IntegrationsPage = lazyRoute(() => import("@/pages/IntegrationsPage"), "IntegrationsPage");
const PublicHolidaysIntegrationPage = lazyRoute(
  () => import("@/pages/PublicHolidaysIntegrationPage"),
  "PublicHolidaysIntegrationPage",
);
const CompaniiPage = lazyRoute(() => import("@/pages/CompaniiPage"), "CompaniiPage");
const CompanieDetailPage = lazyRoute(() => import("@/pages/CompaniiPage"), "CompanieDetailPage");
const CompanieFormPage = lazyRoute(() => import("@/pages/CompaniiPage"), "CompanieFormPage");
const ContactePage = lazyRoute(() => import("@/pages/ContactePage"), "ContactePage");
const ContactDetailPage = lazyRoute(() => import("@/pages/ContactePage"), "ContactDetailPage");
const ContactFormPage = lazyRoute(() => import("@/pages/ContactePage"), "ContactFormPage");

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
        handle: { pageTitle: "Tablou de bord" },
      },
      ...placeholderRoutes.map(({ applicationKey, description, pageTitle, path, title }) => ({
        element: <ApplicationAccessRoute applicationKey={applicationKey} />,
        children: [
          {
            path,
            element: <ModulePlaceholderPage description={description} title={title} />,
            handle: { pageTitle },
          },
        ],
      })),
      {
        element: <ApplicationAccessRoute applicationKey="companii" />,
        children: [
          {
            path: "crm/companii",
            element: <CompaniiPage />,
            handle: { pageTitle: "Companii" },
          },
          {
            path: "crm/companii/adaugare",
            element: <CompanieFormPage />,
            handle: { pageTitle: "Adaugă companie" },
          },
          {
            path: "crm/companii/:companyId",
            element: <CompanieDetailPage />,
            handle: { pageTitle: "Detalii companie" },
          },
          {
            path: "crm/companii/:companyId/editare",
            element: <CompanieFormPage />,
            handle: { pageTitle: "Editează companie" },
          },
        ],
      },
      {
        element: <ApplicationAccessRoute applicationKey="contacte" />,
        children: [
          { path: "crm/contacte", element: <ContactePage />, handle: { pageTitle: "Contacte" } },
          {
            path: "crm/contacte/adaugare",
            element: <ContactFormPage />,
            handle: { pageTitle: "Adaugă contact" },
          },
          {
            path: "crm/contacte/:contactId",
            element: <ContactDetailPage />,
            handle: { pageTitle: "Detalii contact" },
          },
          {
            path: "crm/contacte/:contactId/editare",
            element: <ContactFormPage />,
            handle: { pageTitle: "Editează contact" },
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
            element: <CoursePlannerGeneratorPage />,
            handle: { pageTitle: "Generare perioade" },
          },
          {
            path: "planificator-cursuri/istoric",
            element: <CoursePlannerHistoryPage />,
            handle: { pageTitle: "Istoric generări" },
          },
          {
            path: "planificator-cursuri/xml",
            element: <CoursePlannerXmlPage />,
            handle: { pageTitle: "XML cursuri" },
          },
          {
            path: "planificator-cursuri/word-matcher",
            element: <CoursePlannerWordMatcherPage />,
            handle: { pageTitle: "Word Matcher" },
          },
          {
            path: "planificator-cursuri/update-wordpress",
            element: <UpdateWordPressPage />,
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
                element: <AdministrationPage />,
                handle: { header: <AdministrationHeader />, pageTitle: "Administrare" },
              },
              {
                path: "sistem/interfata-utilizator",
                element: <AdministrationUserInterfacePage />,
                handle: {
                  header: <AdministrationUserInterfaceHeader />,
                  pageTitle: "Interfață utilizator",
                },
              },
              {
                path: "utilizatori",
                element: <UtilizatoriPage />,
                handle: { header: <UtilizatoriHeader />, pageTitle: "Utilizatori" },
              },
              {
                path: "utilizatori/adaugare",
                element: <UtilizatorFormPage />,
                handle: { header: <UtilizatorFormHeader />, pageTitle: "Adaugă utilizator" },
              },
              {
                path: "utilizatori/:userId",
                element: <UtilizatorFormPage />,
                handle: { header: <UtilizatorFormHeader />, pageTitle: "Editează utilizator" },
              },
              {
                path: "grupuri",
                element: <GrupuriAplicatiiPage />,
                handle: {
                  header: <GrupuriAplicatiiHeader />,
                  pageTitle: "Grupuri și acces aplicații",
                },
              },
              {
                path: "integrari",
                element: <IntegrationsPage />,
                handle: { header: <IntegrationsHeader />, pageTitle: "Integrări" },
              },
              {
                path: "integrari/zile-libere",
                element: <PublicHolidaysIntegrationPage />,
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
