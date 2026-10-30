import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import Event from "@/models/Event";
import MediaAsset from "@/models/MediaAsset";
import mongoose from "mongoose";
import { getClearErrorMessage } from "@/utils/errorMessage";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const eventId = searchParams.get("eventId");
    const assetType = searchParams.get("assetType");
    const moderationStatus = searchParams.get("moderationStatus");

    await connectToDatabase();
    const session = await getServerSession(authOptions);

    const query: Record<string, unknown> = {};

    if (eventId) {
      if (!mongoose.Types.ObjectId.isValid(eventId)) {
        return NextResponse.json(
          { error: "Invalid event ID format." },
          { status: 400 }
        );
      }

      const event = await Event.findById(eventId);
      if (!event) {
        return NextResponse.json(
          { error: "The requested event could not be found." },
          { status: 404 }
        );
      }

      query.eventId = new mongoose.Types.ObjectId(eventId);

      const isHostOwner =
        session?.user?.role === "host" &&
        session?.user?.id === event.hostId.toString();

      if (isHostOwner) {
        // Host owner can see all moderation statuses, or filter specifically
        if (moderationStatus) {
          query.moderationStatus = moderationStatus;
        }
      } else {
        // Public / non-owner attendee can ONLY view approved and ready media
        query.moderationStatus = "approved";
        query.processingStatus = "ready";
      }
    } else {
      // If no eventId specified, requestor must be authenticated host viewing their own media library
      if (!session || session.user.role !== "host") {
        return NextResponse.json(
          { error: "Unauthorized: You must specify an eventId or be signed in as a host." },
          { status: 401 }
        );
      }

      query.uploadedBy = new mongoose.Types.ObjectId(session.user.id);
      if (moderationStatus) {
        query.moderationStatus = moderationStatus;
      }
    }

    if (assetType) {
      query.assetType = assetType;
    }

    const assets = await MediaAsset.find(query).sort({ createdAt: -1 });

    const serializedAssets = assets.map((a) => ({
      id: a._id.toString(),
      publicId: a.publicId,
      secureUrl: a.secureUrl,
      resourceType: a.resourceType,
      assetType: a.assetType,
      format: a.format,
      eventId: a.eventId.toString(),
      uploadedBy: a.uploadedBy.toString(),
      tags: a.tags,
      tagSource: a.tagSource,
      moderationStatus: a.moderationStatus,
      processingStatus: a.processingStatus,
      moderationReason: a.moderationReason,
      width: a.width,
      height: a.height,
      duration: a.duration,
      bytes: a.bytes,
      createdAt: a.createdAt.toISOString(),
      updatedAt: a.updatedAt.toISOString(),
    }));

    return NextResponse.json(
      {
        success: true,
        count: serializedAssets.length,
        assets: serializedAssets,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("GET /api/media error:", error);
    const message = getClearErrorMessage(
      error,
      "An unexpected error occurred while fetching media assets. Please try again."
    );
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

