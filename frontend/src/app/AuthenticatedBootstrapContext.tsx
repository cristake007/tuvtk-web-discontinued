import { createContext, useContext } from "react";

import type { CoreBootstrap } from "@/features/core/types";

const AuthenticatedBootstrapContext = createContext<CoreBootstrap | null>(null);

export const AuthenticatedBootstrapProvider = AuthenticatedBootstrapContext.Provider;

export function useAuthenticatedBootstrap(): CoreBootstrap {
  const bootstrap = useContext(AuthenticatedBootstrapContext);

  if (!bootstrap) {
    throw new Error("Bootstrapul autentificat este disponibil numai în spatele AuthenticationGate.");
  }

  return bootstrap;
}
