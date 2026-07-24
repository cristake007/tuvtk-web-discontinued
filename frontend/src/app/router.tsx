import { lazy, Suspense } from "react";
import { createBrowserRouter } from "react-router-dom";

import { ApplicationState } from "@/components/ApplicationState";
import { AuthenticationGate } from "../features/auth/AuthenticationGate";
import { ModulePlaceholderPage } from "../pages/ModulePlaceholderPage";

const DashboardPage = lazy(async () => {
  const module = await import("../pages/DashboardPage");
  return { default: module.DashboardPage };
});

function DashboardRoute() {
  return (
    <Suspense
      fallback={
        <ApplicationState
          description="Loading the current workspace overview."
          loading
          title="Loading dashboard"
        />
      }
    >
      <DashboardPage />
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
        element: <DashboardRoute />,
      },
      {
        path: "companies",
        element: (
          <ModulePlaceholderPage
            title="Companies"
            description="The company directory and live registry filters will be implemented here."
          />
        ),
      },
      {
        path: "documents",
        element: (
          <ModulePlaceholderPage
            title="Documents"
            description="The visual document editor will be implemented as a dedicated React module here."
          />
        ),
      },
      {
        path: "settings",
        element: (
          <ModulePlaceholderPage
            title="Settings"
            description="Application configuration and database-backed navigation will be managed here."
          />
        ),
      },
      {
        path: "*",
        element: (
          <ModulePlaceholderPage
            title="Page not found"
            description="The requested frontend route does not exist."
          />
        ),
      },
    ],
  },
]);
