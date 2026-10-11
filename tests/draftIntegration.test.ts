import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  evaluateDraftEligibility,
  extractSafeDraftDate,
  buildDraftUrlParams,
} from "../src/utils/draftHelper.ts";
import { eventCreationSchema } from "../src/validations/event.ts";
import { IDiscoveredEvent } from "../src/types/discovery.ts";

describe("Phase 5: Event Discovery to Host Draft & Registration Integration", () => {
  describe("evaluateDraftEligibility", () => {
    it("approves complete search result with valid source URL, title, and snippet", () => {
      const validEvent: IDiscoveredEvent = {
        id: "ev-1",
        title: "Ranchi AI Hackathon 2026",
        snippet: "A 48-hour builder hackathon for AI and machine learning developers in Ranchi.",
        originalUrl: "https://devfolio.co/hackathons/ranchi-ai",
        normalizedUrl: "https://devfolio.co/hackathons/ranchi-ai",
        category: "Hackathons and competitions",
        hasConfirmedDate: true,
        dateDisplay: "Nov 15, 2026",
        dateInfo: "Nov 15, 2026",
        hasConfirmedLocation: true,
        locationDisplay: "Ranchi, Jharkhand",
        locationInfo: "Ranchi, Jharkhand",
        relevanceScore: 90,
        relevanceSignals: ["Keyword match in title"],
        isExternal: true,
      };

      const eligibility = evaluateDraftEligibility(validEvent);
      assert.equal(eligibility.isEligible, true);
      assert.equal(eligibility.missingFields.length, 0);
    });

    it("identifies missing date and location as requiring manual host entry but allows draft", () => {
      const partialEvent: IDiscoveredEvent = {
        id: "ev-2",
        title: "Developer Community Meetup",
        snippet: "Open meetup for software engineers discussing web development.",
        originalUrl: "https://meetup.com/events/123",
        normalizedUrl: "https://meetup.com/events/123",
        category: "Meetups and networking",
        hasConfirmedDate: false,
        dateDisplay: "Date not confirmed",
        hasConfirmedLocation: false,
        locationDisplay: "Location unverified",
        relevanceScore: 70,
        relevanceSignals: [],
        isExternal: true,
      };

      const eligibility = evaluateDraftEligibility(partialEvent);
      assert.equal(eligibility.isEligible, true);
      assert.ok(
        eligibility.missingFields.some((f) => f.includes("Event Date"))
      );
      assert.ok(
        eligibility.missingFields.some((f) => f.includes("Event Venue"))
      );
    });

    it("rejects search results with missing or sparse title", () => {
      const sparseEvent: IDiscoveredEvent = {
        id: "ev-3",
        title: "Dev", // < 5 characters
        snippet: "This is a full description of the event but the title is too short.",
        originalUrl: "https://example.com/event",
        normalizedUrl: "https://example.com/event",
        category: "Unclassified",
        hasConfirmedDate: false,
        dateDisplay: "Date not confirmed",
        hasConfirmedLocation: false,
        locationDisplay: "Location unverified",
        relevanceScore: 50,
        relevanceSignals: [],
        isExternal: true,
      };

      const eligibility = evaluateDraftEligibility(sparseEvent);
      assert.equal(eligibility.isEligible, false);
      assert.ok(eligibility.reason?.includes("too sparse or incomplete"));
      assert.ok(eligibility.missingFields.includes("Descriptive Title"));
    });

    it("rejects search results with invalid or unsafe source URL", () => {
      const unsafeEvent: IDiscoveredEvent = {
        id: "ev-4",
        title: "Dangerous Scheme Event",
        snippet: "A full description of an event with a dangerous link.",
        originalUrl: "javascript:alert(1)",
        normalizedUrl: "javascript:alert(1)",
        category: "Unclassified",
        hasConfirmedDate: false,
        dateDisplay: "Date not confirmed",
        hasConfirmedLocation: false,
        locationDisplay: "Location unverified",
        relevanceScore: 50,
        relevanceSignals: [],
        isExternal: true,
      };

      const eligibility = evaluateDraftEligibility(unsafeEvent);
      assert.equal(eligibility.isEligible, false);
      assert.ok(eligibility.missingFields.includes("Valid Source URL"));
    });

    it("rejects search results with snippet too short (< 15 chars)", () => {
      const shortSnippetEvent: IDiscoveredEvent = {
        id: "ev-5",
        title: "Valid Title For Hackathon",
        snippet: "Tiny snippet",
        originalUrl: "https://example.com/event",
        normalizedUrl: "https://example.com/event",
        category: "Unclassified",
        hasConfirmedDate: false,
        dateDisplay: "Date not confirmed",
        hasConfirmedLocation: false,
        locationDisplay: "Location unverified",
        relevanceScore: 50,
        relevanceSignals: [],
        isExternal: true,
      };

      const eligibility = evaluateDraftEligibility(shortSnippetEvent);
      assert.equal(eligibility.isEligible, false);
      assert.ok(
        eligibility.missingFields.includes("Event Description / Snippet")
      );
    });
  });

  describe("extractSafeDraftDate", () => {
    it("parses valid future date strings into YYYY-MM-DD", () => {
      // Create date 30 days in the future
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);
      const dateString = futureDate.toDateString();

      const parsed = extractSafeDraftDate(dateString);
      assert.match(parsed, /^\d{4}-\d{2}-\d{2}$/);
    });

    it("returns empty string for past dates (never pre-fills past dates)", () => {
      assert.equal(extractSafeDraftDate("Jan 1, 2020"), "");
      assert.equal(extractSafeDraftDate("2019-12-31"), "");
    });

    it("returns empty string for unconfirmed or unparseable dates (never invents dates)", () => {
      assert.equal(extractSafeDraftDate("Date not confirmed"), "");
      assert.equal(extractSafeDraftDate(""), "");
      assert.equal(extractSafeDraftDate(undefined), "");
      assert.equal(extractSafeDraftDate("Some time next winter"), "");
    });
  });

  describe("buildDraftUrlParams", () => {
    it("constructs proper URL query string with source attribution", () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 45);

      const event: IDiscoveredEvent = {
        id: "ev-10",
        title: "India AI Summit 2026",
        snippet: "Premier AI conference in Bengaluru.",
        originalUrl: "https://ai-summit.in/2026",
        normalizedUrl: "https://ai-summit.in/2026",
        category: "Conferences and workshops",
        hasConfirmedDate: true,
        dateDisplay: futureDate.toDateString(),
        dateInfo: futureDate.toDateString(),
        hasConfirmedLocation: true,
        locationDisplay: "Bengaluru, India",
        locationInfo: "Bengaluru, India",
        relevanceScore: 85,
        relevanceSignals: [],
        isExternal: true,
      };

      const queryParams = buildDraftUrlParams(event);
      const search = new URLSearchParams(queryParams);

      assert.equal(search.get("importSource"), "discovery");
      assert.equal(search.get("title"), "India AI Summit 2026");
      assert.ok(search.get("description")?.includes("Source: https://ai-summit.in/2026"));
      assert.equal(search.get("location"), "Bengaluru, India");
      assert.equal(search.get("sourceUrl"), "https://ai-summit.in/2026");
      assert.equal(search.get("category"), "Conferences and workshops");
      assert.ok(search.get("date")?.match(/^\d{4}-\d{2}-\d{2}$/));
    });

    it("leaves date and location empty in query string when unconfirmed in search", () => {
      const unconfirmedEvent: IDiscoveredEvent = {
        id: "ev-11",
        title: "Open Source Gathering",
        snippet: "An informal discussion on open source software development.",
        originalUrl: "https://example.com/gather",
        normalizedUrl: "https://example.com/gather",
        category: "Meetups and networking",
        hasConfirmedDate: false,
        dateDisplay: "Date not confirmed",
        hasConfirmedLocation: false,
        locationDisplay: "Location unverified",
        relevanceScore: 60,
        relevanceSignals: [],
        isExternal: true,
      };

      const search = new URLSearchParams(buildDraftUrlParams(unconfirmedEvent));
      assert.equal(search.get("date"), null);
      assert.equal(search.get("location"), null);
      assert.equal(search.get("title"), "Open Source Gathering");
      assert.equal(search.get("sourceUrl"), "https://example.com/gather");
    });
  });

  describe("eventCreationSchema with sourceUrl attribution", () => {
    it("validates event creation payload containing valid sourceUrl", () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 20);
      const futureDateStr = futureDate.toISOString().split("T")[0];

      const deadline = new Date();
      deadline.setDate(deadline.getDate() + 10);
      const deadlineStr = deadline.toISOString().split("T")[0];

      const validPayload = {
        title: "Ranchi Cloud Workshop 2026",
        description: "Hands-on cloud architecture workshop for backend engineers.",
        date: futureDateStr,
        time: "10:00",
        location: "Ranchi, Jharkhand",
        capacity: 75,
        registrationDeadline: deadlineStr,
        sourceUrl: "https://devfolio.co/workshops/cloud-2026",
      };

      const result = eventCreationSchema.safeParse(validPayload);
      assert.equal(result.success, true);
      if (result.success) {
        assert.equal(result.data.sourceUrl, "https://devfolio.co/workshops/cloud-2026");
      }
    });

    it("allows sourceUrl to be omitted or empty string for regular events", () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 20);
      const futureDateStr = futureDate.toISOString().split("T")[0];

      const deadline = new Date();
      deadline.setDate(deadline.getDate() + 10);
      const deadlineStr = deadline.toISOString().split("T")[0];

      const payloadWithoutSource = {
        title: "Standard Host Event",
        description: "Event created without importing from web discovery.",
        date: futureDateStr,
        time: "14:00",
        location: "Bengaluru, Karnataka",
        capacity: 50,
        registrationDeadline: deadlineStr,
      };

      const result = eventCreationSchema.safeParse(payloadWithoutSource);
      assert.equal(result.success, true);
    });

    it("rejects invalid sourceUrl (must be a valid URL)", () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 20);
      const futureDateStr = futureDate.toISOString().split("T")[0];

      const deadline = new Date();
      deadline.setDate(deadline.getDate() + 10);
      const deadlineStr = deadline.toISOString().split("T")[0];

      const invalidPayload = {
        title: "Event With Invalid Source",
        description: "Testing invalid source URL validation.",
        date: futureDateStr,
        time: "10:00",
        location: "Online",
        capacity: 100,
        registrationDeadline: deadlineStr,
        sourceUrl: "not-a-valid-url",
      };

      const result = eventCreationSchema.safeParse(invalidPayload);
      assert.equal(result.success, false);
      if (!result.success) {
        assert.ok(
          result.error.issues.some((i) => i.path.includes("sourceUrl"))
        );
      }
    });

    it("rejects missing required fields (never allows incomplete events to be published)", () => {
      const incompletePayload = {
        title: "Incomplete Event",
        description: "Missing date and time",
        location: "Mumbai",
        capacity: 50,
      };

      const result = eventCreationSchema.safeParse(incompletePayload);
      assert.equal(result.success, false);
    });
  });
});
