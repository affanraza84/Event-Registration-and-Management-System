import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { eventCreationSchema } from "../src/validations/event.ts";
import { generateBaseSlug } from "../src/utils/slug.ts";
import { sanitizeText } from "../src/lib/serpapi.ts";

describe("Phase 6: Security, Regression & Production Readiness", () => {
  describe("Security: Safe URL & External Scheme Sanitization", () => {
    it("strictly rejects javascript: and data: pseudo-protocols in event sourceUrl", () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 15);
      const futureStr = futureDate.toISOString().split("T")[0];

      const deadline = new Date();
      deadline.setDate(deadline.getDate() + 5);
      const deadlineStr = deadline.toISOString().split("T")[0];

      const xssPayload = {
        title: "XSS Attempt Event",
        description: "Attempting to embed dangerous pseudo-protocol link.",
        date: futureStr,
        time: "10:00",
        location: "Virtual",
        capacity: 100,
        registrationDeadline: deadlineStr,
        sourceUrl: "javascript:alert(document.cookie)",
      };

      const result = eventCreationSchema.safeParse(xssPayload);
      assert.equal(result.success, false);
      if (!result.success) {
        assert.ok(
          result.error.issues.some((i) => i.path.includes("sourceUrl"))
        );
      }
    });

    it("strictly rejects data: URLs in event sourceUrl", () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 15);
      const futureStr = futureDate.toISOString().split("T")[0];

      const deadline = new Date();
      deadline.setDate(deadline.getDate() + 5);
      const deadlineStr = deadline.toISOString().split("T")[0];

      const dataUrlPayload = {
        title: "Data Scheme Attempt",
        description: "Attempting data URL injection.",
        date: futureStr,
        time: "10:00",
        location: "Virtual",
        capacity: 100,
        registrationDeadline: deadlineStr,
        sourceUrl: "data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==",
      };

      const result = eventCreationSchema.safeParse(dataUrlPayload);
      assert.equal(result.success, false);
    });

    it("accepts valid https URLs for sourceUrl", () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 15);
      const futureStr = futureDate.toISOString().split("T")[0];

      const deadline = new Date();
      deadline.setDate(deadline.getDate() + 5);
      const deadlineStr = deadline.toISOString().split("T")[0];

      const validPayload = {
        title: "Legitimate Platform Event",
        description: "Verified external discovery link.",
        date: futureStr,
        time: "10:00",
        location: "Virtual",
        capacity: 100,
        registrationDeadline: deadlineStr,
        sourceUrl: "https://devfolio.co/hackathons/ranchi-dev",
      };

      const result = eventCreationSchema.safeParse(validPayload);
      assert.equal(result.success, true);
    });
  });

  describe("Security: Untrusted Search Snippet Sanitization", () => {
    it("strips HTML tags and script injections from untrusted search snippets", () => {
      const dirtyHtml = '<script>alert("hack")</script><b>Great Tech Summit</b>';
      const clean = sanitizeText(dirtyHtml);
      assert.equal(clean.includes("<script>"), false);
      assert.equal(clean.includes("<b>"), false);
      assert.equal(clean, 'alert("hack")Great Tech Summit');
    });

    it("strips ASCII control characters and terminal escapes", () => {
      const controlChars = "Malicious\u0000Text\u0007With\u001BEscapes";
      const clean = sanitizeText(controlChars);
      assert.equal(clean, "MaliciousTextWithEscapes");
    });
  });

  describe("Regression: Slug Generation & URL Friendliness", () => {
    it("generates clean URL-friendly slugs without special characters", () => {
      const slug = generateBaseSlug("Ranchi AI & Web3 Summit: 2026 Edition!");
      assert.equal(slug, "ranchi-ai-web3-summit-2026-edition");
    });

    it("handles multiple consecutive spaces and dashes cleanly", () => {
      const slug = generateBaseSlug("Event    ---   With    Spaces");
      assert.equal(slug, "event-with-spaces");
    });
  });

  describe("Regression: Event Creation Validation Boundaries", () => {
    it("enforces registration deadline to be on or before the event date", () => {
      const eventDate = new Date();
      eventDate.setDate(eventDate.getDate() + 10);
      const eventDateStr = eventDate.toISOString().split("T")[0];

      // Deadline AFTER the event date -> MUST FAIL
      const invalidDeadline = new Date();
      invalidDeadline.setDate(invalidDeadline.getDate() + 12);
      const invalidDeadlineStr = invalidDeadline.toISOString().split("T")[0];

      const payload = {
        title: "Invalid Timing Event",
        description: "Registration deadline is set after the event has already started.",
        date: eventDateStr,
        time: "10:00",
        location: "Online",
        capacity: 50,
        registrationDeadline: invalidDeadlineStr,
      };

      const result = eventCreationSchema.safeParse(payload);
      assert.equal(result.success, false);
      if (!result.success) {
        assert.ok(
          result.error.issues.some((i) =>
            i.message.includes("Registration deadline must be on or before the event date")
          )
        );
      }
    });

    it("enforces positive non-zero integer for capacity", () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 10);
      const futureStr = futureDate.toISOString().split("T")[0];

      const zeroCapacityPayload = {
        title: "Zero Capacity Event",
        description: "Event with capacity of zero is invalid.",
        date: futureStr,
        time: "10:00",
        location: "Online",
        capacity: 0,
        registrationDeadline: futureStr,
      };

      const result = eventCreationSchema.safeParse(zeroCapacityPayload);
      assert.equal(result.success, false);
    });

    it("accepts future date with human-readable 12-hour time formats like '10:00 AM - 4:00 PM'", () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);
      const futureStr = futureDate.toISOString().split("T")[0];

      const payload = {
        title: "Future Community Meetup",
        description: "Join us for an evening of networking and tech talks.",
        date: futureStr,
        time: "10:00 AM - 4:00 PM",
        location: "Koramangala, Bengaluru",
        capacity: 100,
        registrationDeadline: futureStr,
      };

      const result = eventCreationSchema.safeParse(payload);
      assert.equal(result.success, true);
    });

    it("rejects event dates strictly in the past", () => {
      const pastPayload = {
        title: "Past Event",
        description: "This event occurred in the past and should fail validation.",
        date: "2020-01-15",
        time: "10:00 AM",
        location: "Bengaluru",
        capacity: 50,
        registrationDeadline: "2020-01-14",
      };

      const result = eventCreationSchema.safeParse(pastPayload);
      assert.equal(result.success, false);
      if (!result.success) {
        assert.ok(
          result.error.issues.some((i) =>
            i.message.includes("Event date and time must be in the future")
          )
        );
      }
    });
  });

  describe("Security: CSV Export Formula Sanitization", () => {
    it("neutralizes potential spreadsheet formula prefixes (=, +, -, @)", () => {
      const sanitizeCsvCell = (val: string) => {
        let clean = (val || "").replace(/"/g, '""');
        if (/^[=+\-@\t\r]/.test(clean)) {
          clean = `'${clean}`;
        }
        return `"${clean}"`;
      };

      const maliciousName = "=cmd|' /C calc'!A0";
      assert.equal(sanitizeCsvCell(maliciousName), `"'=cmd|' /C calc'!A0"`);

      const plusFormula = "+SUM(A1:A10)";
      assert.equal(sanitizeCsvCell(plusFormula), `"'+SUM(A1:A10)"`);

      const standardName = "Jane Doe";
      assert.equal(sanitizeCsvCell(standardName), `"Jane Doe"`);
    });
  });
});
