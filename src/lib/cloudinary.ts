import crypto from "node:crypto";
import { v2 as cloudinary, UploadApiResponse } from "cloudinary";

/**
 * Validates whether all required Cloudinary environment variables are configured.
 */
export function isCloudinaryConfigured(): boolean {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
  );
}

/**
 * Returns a configured instance of Cloudinary SDK.
 * Throws a descriptive error if environment credentials are missing.
 */
export function getCloudinaryClient() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error(
      "Cloudinary is not configured. Missing CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, or CLOUDINARY_API_SECRET in environment variables."
    );
  }

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });

  return cloudinary;
}

// -----------------------------------------------------------------------------
// Image Constants & Validation
// -----------------------------------------------------------------------------

export const ALLOWED_IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
] as const;

export type AllowedImageMimeType = (typeof ALLOWED_IMAGE_MIME_TYPES)[number];

export const DEFAULT_MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

/**
 * Returns configured maximum allowed image upload size in bytes.
 */
export function getMaxUploadSizeBytes(): number {
  const envLimit = process.env.MAX_IMAGE_FILE_SIZE_BYTES;
  if (envLimit && !isNaN(Number(envLimit)) && Number(envLimit) > 0) {
    return Number(envLimit);
  }
  return DEFAULT_MAX_FILE_SIZE_BYTES;
}

/**
 * Validates image buffer magic bytes against common safe image signatures
 */
export function validateImageMagicBytes(buffer: Buffer): {
  isValid: boolean;
  detectedFormat?: string;
} {
  if (!buffer || buffer.length < 12) {
    return { isValid: false };
  }

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { isValid: true, detectedFormat: "jpeg" };
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return { isValid: true, detectedFormat: "png" };
  }

  // GIF: 47 49 46 38 (GIF8)
  if (
    buffer[0] === 0x47 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x38
  ) {
    return { isValid: true, detectedFormat: "gif" };
  }

  // WebP: 52 49 46 46 (RIFF) ... 57 45 42 50 (WEBP)
  if (
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return { isValid: true, detectedFormat: "webp" };
  }

  return { isValid: false };
}

// -----------------------------------------------------------------------------
// Video Constants & Validation
// -----------------------------------------------------------------------------

export const ALLOWED_VIDEO_MIME_TYPES = [
  "video/mp4",
  "video/webm",
  "video/quicktime", // MOV
] as const;

export type AllowedVideoMimeType = (typeof ALLOWED_VIDEO_MIME_TYPES)[number];

export const DEFAULT_MAX_VIDEO_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB

/**
 * Returns configured maximum allowed video upload size in bytes.
 */
export function getMaxVideoUploadSizeBytes(): number {
  const envLimit = process.env.MAX_VIDEO_FILE_SIZE_BYTES;
  if (envLimit && !isNaN(Number(envLimit)) && Number(envLimit) > 0) {
    return Number(envLimit);
  }
  return DEFAULT_MAX_VIDEO_FILE_SIZE_BYTES;
}

/**
 * Validates video buffer magic bytes (MP4, WebM, MOV)
 */
export function validateVideoMagicBytes(buffer: Buffer): {
  isValid: boolean;
  detectedFormat?: string;
} {
  if (!buffer || buffer.length < 12) {
    return { isValid: false };
  }

  // WebM: EBML header (1A 45 DF A3)
  if (
    buffer[0] === 0x1a &&
    buffer[1] === 0x45 &&
    buffer[2] === 0xdf &&
    buffer[3] === 0xa3
  ) {
    return { isValid: true, detectedFormat: "webm" };
  }

  // MP4 / MOV: ISO Base Media file / QuickTime has 'ftyp', 'moov', or 'mdat' at bytes 4..7
  const subBox = buffer.subarray(4, 8).toString("ascii");
  if (subBox === "ftyp") {
    const majorBrand = buffer.subarray(8, 12).toString("ascii").trim();
    if (majorBrand === "qt  ") {
      return { isValid: true, detectedFormat: "quicktime" };
    }
    return { isValid: true, detectedFormat: "mp4" };
  }

  if (subBox === "moov" || subBox === "mdat") {
    return { isValid: true, detectedFormat: "mp4" };
  }

  return { isValid: false };
}

