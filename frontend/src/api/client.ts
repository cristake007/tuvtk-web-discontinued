import type { CoreBootstrap, HealthResponse } from "./types";

export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function apiRequest<T>(path: string): Promise<T> {
  const response = await fetch(path, {
    credentials: "same-origin",
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new ApiError(`API request failed: ${response.status}`, response.status);
  }

  return (await response.json()) as T;
}

export function fetchCoreBootstrap(): Promise<CoreBootstrap> {
  return apiRequest<CoreBootstrap>("/api/v1/core/bootstrap");
}

export function fetchHealth(): Promise<HealthResponse> {
  return apiRequest<HealthResponse>("/api/v1/health");
}
