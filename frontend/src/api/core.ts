import { apiRequest } from "./http";
import type { CoreBootstrap, HealthResponse } from "./types";

export function fetchCoreBootstrap(): Promise<CoreBootstrap> {
  return apiRequest<CoreBootstrap>("/api/v1/core/bootstrap", {
    cache: "no-store",
  });
}

export function fetchHealth(): Promise<HealthResponse> {
  return apiRequest<HealthResponse>("/api/v1/health");
}
