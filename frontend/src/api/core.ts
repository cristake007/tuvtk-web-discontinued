import type { CoreBootstrap, HealthResponse } from "@/features/core/types";

import { apiRequest } from "./http";

export const coreBootstrapQueryKey = ["core-bootstrap"] as const;

export function fetchCoreBootstrap(): Promise<CoreBootstrap> {
  return apiRequest<CoreBootstrap>("/api/v1/core/bootstrap", {
    authorizationHandling: "ignore",
    cache: "no-store",
  });
}

export function fetchHealth(): Promise<HealthResponse> {
  return apiRequest<HealthResponse>("/api/v1/health");
}
