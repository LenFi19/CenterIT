import assert from "node:assert/strict";
import test from "node:test";

import { validateServicePayload } from "@/lib/service-payload";

test("validateServicePayload accepts a valid payload", () => {
  const result = validateServicePayload({
    name: "Service A",
    url: "https://example.com",
    description: "Beschreibung",
    icon: "🔗",
    category: "Medien",
    favorite: true,
    adminOnly: false,
    order: 2,
  });

  assert.equal(result.success, true);
  if (result.success) {
    assert.equal(result.data.name, "Service A");
    assert.equal(result.data.categoryName, "Medien");
    assert.equal(result.data.order, 2);
  }
});

test("validateServicePayload rejects invalid fields", () => {
  const result = validateServicePayload({
    name: "",
    url: "ftp://example.com",
    favorite: "yes",
  });

  assert.equal(result.success, false);
  if (!result.success) {
    assert.equal(result.details?.name, "Name ist erforderlich.");
    assert.equal(result.details?.url, "URL muss mit http:// oder https:// beginnen.");
    assert.equal(result.details?.favorite, "favorite muss true oder false sein.");
  }
});
