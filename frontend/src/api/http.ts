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

function readErrorDetail(body: unknown): string | undefined {
  if (!body || typeof body !== "object" || !("detail" in body)) {
    return undefined;
  }

  const detail = (body as { detail?: unknown }).detail;
  return typeof detail === "string" ? detail : undefined;
}

async function readResponseBody(response: Response): Promise<unknown> {
  if (response.status === 204 || response.status === 205) {
    return null;
  }

  const contentLength = response.headers.get("content-length");
  if (contentLength === "0") {
    return null;
  }

  const responseText = await response.text();
  if (!responseText) {
    return null;
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    return responseText;
  }

  try {
    return JSON.parse(responseText) as unknown;
  } catch {
    throw new ApiError("The server returned invalid JSON.", response.status);
  }
}

function buildRequestHeaders(
  options: ApiRequestOptions,
): { headers: Headers; requestOptions: RequestInit } {
  const { includeCsrf = false, ...requestOptions } = options;
  const headers = new Headers(requestOptions.headers);
  headers.set("Accept", "application/json");

  const bodyIsFormData =
    typeof FormData !== "undefined" && requestOptions.body instanceof FormData;
  if (requestOptions.body && !bodyIsFormData && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (includeCsrf) {
    const token = readCookie("csrftoken");
    if (!token) {
      throw new ApiError("Security token is missing.", 403);
    }
    headers.set("X-CSRFToken", token);
  }

  return { headers, requestOptions };
}

export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const { headers, requestOptions } = buildRequestHeaders(options);
  const response = await fetch(path, {
    ...requestOptions,
    credentials: "same-origin",
    headers,
  });

  const body = await readResponseBody(response);

  if (!response.ok) {
    throw new ApiError(
      readErrorDetail(body) ?? `API request failed: ${response.status}`,
      response.status,
    );
  }

  return body as T;
}

export async function apiDownload(
  path: string,
  options: ApiRequestOptions = {},
): Promise<Blob> {
  const { headers, requestOptions } = buildRequestHeaders(options);

  // DRF performs renderer negotiation before the view returns FileResponse.
  // A wildcard allows the authenticated endpoint to return its real file MIME
  // while JSON error responses remain readable by the client.
  headers.set("Accept", "*/*");

  const response = await fetch(path, {
    ...requestOptions,
    credentials: "same-origin",
    headers,
  });

  if (!response.ok) {
    const body = await readResponseBody(response);
    throw new ApiError(
      readErrorDetail(body) ?? `API request failed: ${response.status}`,
      response.status,
    );
  }

  return response.blob();
}

export async function ensureCsrfCookie(): Promise<void> {
  await apiRequest<void>("/api/v1/auth/csrf", {
    cache: "no-store",
  });
}
