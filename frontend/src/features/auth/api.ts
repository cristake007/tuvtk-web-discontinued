import { apiRequest, ensureCsrfCookie } from "@/api/http";

import type { AuthenticationSession, LoginCredentials } from "./types";

export function fetchAuthenticationSession(): Promise<AuthenticationSession> {
  return apiRequest<AuthenticationSession>("/api/v1/auth/session", {
    cache: "no-store",
  });
}

export async function login(
  credentials: LoginCredentials,
): Promise<AuthenticationSession> {
  await ensureCsrfCookie();

  return apiRequest<AuthenticationSession>("/api/v1/auth/login", {
    method: "POST",
    body: JSON.stringify(credentials),
    includeCsrf: true,
  });
}

export async function logout(): Promise<void> {
  await ensureCsrfCookie();

  await apiRequest<void>("/api/v1/auth/logout", {
    method: "POST",
    includeCsrf: true,
  });
}
