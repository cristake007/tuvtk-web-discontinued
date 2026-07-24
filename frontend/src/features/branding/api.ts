import { apiRequest, ensureCsrfCookie } from "@/api/http";
import type { ShellConfiguration } from "@/features/core/types";

export async function uploadCompanyLogo(logo: File): Promise<ShellConfiguration> {
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
