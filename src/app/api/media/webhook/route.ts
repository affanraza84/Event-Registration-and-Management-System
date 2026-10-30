import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import MediaAsset from "@/models/MediaAsset";
import { verifyCloudinaryWebhookSignature } from "@/lib/cloudinary";
import { sanitizeTags } from "@/utils/mediaTagging";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-cld-signature") || "";
    const timestamp = req.headers.get("x-cld-timestamp") || "";

    // Security Verification: validate Cloudinary notification signature
    const isValidSignature = verifyCloudinaryWebhookSignature(
      rawBody,
      timestamp,
      signature
    );

    if (!isValidSignature) {
      console.warn("Cloudinary webhook received with invalid or missing signature.");
      return NextResponse.json(
        { error: "Forbidden: Invalid webhook signature." },
        { status: 401 }
      );
    }

    let payload: Record<string, unknown> = {};
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON webhook payload." },
        { status: 400 }
      );
    }

    const publicId = payload.public_id as string | undefined;
    if (!publicId) {
      return NextResponse.json(
        { message: "Webhook acknowledged; no public_id provided." },
        { status: 200 }
      );
    }

    await connectToDatabase();
    const asset = await MediaAsset.findOne({ publicId });
    if (!asset) {
      console.info(`Webhook received for untracked asset: ${publicId}`);
      return NextResponse.json(
        { message: "Asset not found in EventScout registry." },
        { status: 200 }
      );
    }

    // 1. Process Moderation Notifications
    const notificationType = payload.notification_type as string | undefined;
    const moderationStatus = payload.moderation_status as string | undefined;

    if (
      notificationType === "moderation" ||
      moderationStatus === "approved" ||
      moderationStatus === "rejected"
    ) {
      if (moderationStatus === "approved" || moderationStatus === "rejected") {
        asset.moderationStatus = moderationStatus;
        if (moderationStatus === "rejected") {
          asset.moderationReason =
            (payload.moderation_reason as string) ||
            "Flagged by Cloudinary automated content moderation.";
        } else {
          asset.moderationReason = undefined;
        }
      }
    }

    // 2. Process AI Tagging / Categorization Notifications
    if (payload.categorization || payload.tags) {
      const tags = Array.isArray(payload.tags) ? (payload.tags as string[]) : [];
      if (tags.length > 0) {
        asset.tags = sanitizeTags(tags);
        asset.tagSource = "cloudinary_ai";
      }
    }

    // 3. Update processing status
    asset.processingStatus = "ready";

    await asset.save();

    return NextResponse.json(
      {
        success: true,
        message: "Media asset updated via verified webhook notification.",
        publicId,
        moderationStatus: asset.moderationStatus,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("Cloudinary webhook processing error:", error);
    return NextResponse.json(
      { error: "Internal webhook processing error." },
      { status: 500 }
    );
  }
}

