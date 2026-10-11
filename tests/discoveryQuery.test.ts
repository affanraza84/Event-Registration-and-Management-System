import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { buildDiscoveryQuery } from "../src/utils/discoveryQuery.ts";

describe("Discovery Query Builder", () => {
  it("constructs useful query with query, location, and date", () => {
    const query = buildDiscoveryQuery({
      query: "AI meetups and hackathons",
      location: "Ranchi",
      date: "October 2026",
    });
    assert.equal(
      query,
      "upcoming AI meetups and hackathons in Ranchi October 2026"
    );
  });

  it("constructs useful query with category and location", () => {
    const query = buildDiscoveryQuery({
      category: "AI",
      location: "Ranchi",
      date: "October 2026",
    });
    assert.equal(
      query,
      "upcoming AI meetups and hackathons in Ranchi October 2026"
    );
  });

  it("does not duplicate 'upcoming' if user query already starts with upcoming", () => {
    const query = buildDiscoveryQuery({
      query: "upcoming Web3 conferences",
      location: "Bengaluru",
    });
    assert.equal(query, "upcoming Web3 conferences in Bengaluru");
  });

  it("does not duplicate 'in <location>' if query already includes the location", () => {
    const query = buildDiscoveryQuery({
      query: "Hackathons in Bengaluru",
      location: "Bengaluru",
    });
    assert.equal(query, "upcoming Hackathons in Bengaluru");
  });

  it("sanitizes control characters and dangerous punctuation", () => {
    const query = buildDiscoveryQuery({
      query: 'AI <script>alert("hack")</script> meetups',
      location: "Delhi\u0000",
    });
    assert.ok(!query.includes("<script>"));
    assert.ok(!query.includes('"'));
    assert.ok(!query.includes("\u0000"));
    assert.ok(query.includes("upcoming"));
    assert.ok(query.includes("Delhi"));
  });

  it("provides fallback subject when all inputs are empty", () => {
    const query = buildDiscoveryQuery({});
    assert.equal(query, "upcoming tech meetups and hackathons");
  });
});
