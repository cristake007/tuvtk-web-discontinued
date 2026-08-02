import { apiRequest } from "@/api/http";

import type { AuthenticationSession, LoginCredentials } from "./types";

export function login(credentials: LoginCredentials): Promise<AuthenticationSession> {
  return apiRequest<AuthenticationSession>("/api/v1/auth/login", {
    authorizationHandling: "ignore",
    method: "POST",
    body: JSON.stringify(credentials),
  });
}

export async function logout(): Promise<void> {
  await apiRequest<void>("/api/v1/auth/logout", {
    method: "POST",
  });
}
