import { apiRequest, ensureCsrfCookie } from "./http";
import type {
  CoreBootstrap,
  HealthResponse,
  ShellConfiguration,
} from "./types";

export const coreBootstrapQueryKey = ["core-bootstrap"] as const;

export function fetchCoreBootstrap(): Promise<CoreBootstrap> {
  return apiRequest<CoreBootstrap>("/api/v1/core/bootstrap", {
    cache: "no-store",
  });
}

export async function uploadCompanyLogo(
  logo: File,
): Promise<ShellConfiguration> {
  await ensureCsrfCookie();

  const formData = new FormData();
  formData.append("logo", logo);

  return apiRequest<ShellConfiguration>("/api/v1/core/settings/company-logo", {
    method: "POST",
    body: formData,
    includeCsrf: true,
  });
}

export async function removeCompanyLogo(): Promise<void> {
  await ensureCsrfCookie();

  return apiRequest<void>("/api/v1/core/settings/company-logo", {
    method: "DELETE",
    includeCsrf: true,
  });
}

export function fetchHealth(): Promise<HealthResponse> {
  return apiRequest<HealthResponse>("/api/v1/health");
}
