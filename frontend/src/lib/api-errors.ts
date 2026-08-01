import { ApiError } from "@/api/http";

export function formatApiError(error: unknown, fallback: string): string {
  if (error instanceof ApiError || error instanceof Error) {
    return error.message;
  }
  return fallback;
}

export function getApiFieldError(error: unknown, field: string): string | null {
  if (!(error instanceof ApiError)) {
    return null;
  }

  const value = error.fields[field];
  if (typeof value === "string") {
    return value;
  }
  if (Array.isArray(value)) {
    const firstMessage = value.find((item) => typeof item === "string");
    return typeof firstMessage === "string" ? firstMessage : null;
  }
  return null;
}
