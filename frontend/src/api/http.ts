export type ApiErrorFields = Record<string, unknown>;

export type ApiErrorPayload = {
  code: string;
  detail: string;
  fields: ApiErrorFields;
};

export type ApiAuthorizationFailureDetail = ApiErrorPayload & {
  status: number;
};

export const apiAuthorizationFailureEvent = "tuvtk:api-authorization-failure";

export class ApiError extends Error {
  readonly code: string;
  readonly fields: ApiErrorFields;
  readonly status: number;

  constructor(payload: ApiErrorPayload, status: number) {
    super(payload.detail);
    this.name = "ApiError";
    this.code = payload.code;
    this.fields = payload.fields;
    this.status = status;
  }
}

type ApiRequestOptions = RequestInit & {
  authorizationHandling?: "global" | "ignore";
};

const unsafeMethods = new Set(["POST", "PUT", "PATCH", "DELETE"]);
let csrfCookieRequest: Promise<void> | null = null;

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

function normalizeErrorPayload(body: unknown, status: number): ApiErrorPayload {
  if (body && typeof body === "object") {
    const candidate = body as Partial<ApiErrorPayload>;
    return {
      code:
        typeof candidate.code === "string"
          ? candidate.code
          : status === 401
            ? "authentication_required"
            : status === 403
              ? "permission_denied"
              : "api_error",
      detail:
        typeof candidate.detail === "string"
          ? candidate.detail
          : `API request failed: ${status}`,
      fields:
        candidate.fields && typeof candidate.fields === "object"
          ? candidate.fields
          : {},
    };
  }

  return {
    code: status === 401 ? "authentication_required" : "api_error",
    detail: typeof body === "string" && body ? body : `API request failed: ${status}`,
    fields: {},
  };
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
    throw new ApiError(
      {
        code: "invalid_json",
        detail: "The server returned invalid JSON.",
        fields: {},
      },
      response.status,
    );
  }
}

async function fetchCsrfCookie(): Promise<void> {
  if (readCookie("csrftoken")) {
    return;
  }

  if (!csrfCookieRequest) {
    csrfCookieRequest = fetch("/api/v1/auth/csrf", {
      cache: "no-store",
      credentials: "same-origin",
      headers: { Accept: "application/json" },
    })
      .then(async (response) => {
        if (!response.ok) {
          const body = await readResponseBody(response);
          throw new ApiError(normalizeErrorPayload(body, response.status), response.status);
        }
        if (!readCookie("csrftoken")) {
          throw new ApiError(
            {
              code: "csrf_missing",
              detail: "Security token is missing.",
              fields: {},
            },
            403,
          );
        }
      })
      .finally(() => {
        csrfCookieRequest = null;
      });
  }

  await csrfCookieRequest;
}

async function buildRequestHeaders(
  options: ApiRequestOptions,
): Promise<{
  headers: Headers;
  requestOptions: RequestInit;
  authorizationHandling: "global" | "ignore";
}> {
  const { authorizationHandling = "global", ...requestOptions } = options;
  const headers = new Headers(requestOptions.headers);
  headers.set("Accept", "application/json");

  const bodyIsFormData =
    typeof FormData !== "undefined" && requestOptions.body instanceof FormData;
  if (requestOptions.body && !bodyIsFormData && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const method = (requestOptions.method ?? "GET").toUpperCase();
  if (unsafeMethods.has(method)) {
    await fetchCsrfCookie();
    const token = readCookie("csrftoken");
    if (!token) {
      throw new ApiError(
        {
          code: "csrf_missing",
          detail: "Security token is missing.",
          fields: {},
        },
        403,
      );
    }
    headers.set("X-CSRFToken", token);
  }

  return { headers, requestOptions, authorizationHandling };
}

function notifyAuthorizationFailure(
  status: number,
  authorizationHandling: "global" | "ignore",
  payload: ApiErrorPayload,
): void {
  if (
    authorizationHandling === "global" &&
    (status === 401 || status === 403)
  ) {
    window.dispatchEvent(
      new CustomEvent<ApiAuthorizationFailureDetail>(apiAuthorizationFailureEvent, {
        detail: { ...payload, status },
      }),
    );
  }
}

export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const { headers, requestOptions, authorizationHandling } =
    await buildRequestHeaders(options);
  const response = await fetch(path, {
    ...requestOptions,
    credentials: "same-origin",
    headers,
  });

  const body = await readResponseBody(response);

  if (!response.ok) {
    const payload = normalizeErrorPayload(body, response.status);
    notifyAuthorizationFailure(response.status, authorizationHandling, payload);
    throw new ApiError(payload, response.status);
  }

  return body as T;
}

export async function apiDownload(
  path: string,
  options: ApiRequestOptions = {},
): Promise<Blob> {
  const { headers, requestOptions, authorizationHandling } =
    await buildRequestHeaders(options);

  // DRF performs renderer negotiation before the view returns FileResponse.
  // A wildcard allows the endpoint to return its real file MIME while JSON
  // error responses remain readable by the client.
  headers.set("Accept", "*/*");

  const response = await fetch(path, {
    ...requestOptions,
    credentials: "same-origin",
    headers,
  });

  if (!response.ok) {
    const body = await readResponseBody(response);
    const payload = normalizeErrorPayload(body, response.status);
    notifyAuthorizationFailure(response.status, authorizationHandling, payload);
    throw new ApiError(payload, response.status);
  }

  return response.blob();
}
