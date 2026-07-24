import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  MAX_COMPANY_LOGO_BYTES,
  validateCompanyLogo,
} from "./validation.ts";

describe("validateCompanyLogo", () => {
  it("accepts SVG files by MIME type or extension", () => {
    assert.equal(
      validateCompanyLogo({ name: "logo", size: 100, type: "image/svg+xml" }),
      null,
    );
    assert.equal(
      validateCompanyLogo({ name: "logo.SVG", size: 100, type: "" }),
      null,
    );
  });

  it("rejects non-SVG files", () => {
    assert.equal(
      validateCompanyLogo({ name: "logo.png", size: 100, type: "image/png" }),
      "Select an SVG file.",
    );
  });

  it("rejects SVG files larger than the configured limit", () => {
    assert.equal(
      validateCompanyLogo({
        name: "logo.svg",
        size: MAX_COMPANY_LOGO_BYTES + 1,
        type: "image/svg+xml",
      }),
      "The SVG file must be 256 KB or smaller.",
    );
  });
});
