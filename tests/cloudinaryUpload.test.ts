import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  isCloudinaryConfigured,
  getMaxUploadSizeBytes,
  validateImageMagicBytes,
  getOptimizedCloudinaryUrl,
  ALLOWED_IMAGE_MIME_TYPES,
} from "../src/lib/cloudinary.ts";
import { getEventCover } from "../src/lib/eventCovers.ts";
import { eventCreationSchema } from "../src/validations/event.ts";

describe("Cloudinary Image Upload & Optimization Suite", () => {
  describe("Environment Configuration & Sizing", () => {
    it("reports configuration status correctly based on credentials presence", () => {
      const origCloud = process.env.CLOUDINARY_CLOUD_NAME;
      const origKey = process.env.CLOUDINARY_API_KEY;
      const origSecret = process.env.CLOUDINARY_API_SECRET;

      delete process.env.CLOUDINARY_CLOUD_NAME;
      delete process.env.CLOUDINARY_API_KEY;
      delete process.env.CLOUDINARY_API_SECRET;
      assert.equal(isCloudinaryConfigured(), false);

      process.env.CLOUDINARY_CLOUD_NAME = "test-cloud";
      process.env.CLOUDINARY_API_KEY = "test-key";
      process.env.CLOUDINARY_API_SECRET = "test-secret";
      assert.equal(isCloudinaryConfigured(), true);

      // Restore
      if (origCloud) process.env.CLOUDINARY_CLOUD_NAME = origCloud;
      else delete process.env.CLOUDINARY_CLOUD_NAME;
      if (origKey) process.env.CLOUDINARY_API_KEY = origKey;
      else delete process.env.CLOUDINARY_API_KEY;
      if (origSecret) process.env.CLOUDINARY_API_SECRET = origSecret;
      else delete process.env.CLOUDINARY_API_SECRET;
    });

    it("enforces default 5MB size limit and respects configurable override", () => {
      const origLimit = process.env.MAX_IMAGE_FILE_SIZE_BYTES;
      delete process.env.MAX_IMAGE_FILE_SIZE_BYTES;

      assert.equal(getMaxUploadSizeBytes(), 5 * 1024 * 1024);

      process.env.MAX_IMAGE_FILE_SIZE_BYTES = "10485760"; // 10MB
      assert.equal(getMaxUploadSizeBytes(), 10485760);

      if (origLimit) process.env.MAX_IMAGE_FILE_SIZE_BYTES = origLimit;
      else delete process.env.MAX_IMAGE_FILE_SIZE_BYTES;
    });

    it("whitelists only supported modern image MIME types", () => {
      assert.ok(ALLOWED_IMAGE_MIME_TYPES.includes("image/jpeg"));
      assert.ok(ALLOWED_IMAGE_MIME_TYPES.includes("image/png"));
      assert.ok(ALLOWED_IMAGE_MIME_TYPES.includes("image/webp"));
      assert.ok(ALLOWED_IMAGE_MIME_TYPES.includes("image/gif"));
      assert.equal(ALLOWED_IMAGE_MIME_TYPES.length, 4);
    });
  });

  describe("Binary Magic Bytes Inspection", () => {
    it("recognizes valid JPEG magic bytes", () => {
      const jpegBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01]);
      const res = validateImageMagicBytes(jpegBuffer);
      assert.equal(res.isValid, true);
      assert.equal(res.detectedFormat, "jpeg");
    });

    it("recognizes valid PNG magic bytes", () => {
      const pngBuffer = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d]);
      const res = validateImageMagicBytes(pngBuffer);
      assert.equal(res.isValid, true);
      assert.equal(res.detectedFormat, "png");
    });

    it("recognizes valid WebP magic bytes", () => {
      // RIFF....WEBP
      const webpBuffer = Buffer.from([
        0x52, 0x49, 0x46, 0x46, 0x24, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50,
      ]);
      const res = validateImageMagicBytes(webpBuffer);
      assert.equal(res.isValid, true);
      assert.equal(res.detectedFormat, "webp");
    });

    it("recognizes valid GIF magic bytes", () => {
      const gifBuffer = Buffer.from([0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x01, 0x00, 0x01, 0x00, 0x80, 0x00]);
      const res = validateImageMagicBytes(gifBuffer);
      assert.equal(res.isValid, true);
      assert.equal(res.detectedFormat, "gif");
    });

    it("rejects malicious or corrupted binary disguised with image extensions", () => {
      const textBuffer = Buffer.from("<?php echo 'malicious payload'; ?>");
      assert.equal(validateImageMagicBytes(textBuffer).isValid, false);

      const htmlBuffer = Buffer.from("<html><script>alert(1)</script></html>");
      assert.equal(validateImageMagicBytes(htmlBuffer).isValid, false);

      const emptyBuffer = Buffer.alloc(5);
      assert.equal(validateImageMagicBytes(emptyBuffer).isValid, false);
    });
  });

  describe("Cloudinary URL Optimization & Transformation", () => {
    it("injects f_auto,q_auto into raw Cloudinary image URLs", () => {
      const rawUrl =
        "https://res.cloudinary.com/eventscout/image/upload/v1729000000/eventscout/events/poster_123.jpg";
      const optimized = getOptimizedCloudinaryUrl(rawUrl, { width: 1200 });

      assert.ok(optimized.includes("/upload/f_auto,q_auto,w_1200/"));
      assert.ok(optimized.endsWith("eventscout/events/poster_123.jpg"));
    });

    it("supports dimensions, aspect ratio cropping, and gravity parameters", () => {
      const rawUrl =
        "https://res.cloudinary.com/eventscout/image/upload/v1729000000/eventscout/events/poster_123.png";
      const optimized = getOptimizedCloudinaryUrl(rawUrl, {
        width: 800,
        height: 450,
        crop: "fill",
        gravity: "auto",
      });

      assert.ok(
        optimized.includes("/upload/f_auto,q_auto,w_800,h_450,c_fill,g_auto/")
      );
    });

    it("preserves external non-Cloudinary URLs as-is", () => {
      const unsplashUrl =
        "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format";
      const result = getOptimizedCloudinaryUrl(unsplashUrl, { width: 1200 });
      assert.equal(result, unsplashUrl);
    });
  });

  describe("Event Cover Fallback & Custom Poster Priority", () => {
    it("prioritizes custom Cloudinary poster URL when provided", () => {
      const customUrl =
        "https://res.cloudinary.com/eventscout/image/upload/eventscout/events/my_custom_poster.jpg";
      const cover = getEventCover(
        "AI Innovation Summit",
        "conference",
        "evt_999",
        customUrl
      );

      assert.ok(cover.url.includes("res.cloudinary.com"));
      assert.ok(cover.url.includes("my_custom_poster.jpg"));
      assert.equal(cover.alt, "AI Innovation Summit");
    });

    it("falls back to deterministic curated photography if no custom poster exists", () => {
      const cover = getEventCover("Bengaluru AI Hackathon 2026", "hackathon", "evt_123");
      assert.ok(cover.url.includes("images.unsplash.com"));
      assert.ok(cover.alt.length > 5);
      assert.ok(cover.accent.startsWith("#"));
    });
  });

  describe("Validation Schema: Event Creation with Poster", () => {
    it("accepts valid event payload with Cloudinary poster and public ID", () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 20);
      const futureStr = futureDate.toISOString().split("T")[0];

      const deadline = new Date();
      deadline.setDate(deadline.getDate() + 10);
      const deadlineStr = deadline.toISOString().split("T")[0];

      const validPayload = {
        title: "Cloudinary Launch Gathering",
        description: "Official launch event celebrating scalable image workflows.",
        date: futureStr,
        time: "14:00",
        location: "Koramangala, Bengaluru",
        capacity: 100,
        registrationDeadline: deadlineStr,
        imageUrl:
          "https://res.cloudinary.com/eventscout/image/upload/v12345/eventscout/events/poster.jpg",
        imagePublicId: "eventscout/events/poster",
      };

      const parsed = eventCreationSchema.safeParse(validPayload);
      assert.equal(parsed.success, true);
    });

    it("rejects invalid or unsafe protocols in imageUrl", () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 20);
      const futureStr = futureDate.toISOString().split("T")[0];

      const deadline = new Date();
      deadline.setDate(deadline.getDate() + 10);
      const deadlineStr = deadline.toISOString().split("T")[0];

      const xssPayload = {
        title: "Malicious Image Payload",
        description: "Attempting javascript: pseudo-protocol in imageUrl.",
        date: futureStr,
        time: "14:00",
        location: "Virtual",
        capacity: 100,
        registrationDeadline: deadlineStr,
        imageUrl: "javascript:alert(1)",
        imagePublicId: "bad_id",
      };

      const parsed = eventCreationSchema.safeParse(xssPayload);
      assert.equal(parsed.success, false);
      if (!parsed.success) {
        assert.ok(parsed.error.issues.some((i) => i.path.includes("imageUrl")));
      }
    });

    it("allows omitting imageUrl and imagePublicId for events using default covers", () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 20);
      const futureStr = futureDate.toISOString().split("T")[0];

      const deadline = new Date();
      deadline.setDate(deadline.getDate() + 10);
      const deadlineStr = deadline.toISOString().split("T")[0];

      const noPosterPayload = {
        title: "No Poster Minimal Event",
        description: "Event organized without a custom banner poster.",
        date: futureStr,
        time: "18:00",
        location: "Indiranagar, Bengaluru",
        capacity: 50,
        registrationDeadline: deadlineStr,
      };

      const parsed = eventCreationSchema.safeParse(noPosterPayload);
      assert.equal(parsed.success, true);
    });
  });
});
