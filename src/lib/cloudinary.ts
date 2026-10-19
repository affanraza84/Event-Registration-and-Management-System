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

export const ALLOWED_IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
] as const;

export type AllowedMimeType = (typeof ALLOWED_IMAGE_MIME_TYPES)[number];

export const DEFAULT_MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

/**
 * Returns configured maximum allowed upload file size in bytes.
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

export interface UploadImageResult {
  secureUrl: string;
  publicId: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
}

/**
 * Uploads an image buffer securely to Cloudinary using signed upload streams.
 */
export async function uploadImageBuffer(
  buffer: Buffer,
  options: {
    folder?: string;
    publicId?: string;
    tags?: string[];
  } = {}
): Promise<UploadImageResult> {
  const client = getCloudinaryClient();
  const folder =
    options.folder || process.env.CLOUDINARY_FOLDER || "eventscout/events";

  return new Promise<UploadImageResult>((resolve, reject) => {
    const uploadStream = client.uploader.upload_stream(
      {
        folder,
        public_id: options.publicId,
        tags: options.tags,
        resource_type: "image",
        overwrite: true,
        // Optional upload preset if configured
        upload_preset: process.env.CLOUDINARY_UPLOAD_PRESET || undefined,
      },
      (error, result?: UploadApiResponse) => {
        if (error || !result) {
          const rawMsg = error?.message || "";
          const httpCode = (error as { http_code?: number })?.http_code;

          if (httpCode === 403 || rawMsg.includes("403")) {
            return reject(
              new Error(
                "Cloudinary Permission Error (403): Your Cloudinary API Key lacks 'create' permissions. In Cloudinary Console -> Settings -> Access Keys, enable the 'create' permission (or use a key with Full Access)."
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
            new Error(
              rawMsg || "Failed to upload image buffer to Cloudinary"
            )
          );
        }

        resolve({
          secureUrl: result.secure_url,
          publicId: result.public_id,
          width: result.width,
          height: result.height,
          format: result.format,
          bytes: result.bytes,
        });
      }
    );

    uploadStream.end(buffer);
  });
}

/**
 * Safely removes an asset from Cloudinary using its public ID.
 * Avoids errors if asset does not exist or Cloudinary is unconfigured.
 */
export async function deleteCloudinaryAsset(
  publicId: string
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
      resource_type: "image",
      invalidate: true,
    });
    return { success: res.result === "ok", result: res.result };
  } catch (error) {
    console.error(`Error deleting Cloudinary asset ${publicId}:`, error);
    return { success: false, result: "error" };
  }
}

export { getOptimizedCloudinaryUrl } from "./cloudinaryUrl";
