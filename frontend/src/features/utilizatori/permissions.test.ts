import { describe, expect, it } from "vitest";

import { canEditUtilizator } from "./permissions";
import type { Utilizator } from "./types";

const user = { is_staff: false } as Utilizator;

describe("canEditUtilizator", () => {
  it("permite unui administrator să editeze un cont standard", () => {
    expect(canEditUtilizator(user, false)).toBe(true);
  });

  it("blochează conturile staff pentru administratorii care nu sunt superutilizatori", () => {
    expect(canEditUtilizator({ ...user, is_staff: true }, false)).toBe(false);
  });

  it("permite superutilizatorilor să editeze conturile staff", () => {
    expect(canEditUtilizator({ ...user, is_staff: true }, true)).toBe(true);
  });
});