// -----------------------------------------------------------------------------
// Media Upload & Processing
// -----------------------------------------------------------------------------

export interface UploadMediaResult {
  secureUrl: string;
  publicId: string;
  resourceType: "image" | "video";
  width?: number;
  height?: number;
  duration?: number;
  format: string;
  bytes: number;
  tags?: string[];
  moderation?: Array<{
    status: string;
    kind: string;
    response?: Record<string, unknown>;
  }>;
}

export type UploadImageResult = UploadMediaResult;

export interface UploadMediaOptions {
  folder?: string;
  publicId?: string;
  resourceType?: "image" | "video" | "auto";
  tags?: string[];
  categorization?: string;
  autoTagging?: number;
  moderation?: string;
  notificationUrl?: string;
}

/**
 * Securely uploads a media buffer (image or video) to Cloudinary via signed upload stream.
 */
export async function uploadMediaBuffer(
  buffer: Buffer,
  options: UploadMediaOptions = {}
): Promise<UploadMediaResult> {
  const client = getCloudinaryClient();
  const folder =
    options.folder || process.env.CLOUDINARY_FOLDER || "eventscout/events";
  const resourceType = options.resourceType || "auto";

  return new Promise<UploadMediaResult>((resolve, reject) => {
    const uploadStreamOptions: Record<string, unknown> = {
      folder,
      public_id: options.publicId,
      tags: options.tags,
      resource_type: resourceType,
      overwrite: true,
      upload_preset: process.env.CLOUDINARY_UPLOAD_PRESET || undefined,
    };

    if (options.notificationUrl) {
      uploadStreamOptions.notification_url = options.notificationUrl;
    } else if (process.env.CLOUDINARY_NOTIFICATION_URL) {
      uploadStreamOptions.notification_url = process.env.CLOUDINARY_NOTIFICATION_URL;
    }

    // Optional Cloudinary Add-on auto-tagging
    if (options.categorization) {
      uploadStreamOptions.categorization = options.categorization;
    }
    if (options.autoTagging) {
      uploadStreamOptions.auto_tagging = options.autoTagging;
    }

    // Optional Cloudinary Moderation
    if (options.moderation) {
      uploadStreamOptions.moderation = options.moderation;
    } else if (process.env.CLOUDINARY_MODERATION_KIND) {
      uploadStreamOptions.moderation = process.env.CLOUDINARY_MODERATION_KIND;
    }

    const uploadStream = client.uploader.upload_stream(
      uploadStreamOptions,
      (error, result?: UploadApiResponse) => {
        if (error || !result) {
          const rawMsg = error?.message || "";
          const httpCode = (error as { http_code?: number })?.http_code;

          if (httpCode === 403 || rawMsg.includes("403")) {
            return reject(
              new Error(
                "Cloudinary Permission Error (403): Your Cloudinary API Key lacks permissions. In Cloudinary Console -> Settings -> Access Keys, ensure appropriate write permissions are granted."
              )
            );
          }

          if (httpCode === 401 || rawMsg.includes("401")) {
            return reject(
              new Error(
                "Cloudinary Authentication Error (401): Invalid Cloudinary credentials. Please verify CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET."
              )
            );
          }

          return reject(
            new Error(rawMsg || "Failed to upload media buffer to Cloudinary")
          );
        }

        const isVideo =
          result.resource_type === "video" ||
          resourceType === "video" ||
          Boolean(result.duration);

        resolve({
          secureUrl: result.secure_url,
          publicId: result.public_id,
          resourceType: isVideo ? "video" : "image",
          width: result.width,
          height: result.height,
          duration: result.duration,
          format: result.format,
          bytes: result.bytes,
          tags: Array.isArray(result.tags) ? result.tags : [],
          moderation: Array.isArray(result.moderation)
            ? (result.moderation as unknown[]).map((item) =>
                typeof item === "string"
                  ? { status: item, kind: "manual" }
                  : (item as { status: string; kind: string; response?: Record<string, unknown> })
              )
            : undefined,
        });
      }
    );

    uploadStream.end(buffer);
  });
}

