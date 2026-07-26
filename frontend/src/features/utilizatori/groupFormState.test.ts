import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { updateGroupName, type GroupFormValues } from "./groupFormState.js";

describe("editorul grupului", () => {
  it("păstrează numele când este introdus și editat caracter cu caracter", () => {
    let values: GroupFormValues = { name: "", application_ids: [], user_ids: [] };

    assert.doesNotThrow(() => {
      for (const character of "Operatori") {
        values = updateGroupName(values, `${values.name}${character}`);
      }
    });
    assert.equal(values.name, "Operatori");

    values = updateGroupName(values, "Operatori Planificator");
    assert.equal(values.name, "Operatori Planificator");
  });
});
