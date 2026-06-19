import assert from "node:assert/strict";
import test from "node:test";

import { isAdminTokenValid } from "@/lib/auth";

test("isAdminTokenValid validates matching token only", () => {
  process.env.CENTERIT_ADMIN_TOKEN = "super-secret-token";

  assert.equal(isAdminTokenValid("super-secret-token"), true);
  assert.equal(isAdminTokenValid("wrong-token"), false);
  assert.equal(isAdminTokenValid(undefined), false);
});
