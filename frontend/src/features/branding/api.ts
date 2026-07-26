import { apiRequest } from "@/api/http";
import type { NavigationItem, ShellConfiguration } from "@/features/core/types";

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

export function updateUserInterfaceSettings(
  settings: Partial<Pick<ShellConfiguration, "site_name" | "culoare_primara" | "culoare_accent" | "culoare_fundal">>,
): Promise<ShellConfiguration> {
  return apiRequest<ShellConfiguration>(userInterfacePath, {
    method: "PATCH",
    body: JSON.stringify(settings),
  });
}

export function fetchUserInterfaceNavigation(): Promise<NavigationItem[]> {
  return apiRequest<NavigationItem[]>(`${userInterfacePath}/navigation`, { cache: "no-store" });
}

export function updateUserInterfaceNavigation(
  chei: string[],
): Promise<NavigationItem[]> {
  return apiRequest<NavigationItem[]>(`${userInterfacePath}/navigation`, {
    method: "PUT",
    body: JSON.stringify({ chei }),
  });
}

export function createUserInterfaceSeparator(): Promise<NavigationItem> {
  return apiRequest<NavigationItem>(`${userInterfacePath}/navigation`, { method: "POST" });
}

export function removeUserInterfaceSeparator(key: string): Promise<void> {
  return apiRequest<void>(`${userInterfacePath}/navigation/separators/${key}`, {
    method: "DELETE",
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
