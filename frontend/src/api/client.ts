import type {
  CoreBootstrap,
  HealthResponse,
  LoginCredentials,
  ShellUser,
} from "./types";

export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

type ApiRequestOptions = RequestInit & {
  includeCsrf?: boolean;
};

function readCookie(name: string): string | null {
  const prefix = `${name}=`;

  for (const cookie of document.cookie.split(";")) {
    const value = cookie.trim();
    if (value.startsWith(prefix)) {
      return decodeURIComponent(value.slice(prefix.length));
    }
  }

  return null;
}

async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const { includeCsrf = false, ...requestOptions } = options;
  const headers = new Headers(requestOptions.headers);

  headers.set("Accept", "application/json");

  if (requestOptions.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (includeCsrf) {
    const token = readCookie("csrftoken");
    if (!token) {
      throw new ApiError("Security token is missing.", 403);
    }
    headers.set("X-CSRFToken", token);
  }

  const response = await fetch(path, {
    ...requestOptions,
    credentials: "same-origin",
    headers,
  });

  const contentType = response.headers.get("content-type") ?? "";
  const body = contentType.includes("application/json")
    ? ((await response.json()) as { detail?: string } | T)
    : null;

  if (!response.ok) {
    const detail =
      body && typeof body === "object" && "detail" in body
        ? body.detail
        : undefined;
    throw new ApiError(detail ?? `API request failed: ${response.status}`, response.status);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return body as T;
}

export function fetchCoreBootstrap(): Promise<CoreBootstrap> {
  return apiRequest<CoreBootstrap>("/api/v1/core/bootstrap");
}

export function fetchCurrentUser(): Promise<ShellUser> {
  return apiRequest<ShellUser>("/api/v1/auth/me");
}

export async function login(credentials: LoginCredentials): Promise<ShellUser> {
  await apiRequest<void>("/api/v1/auth/csrf");

  return apiRequest<ShellUser>("/api/v1/auth/login", {
    method: "POST",
    body: JSON.stringify(credentials),
    includeCsrf: true,
  });
}

export async function logout(): Promise<void> {
  if (!readCookie("csrftoken")) {
    await apiRequest<void>("/api/v1/auth/csrf");
  }

  return apiRequest<void>("/api/v1/auth/logout", {
    method: "POST",
    includeCsrf: true,
  });
}

export function fetchHealth(): Promise<HealthResponse> {
  return apiRequest<HealthResponse>("/api/v1/health");
}
