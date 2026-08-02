import { describe, expect, it } from "vitest";

import { ApiError } from "@/api/http";

import { formatApiError } from "./api-errors";

describe("formatApiError", () => {
  it("păstrează mesajele API destinate utilizatorului", () => {
    const error = new ApiError(
      { code: "validation_error", detail: "Datele introduse nu sunt valide.", fields: {} },
      400,
    );

    expect(formatApiError(error, "Operațiunea a eșuat.")).toBe(
      "Datele introduse nu sunt valide.",
    );
  });

  it("nu afișează mesajele tehnice ale erorilor neașteptate", () => {
    expect(formatApiError(new Error("Failed to fetch"), "Conexiunea a eșuat.")).toBe(
      "Conexiunea a eșuat.",
    );
  });

  it("localizează codurile API cunoscute fără a afișa detaliul brut", () => {
    const error = new ApiError(
      { code: "permission_denied", detail: "Permission denied", fields: {} },
      403,
    );

    expect(formatApiError(error, "Operațiunea a eșuat.")).toBe(
      "Nu ai permisiunea necesară pentru această acțiune.",
    );
  });
});
