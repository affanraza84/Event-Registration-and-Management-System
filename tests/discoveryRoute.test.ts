import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import { GET, POST } from "../src/app/api/discover/route.ts";

describe("/api/discover Route Handler", () => {
  it("rejects GET request when no query, location, or category is provided", async () => {
    const req = new NextRequest("http://localhost:3000/api/discover");
    const response = await GET(req);
    assert.equal(response.status, 400);

    const json = await response.json();
    assert.ok(json.error);
    assert.ok(json.error.includes("Invalid search parameters"));
  });

  it("rejects POST request with malformed JSON body", async () => {
    const req = new NextRequest("http://localhost:3000/api/discover", {
      method: "POST",
      body: "not-json{",
      headers: { "Content-Type": "application/json" },
    });
    const response = await POST(req);
    assert.equal(response.status, 400);

    const json = await response.json();
    assert.ok(json.error.includes("Malformed request"));
  });

  it("returns 503 Service Unavailable when SERPAPI_API_KEY is missing or unconfigured", async () => {
    // Ensure SERPAPI_API_KEY is unset for this test
    const previousKey = process.env.SERPAPI_API_KEY;
    delete process.env.SERPAPI_API_KEY;

    try {
      const req = new NextRequest(
        "http://localhost:3000/api/discover?query=AI+meetups&location=Ranchi"
      );
      const response = await GET(req);
      assert.equal(response.status, 503);

      const json = await response.json();
      assert.ok(json.error.includes("Live event discovery service is not currently configured"));
      // Assert that API key is NEVER leaked in the response
      assert.equal(json.apiKey, undefined);
    } finally {
      if (previousKey) {
        process.env.SERPAPI_API_KEY = previousKey;
      }
    }
  });

  it("handles valid POST payload validation before contacting SerpApi", async () => {
    const previousKey = process.env.SERPAPI_API_KEY;
    delete process.env.SERPAPI_API_KEY;

    try {
      const req = new NextRequest("http://localhost:3000/api/discover", {
        method: "POST",
        body: JSON.stringify({
          query: "Web3 Hackathon",
          city: "Bengaluru",
          date: "October 2026",
          limit: 5,
        }),
        headers: { "Content-Type": "application/json" },
      });
      const response = await POST(req);
      assert.equal(response.status, 503); // Passed validation, reached missing key guard safely
    } finally {
      if (previousKey) {
        process.env.SERPAPI_API_KEY = previousKey;
      }
    }
  });
});
