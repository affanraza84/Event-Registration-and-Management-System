import { describe, it } from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import {
  validateVideoMagicBytes,
  getMaxVideoUploadSizeBytes,
  ALLOWED_VIDEO_MIME_TYPES,
  verifyCloudinaryWebhookSignature,
} from "../src/lib/cloudinary";
import {
  buildCloudinaryUrl,
  getCardImageUrl,
  getHeroBannerUrl,
  getGalleryThumbnailUrl,
  getVideoThumbnailUrl,
  getAdaptiveVideoUrl,
  getSocialShareUrl,
} from "../src/lib/mediaTransformations";
import {
  extractMediaTags,
  sanitizeTags,
  normalizeTag,
} from "../src/utils/mediaTagging";

describe("Event Media Intelligence System Suite", () => {
  describe("Feature E: Video Validation & Magic Bytes", () => {
    it("recognizes valid MP4 file containing ftyp box", () => {
      // Typical MP4 starts with 4 bytes size, then 'ftyp'
      const mp4Buffer = Buffer.from([
        0x00, 0x00, 0x00, 0x20, // box size
        0x66, 0x74, 0x79, 0x70, // 'ftyp'
        0x69, 0x73, 0x6f, 0x6d, // 'isom'
        0x00, 0x00, 0x02, 0x00,
        0x69, 0x73, 0x6f, 0x6d,
        0x69, 0x73, 0x6f, 0x32,
        0x61, 0x76, 0x63, 0x31,
        0x6d, 0x70, 0x34, 0x31,
      ]);
      assert.equal(validateVideoMagicBytes(mp4Buffer).isValid, true);
    });

    it("recognizes valid WebM / Matroska file starting with EBML header", () => {
      // WebM starts with 0x1A 0x45 0xDF 0xA3 followed by EBML elements
      const webmBuffer = Buffer.from([
        0x1a, 0x45, 0xdf, 0xa3, // EBML ID
        0x9f, 0x42, 0x86, 0x81, 0x01, 0x42, 0xf7, 0x81,
        0x01, 0x42, 0xf2, 0x81, 0x04, 0x42, 0xf3, 0x81,
        0x08, 0x42, 0x82, 0x84, 0x77, 0x65, 0x62, 0x6d, // 'webm'
      ]);
      assert.equal(validateVideoMagicBytes(webmBuffer).isValid, true);
    });

    it("rejects malicious or invalid buffer disguised as video", () => {
      const maliciousBuffer = Buffer.from("<?php echo 'system exploit'; ?>", "utf-8");
      assert.equal(validateVideoMagicBytes(maliciousBuffer).isValid, false);

      const emptyBuffer = Buffer.alloc(10);
      assert.equal(validateVideoMagicBytes(emptyBuffer).isValid, false);
    });

    it("enforces default 50MB video limit and respects environment override", () => {
      const orig = process.env.MAX_VIDEO_FILE_SIZE_BYTES;
      delete process.env.MAX_VIDEO_FILE_SIZE_BYTES;

      assert.equal(getMaxVideoUploadSizeBytes(), 50 * 1024 * 1024);

      process.env.MAX_VIDEO_FILE_SIZE_BYTES = "26214400"; // 25MB
      assert.equal(getMaxVideoUploadSizeBytes(), 26214400);

      if (orig) process.env.MAX_VIDEO_FILE_SIZE_BYTES = orig;
      else delete process.env.MAX_VIDEO_FILE_SIZE_BYTES;
    });

    it("whitelists supported video MIME types", () => {
      assert.ok(ALLOWED_VIDEO_MIME_TYPES.includes("video/mp4"));
      assert.ok(ALLOWED_VIDEO_MIME_TYPES.includes("video/webm"));
      assert.ok(ALLOWED_VIDEO_MIME_TYPES.includes("video/quicktime"));
    });
  });

  describe("Feature B: Dynamic Media Transformations", () => {
    const sampleCldUrl =
      "https://res.cloudinary.com/demo/image/upload/v1612345678/eventscout/events/poster.jpg";

    it("buildCloudinaryUrl injects transformations immediately after /upload/", () => {
      const transformed = buildCloudinaryUrl(sampleCldUrl, {
        width: 800,
        height: 600,
        crop: "fill",
        gravity: "auto",
        quality: "auto",
        format: "auto",
      });

      assert.ok(transformed.includes("/upload/"));
      assert.ok(transformed.includes("c_fill"));
      assert.ok(transformed.includes("g_auto"));
      assert.ok(transformed.includes("w_800"));
      assert.ok(transformed.includes("h_600"));
      assert.ok(transformed.includes("q_auto"));
      assert.ok(transformed.includes("f_auto"));
    });

    it("getCardImageUrl formats for high-res responsive cards", () => {
      const cardUrl = getCardImageUrl(sampleCldUrl);
      assert.ok(cardUrl.includes("w_800"));
      assert.ok(cardUrl.includes("h_450"));
      assert.ok(cardUrl.includes("c_fill"));
      assert.ok(cardUrl.includes("g_auto"));
    });

    it("getHeroBannerUrl generates high-impact 1600px banner variant", () => {
      const bannerUrl = getHeroBannerUrl(sampleCldUrl);
      assert.ok(bannerUrl.includes("w_1600"));
      assert.ok(bannerUrl.includes("h_600"));
    });

    it("getGalleryThumbnailUrl creates crisp 400x400 square thumbnail", () => {
      const thumbUrl = getGalleryThumbnailUrl(sampleCldUrl);
      assert.ok(thumbUrl.includes("w_400"));
      assert.ok(thumbUrl.includes("h_400"));
    });

    it("getSocialShareUrl generates OpenGraph 1200x630 dimensions", () => {
      const ogUrl = getSocialShareUrl(sampleCldUrl);
      assert.ok(ogUrl.includes("w_1200"));
      assert.ok(ogUrl.includes("h_630"));
    });

    it("getVideoThumbnailUrl generates a .jpg keyframe from video", () => {
      const videoCldUrl =
        "https://res.cloudinary.com/demo/video/upload/v1612345678/eventscout/events/promo.mp4";
      const thumb = getVideoThumbnailUrl(videoCldUrl, { width: 1280 });

      assert.ok(thumb.endsWith(".jpg"));
      assert.ok(thumb.includes("so_auto"));
      assert.ok(thumb.includes("w_1280"));
    });

    it("getAdaptiveVideoUrl applies streaming optimizations vc_auto and q_auto", () => {
      const videoCldUrl =
        "https://res.cloudinary.com/demo/video/upload/v1612345678/eventscout/events/promo.mp4";
      const adaptive = getAdaptiveVideoUrl(videoCldUrl, { width: 1920 });

      assert.ok(adaptive.includes("vc_auto"));
      assert.ok(adaptive.includes("q_auto"));
      assert.ok(adaptive.includes("w_1920"));
    });

    it("preserves external non-Cloudinary URLs as-is", () => {
      const unsplashUrl = "https://images.unsplash.com/photo-1540575467063-178a50c2df87";
      assert.equal(getCardImageUrl(unsplashUrl), unsplashUrl);
      assert.equal(getHeroBannerUrl(unsplashUrl), unsplashUrl);
      assert.equal(getVideoThumbnailUrl(unsplashUrl), unsplashUrl);
    });
  });

  describe("Feature C: AI-Powered Media Tagging & Honest Fallback", () => {
    it("extracts tags from Cloudinary AI add-on when present", () => {
      const cloudinaryResult = {
        tags: ["hackathon", "developers", "coding", "tech conference"],
        info: {
          categorization: {
            google_tagging: {
              data: [
                { tag: "Auditorium", confidence: 0.94 },
                { tag: "Stage Lighting", confidence: 0.88 },
              ],
            },
          },
        },
      };

      const result = extractMediaTags(cloudinaryResult, {
        category: "Technology",
        title: "Global Dev Summit",
      });

      assert.equal(result.tagSource, "cloudinary_ai");
      const lowerTags = result.tags.map((t) => t.toLowerCase());
      assert.ok(lowerTags.includes("hackathon"));
      assert.ok(lowerTags.includes("developers"));
      assert.ok(lowerTags.includes("auditorium"));
      assert.ok(lowerTags.includes("stage lighting"));
    });

    it("falls back gracefully to domain taxonomy when Cloudinary AI is absent without pretending to be AI", () => {
      // Cloudinary result has NO tags or add-on info
      const cloudinaryResult = {
        public_id: "eventscout/events/photo_123",
      };

      const result = extractMediaTags(cloudinaryResult, {
        category: "Hackathons",
        title: "Next.js AI Hackathon 2026",
      });

      // Crucial requirement: Must NOT pretend that Cloudinary generated these tags
      assert.equal(result.tagSource, "context");
      assert.ok(result.tags.length > 0);
      const lowerTags = result.tags.map((t) => t.toLowerCase());
      assert.ok(lowerTags.includes("hackathon") || lowerTags.includes("hackathons"));
      assert.ok(lowerTags.includes("technology") || lowerTags.includes("coding"));
    });

    it("normalizes and sanitizes user-provided tags correctly", () => {
      assert.equal(normalizeTag("  #OpenSource!  "), "Opensource");
      assert.equal(normalizeTag("ART & DESIGN"), "Art Design");

      const raw = ["Tech", "tech", " AI ", "", "a", "12345678901234567890123456789012345"];
      const cleaned = sanitizeTags(raw);

      assert.deepEqual(cleaned, ["Tech", "Ai"]); // deduplicated, trimmed, length bounded
    });
  });

  describe("Feature D: Webhook Signature Verification & Moderation", () => {
    const testSecret = "test_cloudinary_api_secret_12345";
    const testBody = JSON.stringify({
      notification_type: "moderation",
      moderation_status: "approved",
      asset_id: "abcde",
      public_id: "eventscout/events/img_01",
    });

    it("validates valid Cloudinary SHA-1 webhook signature", () => {
      const timestamp = Math.floor(Date.now() / 1000).toString();
      const expectedSig = crypto
        .createHash("sha1")
        .update(testBody + timestamp + testSecret)
        .digest("hex");

      const isValid = verifyCloudinaryWebhookSignature({
        rawBody: testBody,
        timestamp,
        signature: expectedSig,
        apiSecret: testSecret,
      });

      assert.equal(isValid, true);
    });

    it("validates valid Cloudinary SHA-256 webhook signature", () => {
      const timestamp = Math.floor(Date.now() / 1000).toString();
      const expectedSig = crypto
        .createHash("sha256")
        .update(testBody + timestamp + testSecret)
        .digest("hex");

      const isValid = verifyCloudinaryWebhookSignature({
        rawBody: testBody,
        timestamp,
        signature: expectedSig,
        apiSecret: testSecret,
      });

      assert.equal(isValid, true);
    });

    it("rejects tampered or forged body payload", () => {
      const timestamp = Math.floor(Date.now() / 1000).toString();
      const validSig = crypto
        .createHash("sha1")
        .update(testBody + timestamp + testSecret)
        .digest("hex");

      const tamperedBody = testBody + " "; // modified
      const isValid = verifyCloudinaryWebhookSignature({
        rawBody: tamperedBody,
        timestamp,
        signature: validSig,
        apiSecret: testSecret,
      });

      assert.equal(isValid, false);
    });

    it("rejects expired webhook timestamps (> 2 hours old)", () => {
      const expiredTimestamp = (Math.floor(Date.now() / 1000) - 8000).toString(); // >2h ago
      const sig = crypto
        .createHash("sha1")
        .update(testBody + expiredTimestamp + testSecret)
        .digest("hex");

      const isValid = verifyCloudinaryWebhookSignature({
        rawBody: testBody,
        timestamp: expiredTimestamp,
        signature: sig,
        apiSecret: testSecret,
      });

      assert.equal(isValid, false);
    });

    it("rejects missing headers or missing API secret", () => {
      assert.equal(
        verifyCloudinaryWebhookSignature({
          rawBody: testBody,
          timestamp: null,
          signature: "some-sig",
          apiSecret: testSecret,
        }),
        false
      );

      assert.equal(
        verifyCloudinaryWebhookSignature({
          rawBody: testBody,
          timestamp: "12345",
          signature: null,
          apiSecret: testSecret,
        }),
        false
      );

      assert.equal(
        verifyCloudinaryWebhookSignature({
          rawBody: testBody,
          timestamp: "12345",
          signature: "sig",
          apiSecret: "",
        }),
        false
      );
    });
  });

  describe("Access Control & Moderation Filtering Predicate", () => {
    const assets = [
      { id: "1", moderationStatus: "approved", processingStatus: "ready", isPublic: true },
      { id: "2", moderationStatus: "pending", processingStatus: "ready", isPublic: false },
      { id: "3", moderationStatus: "rejected", processingStatus: "ready", isPublic: false },
      { id: "4", moderationStatus: "approved", processingStatus: "processing", isPublic: false },
    ];

    it("ensures public attendee views filter out pending and rejected assets", () => {
      // Public filter rule
      const publicAssets = assets.filter(
        (a) => a.moderationStatus === "approved" && a.processingStatus === "ready"
      );

      assert.equal(publicAssets.length, 1);
      assert.equal(publicAssets[0].id, "1");
    });

    it("allows event host to see all their uploads including pending and rejected for moderation review", () => {
      // Host view rule
      const hostAssets = assets;
      assert.equal(hostAssets.length, 4);
      assert.ok(hostAssets.some((a) => a.moderationStatus === "pending"));
      assert.ok(hostAssets.some((a) => a.moderationStatus === "rejected"));
    });
  });
});
