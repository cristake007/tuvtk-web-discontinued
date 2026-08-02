import { ApiError } from "@/api/http";

const apiErrorMessages: Record<string, string> = {
  authentication_required: "Autentificarea este necesară pentru această acțiune.",
  conflict: "Datele au fost modificate între timp. Reîncarcă pagina și încearcă din nou.",
  csrf_failed: "Sesiunea de securitate a expirat. Reîncarcă pagina și încearcă din nou.",
  csrf_missing: "Sesiunea de securitate lipsește. Reîncarcă pagina și încearcă din nou.",
  invalid_json: "Serverul a returnat un răspuns nevalid.",
  method_not_allowed: "Această acțiune nu este permisă.",
  not_found: "Resursa solicitată nu a fost găsită.",
  permission_denied: "Nu ai permisiunea necesară pentru această acțiune.",
  throttled: "Au fost trimise prea multe cereri. Încearcă din nou mai târziu.",
  unsupported_media_type: "Formatul datelor trimise nu este acceptat.",
};

export function formatApiError(error: unknown, fallback: string): string {
  if (error instanceof ApiError) {
    if (error.code === "validation_error") {
      return error.message;
    }
    return apiErrorMessages[error.code] ?? fallback;
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
