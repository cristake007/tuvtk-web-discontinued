import assert from "node:assert/strict";
import { describe, it } from "vitest";

import { validateLoginCredentials } from "./loginValidation.js";

describe("validateLoginCredentials", () => {
  it("accepts non-empty credentials", () => {
    assert.deepEqual(
      validateLoginCredentials({ username: "admin", password: "secret" }),
      {},
    );
  });

  it("rejects an empty or whitespace-only username", () => {
    assert.equal(
      validateLoginCredentials({ username: "   ", password: "secret" }).username,
      "Introdu numele de utilizator.",
    );
  });

  it("rejects an empty password", () => {
    assert.equal(
      validateLoginCredentials({ username: "admin", password: "" }).password,
      "Introdu parola.",
    );
  });
});
