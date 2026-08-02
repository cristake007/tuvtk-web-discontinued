import { describe, expect, it } from "vitest";

import { abbreviatedMonthNames, monthNames } from "./constants";

describe("abbreviatedMonthNames", () => {
  it("derivă abrevierile din lista canonică a lunilor", () => {
    expect(abbreviatedMonthNames).toEqual(monthNames.map((monthName) => monthName.slice(0, 3)));
    expect(abbreviatedMonthNames).toEqual([
      "Ian",
      "Feb",
      "Mar",
      "Apr",
      "Mai",
      "Iun",
      "Iul",
      "Aug",
      "Sep",
      "Oct",
      "Noi",
      "Dec",
    ]);
  });
});
