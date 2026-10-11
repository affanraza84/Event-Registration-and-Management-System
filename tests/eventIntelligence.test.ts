import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  normalizeUrl,
  classifyEvent,
  calculateRelevance,
} from "../src/utils/eventIntelligence.ts";
import { normalizeSerpApiResponse } from "../src/lib/serpapi.ts";

describe("Event Intelligence & Search Relevance Unit Tests", () => {
  describe("normalizeUrl - Safe URL Normalization & Tracking Stripping", () => {
    it("strips common marketing tracking tags and query artifacts", () => {
      const dirtyUrl =
        "https://www.devfolio.co/hackathons/ranchi-hacks?utm_source=twitter&utm_medium=social&utm_campaign=launch#registration";
      const cleanUrl = normalizeUrl(dirtyUrl);

      assert.equal(cleanUrl, "https://devfolio.co/hackathons/ranchi-hacks");
    });

    it("strips trailing slash on paths while preserving root slash", () => {
      const withTrailingSlash = "https://unstop.com/competitions/code-arena/";
      assert.equal(
        normalizeUrl(withTrailingSlash),
        "https://unstop.com/competitions/code-arena"
      );

      const rootUrl = "https://unstop.com/";
      assert.equal(normalizeUrl(rootUrl), "https://unstop.com/");
    });

    it("normalizes www prefix and lowercases protocol and hostname", () => {
      const mixedCaseUrl = "HTTPS://WWW.Meetup.Com/events/987654";
      assert.equal(
        normalizeUrl(mixedCaseUrl),
        "https://meetup.com/events/987654"
      );
    });

    it("preserves non-tracking query parameters intact", () => {
      const functionalUrl =
        "https://eventbrite.com/e/ai-summit-tickets-12345?id=12345&tab=details&utm_source=newsletter";
      const normalized = normalizeUrl(functionalUrl);

      assert.ok(normalized.includes("id=12345"));
      assert.ok(normalized.includes("tab=details"));
      assert.ok(!normalized.includes("utm_source"));
    });

    it("returns empty string or trimmed string for invalid URLs safely", () => {
      assert.equal(normalizeUrl(""), "");
      assert.equal(normalizeUrl("   "), "");
      assert.equal(normalizeUrl("javascript:void(0)"), "javascript:void(0)");
    });
  });

  describe("classifyEvent - Evidence-Based Categorization", () => {
    it("classifies 'Hackathons and competitions' when explicit evidence exists", () => {
      assert.equal(
        classifyEvent(
          "Ranchi AI Ideathon 2026",
          "A 36-hour codefest and hackathon for aspiring builders."
        ),
        "Hackathons and competitions"
      );

      assert.equal(
        classifyEvent(
          "National Coding Competition & CTF",
          "Compete in algorithm design and cyber challenges."
        ),
        "Hackathons and competitions"
      );
    });

    it("classifies 'Meetups and networking' when explicit evidence exists", () => {
      assert.equal(
        classifyEvent(
          "Bengaluru React Developers Meetup",
          "Join community members for an informal mixer and networking session."
        ),
        "Meetups and networking"
      );
    });

    it("classifies 'Conferences and workshops' when explicit evidence exists", () => {
      assert.equal(
        classifyEvent(
          "India Cloud Computing Summit 2026",
          "Two full days of keynotes, workshops, and hands-on labs with industry leaders."
        ),
        "Conferences and workshops"
      );
    });

    it("classifies 'Student and campus events' when explicit evidence exists", () => {
      assert.equal(
        classifyEvent(
          "Inter-College Tech Fest 2026",
          "Exclusive event for college and university students across Jharkhand."
        ),
        "Student and campus events"
      );
    });

    it("returns 'Unclassified' when no explicit keyword evidence exists (never guesses)", () => {
      assert.equal(
        classifyEvent(
          "Latest Breakthroughs in Generative AI",
          "An article discussing recent trends in large language models."
        ),
        "Unclassified"
      );

      assert.equal(
        classifyEvent("Public Discussion", "General remarks about software."),
        "Unclassified"
      );
    });
  });

  describe("calculateRelevance - Transparent Deterministic Scoring", () => {
    it("boosts score and adds signals for keyword match in title and description", () => {
      const item = {
        title: "Upcoming AI Hackathon in Ranchi",
        snippet: "Join developers in Ranchi for an intense 48-hour build.",
        originalUrl: "https://example.com/event",
        category: "Hackathons and competitions" as const,
      };

      const result = calculateRelevance(item, {
        query: "AI Hackathon",
      });

      assert.ok(result.score > 50);
      assert.ok(
        result.signals.includes("Keyword match in title") ||
          result.signals.includes("Keyword match in description")
      );
    });

    it("boosts score when location matches input criteria", () => {
      const item = {
        title: "Tech Mixer",
        snippet: "Developer gathering in Ranchi, Jharkhand",
        locationInfo: "Ranchi, Jharkhand",
        originalUrl: "https://example.com/event",
        category: "Meetups and networking" as const,
      };

      const result = calculateRelevance(item, {
        location: "Ranchi",
      });

      assert.ok(result.score > 50);
      assert.ok(result.signals.some((s) => s.includes("Location matched: Ranchi")));
    });

    it("rewards confirmed event dates and recognized event domains", () => {
      const item = {
        title: "Devfolio Hackathon 2026",
        snippet: "Annual student hackathon.",
        dateInfo: "Nov 10, 2026",
        locationInfo: "Bengaluru",
        originalUrl: "https://devfolio.co/hackathons/demo",
        category: "Hackathons and competitions" as const,
      };

      const result = calculateRelevance(item, { query: "hackathon" });

      assert.ok(result.signals.includes("Confirmed event date present"));
      assert.ok(result.signals.some((s) => s.includes("Event platform (devfolio.co)")));
    });
  });

  describe("normalizeSerpApiResponse - Deduplication, Missing Fields & Ranking", () => {
    it("removes duplicate search results across carousel and organic results using normalized URL", () => {
      const mockRawData = {
        events_results: [
          {
            title: "Ranchi Tech Carnival 2026",
            link: "https://devfolio.co/carnival?utm_source=google_events",
            description: "Annual carnival for developers in Ranchi.",
            date: { when: "Nov 5, 2026" },
          },
        ],
        organic_results: [
          {
            title: "Ranchi Tech Carnival 2026 - Official Registration",
            link: "https://devfolio.co/carnival/?utm_source=organic_search#tickets",
            snippet: "Register for Ranchi Tech Carnival on Devfolio.",
          },
          {
            title: "Unique Second Event",
            link: "https://unstop.com/hackathons/unique-event",
            snippet: "Hackathon competition in India.",
          },
        ],
      };

      const normalized = normalizeSerpApiResponse(
        mockRawData,
        "Ranchi Tech Carnival",
        10
      );

      // Devfolio carnival link was normalized to "https://devfolio.co/carnival" and deduplicated!
      assert.equal(normalized.totalResults, 2);
      assert.equal(normalized.events.length, 2);
      assert.equal(normalized.events[0].normalizedUrl, "https://devfolio.co/carnival");
      assert.equal(
        normalized.events[1].normalizedUrl,
        "https://unstop.com/hackathons/unique-event"
      );
    });

    it("labels unverified dates as 'Date not confirmed' and never fabricates dates", () => {
      const mockRawData = {
        organic_results: [
          {
            title: "Unscheduled Developer Forum",
            link: "https://example.com/unscheduled-forum",
            snippet: "A community discussion about open source tools.",
          },
        ],
      };

      const normalized = normalizeSerpApiResponse(mockRawData, "forum", 10);
      assert.equal(normalized.events.length, 1);

      const event = normalized.events[0];
      assert.equal(event.hasConfirmedDate, false);
      assert.equal(event.dateDisplay, "Date not confirmed");
      assert.equal(event.dateInfo, undefined);
      assert.equal(event.hasConfirmedLocation, false);
      assert.equal(event.locationDisplay, "Location unverified");
      assert.equal(event.category, "Unclassified");
    });

    it("ranks items deterministically based on relevance signals", () => {
      const mockRawData = {
        organic_results: [
          {
            position: 1,
            title: "General Blog About Tech",
            link: "https://blog.example.com/general-tech",
            snippet: "Random article mentioning nothing specific.",
          },
          {
            position: 2,
            title: "Ranchi AI Hackathon 2026 Official",
            link: "https://devfolio.co/hackathons/ranchi-ai",
            snippet: "The premier AI hackathon in Ranchi for 2026 developers.",
            date: "Oct 25, 2026",
          },
        ],
      };

      const normalized = normalizeSerpApiResponse(
        mockRawData,
        "AI Hackathon Ranchi",
        10,
        {
          query: "AI Hackathon",
          location: "Ranchi",
        }
      );

      // Despite being position 2 in raw results, the relevant hackathon with confirmed date and location should rank first
      assert.equal(normalized.events[0].title, "Ranchi AI Hackathon 2026 Official");
      assert.ok(
        normalized.events[0].relevanceScore > normalized.events[1].relevanceScore
      );
      assert.ok(normalized.events[0].relevanceSignals.length > 1);
    });
  });
});
