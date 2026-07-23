import { createBrowserRouter } from "react-router-dom";

import { AuthenticationGate } from "../auth/AuthenticationGate";
import { DashboardPage } from "../pages/DashboardPage";
import { ModulePlaceholderPage } from "../pages/ModulePlaceholderPage";


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