/**
 * Backwards-compatible image buffer uploader
 */
export async function uploadImageBuffer(
  buffer: Buffer,
  options: UploadMediaOptions = {}
): Promise<UploadImageResult> {
  return uploadMediaBuffer(buffer, {
    ...options,
    resourceType: "image",
  });
}

/**
 * Video buffer uploader with video-specific defaults
 */
export async function uploadVideoBuffer(
  buffer: Buffer,
  options: UploadMediaOptions = {}
): Promise<UploadMediaResult> {
  return uploadMediaBuffer(buffer, {
    ...options,
    resourceType: "video",
  });
}

/**
 * Safely removes an asset from Cloudinary using its public ID.
 * Avoids errors if asset does not exist or Cloudinary is unconfigured.
 */
export async function deleteCloudinaryAsset(
  publicId: string,
  resourceType: "image" | "video" = "image"
): Promise<{ success: boolean; result?: string }> {
  if (!publicId || !isCloudinaryConfigured()) {
    return { success: false, result: "skipped" };
  }

  // Security guard: Only allow deletion within approved EventScout folders
  if (!publicId.startsWith("eventscout/")) {
    console.warn(`Prevented deletion of asset outside eventscout folder: ${publicId}`);
    return { success: false, result: "forbidden" };
  }

  try {
    const client = getCloudinaryClient();
    const res = await client.uploader.destroy(publicId, {
      resource_type: resourceType,
      invalidate: true,
    });
    return { success: res.result === "ok", result: res.result };
  } catch (error) {
    console.error(`Error deleting Cloudinary asset ${publicId}:`, error);
    return { success: false, result: "error" };
  }
}

/**
 * Validates Cloudinary notification webhook signatures with SHA-1 and SHA-256 support,
 * replay protection (timestamp window), and constant-time digest comparison.
 */
export function verifyCloudinaryWebhookSignature(
  rawBodyOrOptions:
    | string
    | {
        rawBody: string;
        timestamp?: string | number | null;
        signature?: string | null;
        apiSecret?: string;
      },
  timestampArg?: string | number | null,
  signatureArg?: string | null,
  customSecret?: string
): boolean {
  let rawBody: string;
  let timestamp: string | number | null | undefined;
  let signature: string | null | undefined;
  let secret: string | undefined;

  if (typeof rawBodyOrOptions === "object" && rawBodyOrOptions !== null) {
    rawBody = rawBodyOrOptions.rawBody;
    timestamp = rawBodyOrOptions.timestamp;
    signature = rawBodyOrOptions.signature;
    secret = rawBodyOrOptions.apiSecret || process.env.CLOUDINARY_API_SECRET;
  } else {
    rawBody = rawBodyOrOptions;
    timestamp = timestampArg;
    signature = signatureArg;
    secret = customSecret || process.env.CLOUDINARY_API_SECRET;
  }

  if (!secret || !rawBody || !signature || !timestamp) {
    return false;
  }

  const numericTimestamp = Number(timestamp);
  if (isNaN(numericTimestamp) || numericTimestamp <= 0) {
    return false;
  }

  // Cloudinary signatures expire after 2 hours (7200 seconds)
  const currentTimestamp = Math.floor(Date.now() / 1000);
  if (numericTimestamp < currentTimestamp - 7200 || numericTimestamp > currentTimestamp + 300) {
    return false;
  }

  try {
    const algo = signature.length === 64 ? "sha256" : "sha1";
    const expected = crypto
      .createHash(algo)
      .update(rawBody + String(timestamp) + secret)
      .digest("hex");

    const sigBuf = Buffer.from(signature, "hex");
    const expBuf = Buffer.from(expected, "hex");
    if (sigBuf.length !== expBuf.length) {
      return false;
    }
    return crypto.timingSafeEqual(sigBuf, expBuf);
  } catch {
    return false;
  }
}

export { getOptimizedCloudinaryUrl } from "./cloudinaryUrl";
