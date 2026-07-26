import assert from "node:assert/strict";
import { describe, it } from "vitest";

import type { NavigationItem } from "../../features/core/types.js";

import {
  buildNavigationTree,
  findCurrentNavigationItem,
  isNavigationPathActive,
} from "./navigation-model.js";

const items: NavigationItem[] = [
  {
    key: "administration",
    label: "Administrare",
    path: "/administrare",
    icon: "settings",
    position: 30,
    parent_key: null,
    application_key: "core",
    is_separator: false,
  },
  {
    key: "companies",
    label: "Companies",
    path: "/companies",
    icon: "building-2",
    position: 20,
    parent_key: null,
    application_key: "companies",
    is_separator: false,
  },
  {
    key: "dashboard",
    label: "Dashboard",
    path: "/",
    icon: "layout-dashboard",
    position: 10,
    parent_key: null,
    application_key: "core",
    is_separator: false,
  },
  {
    key: "company-detail",
    label: "Company detail",
    path: "/companies/detail",
    icon: "file-text",
    position: 10,
    parent_key: "companies",
    application_key: "companies",
    is_separator: false,
  },
];

describe("isNavigationPathActive", () => {
  it("matches exact and nested paths without matching unrelated prefixes", () => {
    assert.equal(isNavigationPathActive("/companies", "/companies"), true);
    assert.equal(isNavigationPathActive("/companies/42", "/companies"), true);
    assert.equal(isNavigationPathActive("/company", "/companies"), false);
    assert.equal(isNavigationPathActive("/administrare", "/"), false);
  });
});

describe("buildNavigationTree", () => {
  it("sorts root items and nests children", () => {
    const tree = buildNavigationTree(items);

    assert.deepEqual(
      tree.map((item) => item.key),
      ["dashboard", "companies", "administration"],
    );
    assert.deepEqual(
      tree[1]?.children.map((item) => item.key),
      ["company-detail"],
    );
  });
});

describe("findCurrentNavigationItem", () => {
  it("returns the most specific matching navigation item", () => {
    assert.equal(
      findCurrentNavigationItem(items, "/companies/detail/42")?.key,
      "company-detail",
    );
  });
});
