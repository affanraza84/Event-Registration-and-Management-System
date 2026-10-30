import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import Event from "@/models/Event";
import MediaAsset from "@/models/MediaAsset";
import { deleteCloudinaryAsset } from "@/lib/cloudinary";
import { sanitizeTags } from "@/utils/mediaTagging";
import { getClearErrorMessage } from "@/utils/errorMessage";
import mongoose from "mongoose";

/**
 * PATCH /api/media/[id]
 * Updates media asset metadata (tags, assetType, moderation status).
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: assetId } = await params;

    const session = await getServerSession(authOptions);
    if (!session || !session.user || session.user.role !== "host") {
      return NextResponse.json(
        { error: "Unauthorized: Only event hosts can modify media assets." },
        { status: 401 }
      );
    }

    if (!mongoose.Types.ObjectId.isValid(assetId)) {
      return NextResponse.json(
        { error: "Invalid media asset ID format." },
        { status: 400 }
      );
    }

    await connectToDatabase();
    const asset = await MediaAsset.findById(assetId);
    if (!asset) {
      return NextResponse.json(
        { error: "The requested media asset could not be found." },
        { status: 404 }
      );
    }

    // Verify ownership: user must be the uploader or the host of the event
    const event = await Event.findById(asset.eventId);
    const isOwner =
      asset.uploadedBy.toString() === session.user.id ||
      (event && event.hostId.toString() === session.user.id);

    if (!isOwner) {
      return NextResponse.json(
        { error: "Forbidden: You do not have permission to modify this media asset." },
        { status: 403 }
      );
    }

    const body = await req.json();

    // 1. Update tags if provided
    if (Array.isArray(body.tags)) {
      asset.tags = sanitizeTags(body.tags);
      asset.tagSource = "manual";
    }

    // 2. Update assetType if provided
    const validAssetTypes = ["poster", "banner", "gallery", "promo_video"];
    if (body.assetType && validAssetTypes.includes(body.assetType)) {
      asset.assetType = body.assetType;

      // If designated as poster, update event's cover image
      if (body.assetType === "poster" && event) {
        event.imageUrl = asset.secureUrl;
        event.imagePublicId = asset.publicId;
        await event.save();
      }
    }

    // 3. Update moderation status if provided
    const validModerationStatuses = ["pending", "approved", "rejected"];
    if (
      body.moderationStatus &&
      validModerationStatuses.includes(body.moderationStatus)
    ) {
      asset.moderationStatus = body.moderationStatus;
      if (body.moderationReason) {
        asset.moderationReason = String(body.moderationReason);
      }
    }

    await asset.save();

    return NextResponse.json({
      success: true,
      asset: {
        id: asset._id.toString(),
        publicId: asset.publicId,
        secureUrl: asset.secureUrl,
        resourceType: asset.resourceType,
        assetType: asset.assetType,
        format: asset.format,
        eventId: asset.eventId.toString(),
        uploadedBy: asset.uploadedBy.toString(),
        tags: asset.tags,
        tagSource: asset.tagSource,
        moderationStatus: asset.moderationStatus,
        processingStatus: asset.processingStatus,
        moderationReason: asset.moderationReason,
        width: asset.width,
        height: asset.height,
        duration: asset.duration,
        bytes: asset.bytes,
        updatedAt: asset.updatedAt.toISOString(),
      },
    });
  } catch (error: unknown) {
    console.error("PATCH /api/media/[id] error:", error);
    const message = getClearErrorMessage(
      error,
      "An unexpected error occurred while updating the media asset. Please try again."
    );
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * DELETE /api/media/[id]
 * Deletes media asset from Cloudinary and removes database record with ownership verification.
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: assetId } = await params;

    const session = await getServerSession(authOptions);
    if (!session || !session.user || session.user.role !== "host") {
      return NextResponse.json(
        { error: "Unauthorized: Only event hosts can delete media assets." },
        { status: 401 }
      );
    }

    if (!mongoose.Types.ObjectId.isValid(assetId)) {
      return NextResponse.json(
        { error: "Invalid media asset ID format." },
        { status: 400 }
      );
    }

    await connectToDatabase();
    const asset = await MediaAsset.findById(assetId);
    if (!asset) {
      return NextResponse.json(
        { error: "The requested media asset could not be found." },
        { status: 404 }
      );
    }

    // Verify ownership: user must be the uploader or the host of the event
    const event = await Event.findById(asset.eventId);
    const isOwner =
      asset.uploadedBy.toString() === session.user.id ||
      (event && event.hostId.toString() === session.user.id);

    if (!isOwner) {
      return NextResponse.json(
        { error: "Forbidden: You do not have permission to delete this media asset." },
        { status: 403 }
      );
    }

    // 1. Delete from Cloudinary
    await deleteCloudinaryAsset(asset.publicId, asset.resourceType);

    // 2. If this asset was the primary event poster, clear event's imageUrl / imagePublicId
    if (event && event.imagePublicId === asset.publicId) {
      event.imageUrl = undefined;
      event.imagePublicId = undefined;
      await event.save();
    }

    // 3. Delete record from MongoDB
    await MediaAsset.findByIdAndDelete(assetId);

    return NextResponse.json({
      success: true,
      message: "Media asset successfully deleted.",
    });
  } catch (error: unknown) {
    console.error("DELETE /api/media/[id] error:", error);
    const message = getClearErrorMessage(
      error,
      "An unexpected error occurred while deleting the media asset. Please try again."
    );
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

