import { apiRequest } from "@/api/http";
import type { ShellConfiguration } from "@/features/core/types";

import type { PublicBranding } from "./types";

export const publicBrandingQueryKey = ["public-branding"] as const;

const userInterfacePath = "/api/v1/core/administration/user-interface";
const userInterfaceCompanyLogoPath = `${userInterfacePath}/company-logo`;

export function fetchPublicBranding(): Promise<PublicBranding> {
  return apiRequest<PublicBranding>("/api/v1/core/branding", {
    cache: "no-store",
  });
}

export function fetchUserInterfaceSettings(): Promise<ShellConfiguration> {
  return apiRequest<ShellConfiguration>(userInterfacePath, {
    cache: "no-store",
  });
}

export function uploadCompanyLogo(logo: File): Promise<ShellConfiguration> {
  const formData = new FormData();
  formData.append("logo", logo);

  return apiRequest<ShellConfiguration>(userInterfaceCompanyLogoPath, {
    method: "POST",
    body: formData,
  });
}

export function removeCompanyLogo(): Promise<void> {
  return apiRequest<void>(userInterfaceCompanyLogoPath, {
    method: "DELETE",
  });
}
