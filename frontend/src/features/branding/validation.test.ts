import assert from "node:assert/strict";
import { describe, it } from "vitest";

import { MAX_COMPANY_LOGO_BYTES, validateCompanyLogo } from "./validation.js";

describe("validateCompanyLogo", () => {
  it("accepts SVG files by MIME type or extension", () => {
    assert.equal(validateCompanyLogo({ name: "logo", size: 100, type: "image/svg+xml" }), null);
    assert.equal(validateCompanyLogo({ name: "logo.SVG", size: 100, type: "" }), null);
  });

  it("rejects non-SVG files", () => {
    assert.equal(
      validateCompanyLogo({ name: "logo.png", size: 100, type: "image/png" }),
      "Selectează un fișier SVG.",
    );
  });

  it("rejects SVG files larger than the configured limit", () => {
    assert.equal(
      validateCompanyLogo({
        name: "logo.svg",
        size: MAX_COMPANY_LOGO_BYTES + 1,
        type: "image/svg+xml",
      }),
      "Fișierul SVG trebuie să aibă cel mult 256 KB.",
    );
  });
});
