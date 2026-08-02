import { describe, expect, it } from "vitest";

import { parseCompanyRouteId } from "./routeId";

describe("identificatorul companiei din rută", () => {
  it.each(["foo", "0", "-2", "1.5", ""])("respinge valoarea %s", (value) => {
    expect(parseCompanyRouteId(value)).toBeNull();
  });

  it("acceptă un identificator întreg pozitiv", () => {
    expect(parseCompanyRouteId("42")).toBe(42);
  });
});
