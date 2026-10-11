import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { discoverySearchSchema } from "../src/validations/discovery.ts";

describe("Discovery Search Validation Schema", () => {
  it("validates valid search request with query and location", () => {
    const result = discoverySearchSchema.safeParse({
      query: "AI meetups",
      location: "Bengaluru",
      date: "October 2026",
      limit: 10,
    });
    assert.equal(result.success, true);
    if (result.success) {
      assert.equal(result.data.query, "AI meetups");
      assert.equal(result.data.location, "Bengaluru");
      assert.equal(result.data.date, "October 2026");
      assert.equal(result.data.limit, 10);
    }
  });

  it("maps 'city' to 'location' if location is not provided", () => {
    const result = discoverySearchSchema.safeParse({
      query: "Hackathons",
      city: "Mumbai",
    });
    assert.equal(result.success, true);
    if (result.success) {
      assert.equal(result.data.location, "Mumbai");
    }
  });

  it("fails if all search parameters (query, location, category) are missing", () => {
    const result = discoverySearchSchema.safeParse({});
    assert.equal(result.success, false);
  });

  it("clamps and defaults limit properly", () => {
    const result = discoverySearchSchema.safeParse({
      query: "Tech",
      limit: "5",
    });
    assert.equal(result.success, true);
    if (result.success) {
      assert.equal(result.data.limit, 5);
    }
  });

  it("rejects limits exceeding maximum limit of 20", () => {
    const result = discoverySearchSchema.safeParse({
      query: "Tech",
      limit: 50,
    });
    assert.equal(result.success, false);
  });

  it("rejects queries exceeding length bounds", () => {
    const result = discoverySearchSchema.safeParse({
      query: "a".repeat(150),
    });
    assert.equal(result.success, false);
  });
});
