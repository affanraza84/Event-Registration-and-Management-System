import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { buildDiscoveryQuery } from "../src/utils/discoveryQuery.ts";

describe("Discovery Examples and Pre-Built Query Mappings", () => {
  const exampleSearches = [
    {
      query: "AI meetups",
      location: "Ranchi",
      category: "AI",
      expected: "upcoming AI meetups in Ranchi",
    },
    {
      query: "Hackathons",
      location: "India",
      category: "Hackathons",
      expected: "upcoming Hackathons in India",
    },
    {
      query: "Web development conferences",
      location: "Bengaluru",
      category: "Web Development",
      expected: "upcoming Web development conferences in Bengaluru",
    },
    {
      query: "Student technology events",
      location: "Jharkhand",
      category: "Student Events",
      expected: "upcoming Student technology events in Jharkhand",
    },
  ];

  for (const item of exampleSearches) {
    it(`generates natural query for '${item.query}' in '${item.location}'`, () => {
      const built = buildDiscoveryQuery({
        query: item.query,
        location: item.location,
        category: item.category,
      });
      assert.equal(built, item.expected);
    });
  }
});
