import { describe, expect, it } from "vitest";

import type { NavigationItem } from "@/features/core/types";

import {
  buildNavigationTree,
  findCurrentNavigationItem,
  isNavigationPathActive,
} from "./navigation";

const items: NavigationItem[] = [
  {
    key: "settings",
    label: "Settings",
    path: "/settings",
    icon: "settings",
    position: 30,
    parent_key: null,
    application_key: "core",
  },
  {
    key: "companies",
    label: "Companies",
    path: "/companies",
    icon: "building-2",
    position: 20,
    parent_key: null,
    application_key: "companies",
  },
  {
    key: "dashboard",
    label: "Dashboard",
    path: "/",
    icon: "layout-dashboard",
    position: 10,
    parent_key: null,
    application_key: "core",
  },
  {
    key: "company-detail",
    label: "Company detail",
    path: "/companies/detail",
    icon: "file-text",
    position: 10,
    parent_key: "companies",
    application_key: "companies",
  },
];

describe("isNavigationPathActive", () => {
  it("matches exact and nested paths without matching unrelated prefixes", () => {
    expect(isNavigationPathActive("/companies", "/companies")).toBe(true);
    expect(isNavigationPathActive("/companies/42", "/companies")).toBe(true);
    expect(isNavigationPathActive("/company", "/companies")).toBe(false);
    expect(isNavigationPathActive("/settings", "/")).toBe(false);
  });
});

describe("buildNavigationTree", () => {
  it("sorts root items and nests children", () => {
    const tree = buildNavigationTree(items);

    expect(tree.map((item) => item.key)).toEqual([
      "dashboard",
      "companies",
      "settings",
    ]);
    expect(tree[1]?.children.map((item) => item.key)).toEqual(["company-detail"]);
  });
});

describe("findCurrentNavigationItem", () => {
  it("returns the most specific matching navigation item", () => {
    expect(findCurrentNavigationItem(items, "/companies/detail/42")?.key).toBe(
      "company-detail",
    );
  });
});
