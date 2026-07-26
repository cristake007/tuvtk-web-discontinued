import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { canAccessApplicationRoute, canAccessStaffRoute } from "./routeAccess.js";

const normalUser = { is_staff: false, is_superuser: false };
const staffUser = { is_staff: true, is_superuser: false };
const superuser = { is_staff: true, is_superuser: true };

describe("guardurile de rută", () => {
  it("nu permite montarea administrării pentru un utilizator normal", () => {
    assert.equal(canAccessStaffRoute(normalUser), false);
    assert.equal(canAccessStaffRoute(null), false);
  });

  it("permite administrarea pentru administrator și superutilizator", () => {
    assert.equal(canAccessStaffRoute(staffUser), true);
    assert.equal(canAccessStaffRoute(superuser), true);
  });

  it("nu permite montarea unei aplicații fără cheia ACL", () => {
    assert.equal(canAccessApplicationRoute(["documents"], "course-planner"), false);
  });

  it("permite montarea aplicației numai pentru bootstrapul curent", () => {
    assert.equal(canAccessApplicationRoute(["course-planner"], "course-planner"), true);
    assert.equal(canAccessApplicationRoute([], "course-planner"), false);
  });
});
