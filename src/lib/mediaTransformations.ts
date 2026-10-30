/**
 * Dynamic Media Transformation Helpers for Cloudinary
 *
 * Generates dynamically transformed, optimized delivery URLs for images and videos
 * using Cloudinary best practices: f_auto, q_auto, g_auto, and smart responsive sizing.
 *
 * Completely safe for both Client Components and Server Components (no Node.js dependencies).
 */

export interface TransformationOptions {
  width?: number;
  height?: number;
  crop?: "fill" | "scale" | "fit" | "thumb" | "crop" | "pad";
  gravity?: "auto" | "face" | "center" | "north" | "south" | "east" | "west" | string;
  quality?: "auto" | "auto:best" | "auto:good" | "auto:eco" | "auto:low" | number;
  format?: "auto" | "jpg" | "png" | "webp" | "avif" | "mp4" | "webm";
  aspectRatio?: string;
  startOffset?: string | number; // For video keyframe / thumbnail capture (e.g., "so_auto", "so_0")
  videoCodec?: "auto" | "h264" | "h265" | "vp9";
}

/**
 * Builds a transformed Cloudinary URL from either a full Cloudinary URL or a raw public ID.
 */
export function buildCloudinaryUrl(
  urlOrPublicId: string,
  options: TransformationOptions = {},
  resourceType: "image" | "video" = "image"
): string {
  if (!urlOrPublicId) return "";

  const cloudName =
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ||
    process.env.CLOUDINARY_CLOUD_NAME ||
    "eventscout";

  // If already a full URL
  const isFullUrl = urlOrPublicId.startsWith("http://") || urlOrPublicId.startsWith("https://");

  // If external non-Cloudinary URL, return as-is
  if (isFullUrl && !urlOrPublicId.includes("res.cloudinary.com")) {
    return urlOrPublicId;
  }

  // Construct transformation parts
  const parts: string[] = [];

  // 1. Format & Quality defaults
  const format = options.format || "auto";
  const quality = options.quality || "auto";

  parts.push(`f_${format}`);
  parts.push(`q_${quality}`);

  // 2. Dimensions & Aspect Ratio
  if (options.width) parts.push(`w_${options.width}`);
  if (options.height) parts.push(`h_${options.height}`);
  if (options.aspectRatio) parts.push(`ar_${options.aspectRatio}`);

  // 3. Crop & Gravity
  if (options.crop) {
    parts.push(`c_${options.crop}`);
  } else if (options.width || options.height || options.aspectRatio) {
    parts.push("c_fill");
  }

  if (options.gravity) {
    parts.push(`g_${options.gravity}`);
  } else if (options.crop === "fill" || (!options.crop && (options.width || options.height))) {
    // Default smart gravity for content-aware focal points
    parts.push("g_auto");
  }

  // 4. Video-specific parameters
  if (resourceType === "video") {
    if (options.videoCodec) {
      parts.push(`vc_${options.videoCodec}`);
    } else {
      parts.push("vc_auto");
    }
  }

  if (options.startOffset !== undefined) {
    parts.push(`so_${options.startOffset}`);
  }

  const transformString = parts.join(",");

  if (isFullUrl) {
    const uploadIndex = urlOrPublicId.indexOf("/upload/");
    if (uploadIndex === -1) {
      return urlOrPublicId;
    }

    const prefix = urlOrPublicId.substring(0, uploadIndex + 8);
    const rest = urlOrPublicId.substring(uploadIndex + 8);

    // If already has transformation parameters right after /upload/, replace or append
    if (/^[a-z]_[a-z0-9_,-]+\//i.test(rest)) {
      const slashIndex = rest.indexOf("/");
      const cleanPath = rest.substring(slashIndex + 1);
      return `${prefix}${transformString}/${cleanPath}`;
    }

    return `${prefix}${transformString}/${rest}`;
  }

  // Input is a raw public ID
  const cleanPublicId = urlOrPublicId.replace(/^\//, "");
  return `https://res.cloudinary.com/${cloudName}/${resourceType}/upload/${transformString}/${cleanPublicId}`;
}

/**
 * Optimized image for event cards (800x450, 16:9 ratio, smart fill with auto gravity).
 */
export function getCardImageUrl(
  urlOrPublicId: string,
  options: { width?: number; height?: number } = {}
): string {
  return buildCloudinaryUrl(
    urlOrPublicId,
    {
      width: options.width || 800,
      height: options.height || 450,
      crop: "fill",
      gravity: "auto",
      quality: "auto",
      format: "auto",
    },
    "image"
  );
}

/**
 * High-resolution panoramic hero banner for event detail headers (1600x600).
 */
export function getHeroBannerUrl(
  urlOrPublicId: string,
  options: { width?: number; height?: number } = {}
): string {
  return buildCloudinaryUrl(
    urlOrPublicId,
    {
      width: options.width || 1600,
      height: options.height || 600,
      crop: "fill",
      gravity: "auto",
      quality: "auto",
      format: "auto",
    },
    "image"
  );
}

/**
 * Square thumbnail for media library grids and gallery strips (400x400).
 */
export function getGalleryThumbnailUrl(
  urlOrPublicId: string,
  options: { width?: number; height?: number } = {}
): string {
  return buildCloudinaryUrl(
    urlOrPublicId,
    {
      width: options.width || 400,
      height: options.height || 400,
      crop: "fill",
      gravity: "auto",
      quality: "auto",
      format: "auto",
    },
    "image"
  );
}

/**
 * Standard 1200x630 OpenGraph / Twitter social card image.
 */
export function getSocialShareUrl(urlOrPublicId: string): string {
  return buildCloudinaryUrl(
    urlOrPublicId,
    {
      width: 1200,
      height: 630,
      crop: "fill",
      gravity: "auto",
      quality: "auto",
      format: "jpg", // Reliable across social bots
    },
    "image"
  );
}

/**
 * Generates a video poster / thumbnail image from a video public ID or URL.
 * Automatically captures a representative keyframe and outputs as an optimized JPEG.
 */
export function getVideoThumbnailUrl(
  urlOrPublicId: string,
  options: { width?: number; height?: number; startOffset?: string | number } = {}
): string {
  if (!urlOrPublicId) return "";

  // Switch extension to .jpg for thumbnail capture
  let target = urlOrPublicId;
  if (target.endsWith(".mp4") || target.endsWith(".webm") || target.endsWith(".mov")) {
    target = target.replace(/\.(mp4|webm|mov)$/i, ".jpg");
  }

  return buildCloudinaryUrl(
    target,
    {
      width: options.width || 800,
      height: options.height || 450,
      crop: "fill",
      gravity: "auto",
      startOffset: options.startOffset !== undefined ? options.startOffset : "auto",
      format: "jpg",
      quality: "auto",
    },
    "video"
  );
}

/**
 * Adaptive, high-performance streaming URL for promotional videos (auto codec, auto bitrate).
 */
export function getAdaptiveVideoUrl(
  urlOrPublicId: string,
  options: { width?: number; height?: number } = {}
): string {
  return buildCloudinaryUrl(
    urlOrPublicId,
    {
      width: options.width,
      height: options.height,
      videoCodec: "auto",
      quality: "auto",
      format: "auto",
    },
    "video"
  );
}

