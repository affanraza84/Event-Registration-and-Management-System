import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import Event from "@/models/Event";
import MediaAsset from "@/models/MediaAsset";
import {
  isCloudinaryConfigured,
  getMaxUploadSizeBytes,
  getMaxVideoUploadSizeBytes,
  ALLOWED_IMAGE_MIME_TYPES,
  ALLOWED_VIDEO_MIME_TYPES,
  validateImageMagicBytes,
  validateVideoMagicBytes,
  uploadMediaBuffer,
} from "@/lib/cloudinary";
import { extractMediaTags } from "@/utils/mediaTagging";
import { getClearErrorMessage } from "@/utils/errorMessage";
import mongoose from "mongoose";

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate requesting host
    const session = await getServerSession(authOptions);
    if (!session || !session.user || session.user.role !== "host") {
      return NextResponse.json(
        { error: "Unauthorized: Only event hosts can upload media assets." },
        { status: 401 }
      );
    }

    // 2. Check Cloudinary configuration
    if (!isCloudinaryConfigured()) {
      return NextResponse.json(
        {
          error:
            "Cloudinary service is not configured. Please ensure your Cloudinary credentials are set in environment variables.",
        },
        { status: 503 }
      );
    }

    // 3. Parse multipart/form-data
    let formData: FormData;
    try {
      formData = await req.formData();
    } catch {
      return NextResponse.json(
        { error: "Invalid form data submission." },
        { status: 400 }
      );
    }

    const eventId = formData.get("eventId") as string | null;
    const requestedAssetType = (formData.get("assetType") as string) || "gallery";
    const validAssetTypes = ["poster", "banner", "gallery", "promo_video"];
    const assetType = validAssetTypes.includes(requestedAssetType)
      ? (requestedAssetType as "poster" | "banner" | "gallery" | "promo_video")
      : "gallery";

    if (!eventId || !mongoose.Types.ObjectId.isValid(eventId)) {
      return NextResponse.json(
        { error: "A valid eventId is required to associate media uploads." },
        { status: 400 }
      );
    }

    // 4. Verify host owns this event
    await connectToDatabase();
    const event = await Event.findById(eventId);
    if (!event) {
      return NextResponse.json(
        { error: "The requested event could not be found." },
        { status: 404 }
      );
    }

    if (event.hostId.toString() !== session.user.id) {
      return NextResponse.json(
        { error: "Forbidden: You do not have permission to upload media for this event." },
        { status: 403 }
      );
    }

    // 5. Collect files (supports both 'files' array and single 'file')
    const files = formData.getAll("files") as File[];
    const singleFile = formData.get("file") as File | null;
    const allFiles = files.length > 0 ? files : singleFile ? [singleFile] : [];

    if (allFiles.length === 0) {
      return NextResponse.json(
        { error: "Please select at least one image or video file to upload." },
        { status: 400 }
      );
    }

    const maxImageBytes = getMaxUploadSizeBytes();
    const maxVideoBytes = getMaxVideoUploadSizeBytes();
    const createdAssets = [];

    // 6. Process and upload each file
    for (const file of allFiles) {
      if (!(file instanceof File)) continue;

      const isImage = (ALLOWED_IMAGE_MIME_TYPES as readonly string[]).includes(file.type);
      const isVideo = (ALLOWED_VIDEO_MIME_TYPES as readonly string[]).includes(file.type);

      if (!isImage && !isVideo) {
        return NextResponse.json(
          {
            error: `Unsupported file format for "${file.name}". Supported formats: JPEG, PNG, WebP, GIF, MP4, WebM, and MOV.`,
          },
          { status: 400 }
        );
      }

      const maxBytes = isVideo ? maxVideoBytes : maxImageBytes;
      if (file.size > maxBytes) {
        const limitMb = (maxBytes / (1024 * 1024)).toFixed(0);
        return NextResponse.json(
          {
            error: `File "${file.name}" exceeds the maximum allowed size of ${limitMb}MB.`,
          },
          { status: 400 }
        );
      }

      // Read buffer & check magic bytes
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      if (isImage) {
        const check = validateImageMagicBytes(buffer);
        if (!check.isValid) {
          return NextResponse.json(
            {
              error: `Corrupt or invalid image signature detected in "${file.name}".`,
            },
            { status: 400 }
          );
        }
      } else {
        const check = validateVideoMagicBytes(buffer);
        if (!check.isValid) {
          return NextResponse.json(
            {
              error: `Corrupt or invalid video signature detected in "${file.name}".`,
            },
            { status: 400 }
          );
        }
      }

      // Determine asset folder and upload to Cloudinary
      const folder = `eventscout/events/${eventId}`;
      const uploadResult = await uploadMediaBuffer(buffer, {
        folder,
        resourceType: isVideo ? "video" : "image",
        tags: ["eventscout", `event_${eventId}`, `host_${session.user.id}`],
      });

      // Extract AI tags or domain taxonomy fallback
      const taggingResult = extractMediaTags(uploadResult.tags, {
        title: event.title,
        description: event.description,
        assetType,
      });

      // Determine initial moderation status
      let initialModerationStatus: "pending" | "approved" | "rejected" = "approved";
      let moderationReason: string | undefined = undefined;

      if (uploadResult.moderation && uploadResult.moderation.length > 0) {
        const primaryModeration = uploadResult.moderation[0];
        if (primaryModeration.status === "rejected") {
          initialModerationStatus = "rejected";
          moderationReason = "Flagged by automated visual content moderation.";
        } else if (primaryModeration.status === "pending") {
          initialModerationStatus = "pending";
        }
      }

      // Save record in MongoDB
      const newAsset = await MediaAsset.create({
        publicId: uploadResult.publicId,
        secureUrl: uploadResult.secureUrl,
        resourceType: uploadResult.resourceType,
        assetType: isVideo ? "promo_video" : assetType,
        format: uploadResult.format,
        eventId: event._id,
        uploadedBy: new mongoose.Types.ObjectId(session.user.id),
        tags: taggingResult.tags,
        tagSource: taggingResult.tagSource,
        moderationStatus: initialModerationStatus,
        processingStatus: "ready",
        moderationReason,
        width: uploadResult.width,
        height: uploadResult.height,
        duration: uploadResult.duration,
        bytes: uploadResult.bytes,
      });

      // If uploading a poster and event has no poster yet, set as primary cover
      if (assetType === "poster" && !event.imageUrl) {
        event.imageUrl = uploadResult.secureUrl;
        event.imagePublicId = uploadResult.publicId;
        await event.save();
      }

      createdAssets.push({
        id: newAsset._id.toString(),
        publicId: newAsset.publicId,
        secureUrl: newAsset.secureUrl,
        resourceType: newAsset.resourceType,
        assetType: newAsset.assetType,
        format: newAsset.format,
        eventId: eventId,
        uploadedBy: session.user.id,
        tags: newAsset.tags,
        tagSource: newAsset.tagSource,
        moderationStatus: newAsset.moderationStatus,
        processingStatus: newAsset.processingStatus,
        width: newAsset.width,
        height: newAsset.height,
        duration: newAsset.duration,
        bytes: newAsset.bytes,
        createdAt: newAsset.createdAt.toISOString(),
      });
    }

    return NextResponse.json(
      {
        success: true,
        count: createdAssets.length,
        assets: createdAssets,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("POST /api/media/upload error:", error);
    const message = getClearErrorMessage(
      error,
      "An unexpected error occurred during media upload. Please try again."
    );
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

