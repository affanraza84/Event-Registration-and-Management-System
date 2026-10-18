/**
 * Generates an optimized Cloudinary delivery URL with f_auto, q_auto and optional dimensions.
 * Pure utility function that is completely safe for both client and server bundles (no Node.js dependencies).
 */
export function getOptimizedCloudinaryUrl(
  urlOrPublicId: string,
  options: {
    width?: number;
    height?: number;
    crop?: "fill" | "scale" | "fit" | "thumb";
    gravity?: string;
  } = {}
): string {
  if (!urlOrPublicId) return "";

  // If this is not a Cloudinary URL, return as-is
  if (!urlOrPublicId.includes("res.cloudinary.com")) {
    return urlOrPublicId;
  }

  // Insert transformations right after /upload/
  const uploadIndex = urlOrPublicId.indexOf("/upload/");
  if (uploadIndex === -1) {
    return urlOrPublicId;
  }

  const parts = ["f_auto", "q_auto"];

  if (options.width) parts.push(`w_${options.width}`);
  if (options.height) parts.push(`h_${options.height}`);
  if (options.crop) parts.push(`c_${options.crop}`);
  if (options.gravity) parts.push(`g_${options.gravity}`);

  const transformString = parts.join(",");
  const prefix = urlOrPublicId.substring(0, uploadIndex + 8);
  const rest = urlOrPublicId.substring(uploadIndex + 8);

  // If already has transformation parameters right after /upload/, avoid duplicate
  if (/^[a-z]_[a-z0-9_,-]+\//i.test(rest)) {
    return urlOrPublicId;
  }

  return `${prefix}${transformString}/${rest}`;
}
