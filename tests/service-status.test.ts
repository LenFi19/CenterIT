import assert from "node:assert/strict";
import test from "node:test";

import { checkServiceStatus, parseServiceIds } from "@/lib/service-status";

test("parseServiceIds parses and sanitizes positive integer ids", () => {
  assert.deepEqual(parseServiceIds("1,2,2,0,-1,x,3"), [1, 2, 3]);
  assert.equal(parseServiceIds(null), null);
  assert.equal(parseServiceIds("foo,bar"), null);
});

test("checkServiceStatus returns online when HEAD is successful", async () => {
  const originalFetch = global.fetch;
  const successfulFetch: typeof fetch = async () => new Response(null, { status: 200 });
  global.fetch = successfulFetch;
  const result = await checkServiceStatus("https://example.com");
  assert.equal(result, "online");
  global.fetch = originalFetch;
});

test("checkServiceStatus returns unknown when both requests fail", async () => {
  const originalFetch = global.fetch;
  const failingFetch: typeof fetch = async () => {
    throw new Error("network error");
  };
  global.fetch = failingFetch;

  const result = await checkServiceStatus("https://example.com");
  assert.equal(result, "unknown");
  global.fetch = originalFetch;
});
