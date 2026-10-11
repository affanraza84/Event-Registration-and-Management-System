import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  isValidHttpUrl,
  normalizeSerpApiResponse,
  SerpApiError,
} from "../src/lib/serpapi.ts";

describe("SerpApi URL Validator & Result Normalizer", () => {
  describe("isValidHttpUrl", () => {
    it("accepts valid HTTPS URLs", () => {
      assert.equal(isValidHttpUrl("https://meetup.com/events/123"), true);
      assert.equal(isValidHttpUrl("https://unstop.com/hackathons/ai-summit"), true);
    });

    it("accepts valid HTTP URLs", () => {
      assert.equal(isValidHttpUrl("http://example.com/event"), true);
    });

    it("rejects dangerous or non-web schemes", () => {
      assert.equal(isValidHttpUrl("javascript:alert('xss')"), false);
      assert.equal(isValidHttpUrl("data:text/html;base64,PHNjcmlwdD4="), false);
      assert.equal(isValidHttpUrl("file:///etc/passwd"), false);
      assert.equal(isValidHttpUrl("ftp://files.example.com"), false);
      assert.equal(isValidHttpUrl("vbscript:msgbox(1)"), false);
    });

    it("rejects malformed or empty inputs", () => {
      assert.equal(isValidHttpUrl(""), false);
      assert.equal(isValidHttpUrl("not-a-url"), false);
      assert.equal(isValidHttpUrl(null), false);
      assert.equal(isValidHttpUrl(undefined), false);
    });
  });

  describe("normalizeSerpApiResponse", () => {
    it("normalizes organic results into standard IDiscoveredEvent format", () => {
      const mockRawData = {
        organic_results: [
          {
            position: 1,
            title: "Ranchi AI & Web3 Hackathon 2026",
            link: "https://devfolio.co/hackathons/ranchi-ai-2026",
            snippet: "Join top developers in Ranchi for 48 hours of AI coding and mentorship.",
            displayed_link: "https://devfolio.co › hackathons",
            date: "Oct 15, 2026",
          },
          {
            position: 2,
            title: "Unverified Link With Dangerous Scheme",
            link: "javascript:evil()",
            snippet: "This should be discarded by the URL validator.",
          },
          {
            position: 3,
            title: "Tech Meetup Without Explicit Date",
            link: "https://meetup.com/ranchi-devs",
            snippet: "Monthly gathering of software engineers in Ranchi.",
            displayed_link: "https://meetup.com",
          },
        ],
      };

      const result = normalizeSerpApiResponse(
        mockRawData,
        "upcoming AI meetups and hackathons in Ranchi October 2026",
        10
      );

      assert.equal(result.success, true);
      assert.equal(result.totalResults, 2); // Unsafe link was excluded!
      assert.equal(result.events.length, 2);

      // First event has explicit date
      assert.equal(result.events[0].title, "Ranchi AI & Web3 Hackathon 2026");
      assert.equal(result.events[0].originalUrl, "https://devfolio.co/hackathons/ranchi-ai-2026");
      assert.equal(result.events[0].dateInfo, "Oct 15, 2026");
      assert.equal(result.events[0].isExternal, true);

      // Second event has NO date info -> MUST NOT BE INVENTED
      assert.equal(result.events[1].title, "Tech Meetup Without Explicit Date");
      assert.equal(result.events[1].dateInfo, undefined);
      assert.equal(result.events[1].locationInfo, undefined);

      // Verify disclaimer exists
      assert.ok(result.disclaimer.includes("Google Search results are web discovery results"));
    });

    it("normalizes Google Events carousel results when present", () => {
      const mockRawData = {
        events_results: [
          {
            title: "India AI Summit 2026",
            link: "https://ai-summit.in/2026",
            description: "Premier artificial intelligence conference in India.",
            date: {
              start_date: "Oct 24",
              when: "Sat, Oct 24, 9 AM – 5 PM",
            },
            address: ["Bengaluru", "Karnataka, India"],
            venue: {
              name: "Nimhans Convention Centre",
            },
          },
        ],
      };

      const result = normalizeSerpApiResponse(mockRawData, "India AI Summit 2026", 10);
      assert.equal(result.totalResults, 1);
      assert.equal(result.events[0].title, "India AI Summit 2026");
      assert.equal(result.events[0].dateInfo, "Sat, Oct 24, 9 AM – 5 PM");
      assert.equal(result.events[0].locationInfo, "Bengaluru, Karnataka, India");
      assert.equal(result.events[0].displayedSource, "ai-summit.in");
    });

    it("throws SerpApiError when response contains an error message", () => {
      const mockErrorData = {
        error: "Invalid API key or account quota exceeded.",
      };

      assert.throws(
        () => normalizeSerpApiResponse(mockErrorData, "test query", 10),
        SerpApiError
      );
    });

    it("handles empty or malformed data gracefully", () => {
      const result = normalizeSerpApiResponse(null, "empty query", 10);
      assert.equal(result.totalResults, 0);
      assert.equal(result.events.length, 0);
    });
  });
});
