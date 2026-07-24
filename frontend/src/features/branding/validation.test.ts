import { describe, expect, it } from "vitest";

import {
  MAX_COMPANY_LOGO_BYTES,
  validateCompanyLogo,
} from "./validation";

describe("validateCompanyLogo", () => {
  it("accepts SVG files by MIME type or extension", () => {
    expect(
      validateCompanyLogo({ name: "logo", size: 100, type: "image/svg+xml" }),
    ).toBeNull();
    expect(
      validateCompanyLogo({ name: "logo.SVG", size: 100, type: "" }),
    ).toBeNull();
  });

  it("rejects non-SVG files", () => {
    expect(
      validateCompanyLogo({ name: "logo.png", size: 100, type: "image/png" }),
    ).toBe("Select an SVG file.");
  });

  it("rejects SVG files larger than the configured limit", () => {
    expect(
      validateCompanyLogo({
        name: "logo.svg",
        size: MAX_COMPANY_LOGO_BYTES + 1,
        type: "image/svg+xml",
      }),
    ).toBe("The SVG file must be 256 KB or smaller.");
  });
});
