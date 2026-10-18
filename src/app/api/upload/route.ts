import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import Event from "@/models/Event";
import {
  isCloudinaryConfigured,
  getMaxUploadSizeBytes,
  ALLOWED_IMAGE_MIME_TYPES,
  validateImageMagicBytes,
  uploadImageBuffer,
  deleteCloudinaryAsset,
} from "@/lib/cloudinary";

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate requesting user
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized: You must be signed in to upload images" },
        { status: 401 }
      );
    }

    // 2. Verify Cloudinary credentials configuration
    if (!isCloudinaryConfigured()) {
      return NextResponse.json(
        {
          error:
            "Cloudinary service is not configured. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in your environment variables.",
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
        { error: "Invalid form data submission" },
        { status: 400 }
      );
    }

    const file = formData.get("file");
    const uploadType = (formData.get("type") as string) || "event";
    const eventId = formData.get("eventId") as string | null;
    const previousPublicId = formData.get("previousPublicId") as string | null;

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: "No file was provided for upload" },
        { status: 400 }
      );
    }

    // 4. Role and authorization checks
    if (uploadType === "event") {
      if (session.user.role !== "host") {
        return NextResponse.json(
          { error: "Forbidden: Only hosts can upload event posters" },
          { status: 403 }
        );
      }

      // If an existing eventId was provided, verify host owns this event
      if (eventId) {
        await connectToDatabase();
        const existingEvent = await Event.findById(eventId);
        if (!existingEvent) {
          return NextResponse.json(
            { error: "Event not found" },
            { status: 404 }
          );
        }
        if (existingEvent.hostId.toString() !== session.user.id) {
          return NextResponse.json(
            { error: "Forbidden: You do not own this event" },
            { status: 403 }
          );
        }
      }
    } else if (uploadType === "profile") {
      // Any authenticated user can upload their own profile avatar
    } else {
      return NextResponse.json(
        { error: "Invalid upload type. Must be 'event' or 'profile'." },
        { status: 400 }
      );
    }

    // 5. Enforce upload size limit
    const maxSizeBytes = getMaxUploadSizeBytes();
    if (file.size > maxSizeBytes) {
      const limitMb = (maxSizeBytes / (1024 * 1024)).toFixed(1);
      return NextResponse.json(
        {
          error: `File size exceeds the maximum limit of ${limitMb}MB. Please choose a smaller image.`,
        },
        { status: 400 }
      );
    }

    // 6. Validate MIME type
    if (!ALLOWED_IMAGE_MIME_TYPES.includes(file.type as unknown as (typeof ALLOWED_IMAGE_MIME_TYPES)[number])) {
      return NextResponse.json(
        {
          error:
            "Unsupported file format. Only JPEG, PNG, WebP, and GIF images are accepted.",
        },
        { status: 400 }
      );
    }

    // 7. Validate binary magic bytes to prevent masqueraded files
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const magicCheck = validateImageMagicBytes(buffer);

    if (!magicCheck.isValid) {
      return NextResponse.json(
        {
          error:
            "Corrupt or invalid image file. Binary signature did not match a valid image format.",
        },
        { status: 400 }
      );
    }

    // 8. Determine target folder
    const folder =
      uploadType === "profile" ? "eventscout/profiles" : "eventscout/events";

    // 9. Upload securely to Cloudinary using signed upload stream
    const uploadResult = await uploadImageBuffer(buffer, {
      folder,
      tags: ["eventscout", uploadType, `user_${session.user.id}`],
    });

    // 10. Clean up previous asset if provided and valid
    if (previousPublicId && previousPublicId.startsWith("eventscout/")) {
      try {
        await deleteCloudinaryAsset(previousPublicId);
      } catch (err) {
        console.warn("Failed to clean up replaced Cloudinary asset:", err);
      }
    }

    return NextResponse.json(
      {
        success: true,
        url: uploadResult.secureUrl,
        secureUrl: uploadResult.secureUrl,
        publicId: uploadResult.publicId,
        width: uploadResult.width,
        height: uploadResult.height,
        format: uploadResult.format,
        bytes: uploadResult.bytes,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("API POST /api/upload error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unexpected error occurred during image upload";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized: You must be signed in to delete images" },
        { status: 401 }
      );
    }

    if (!isCloudinaryConfigured()) {
      return NextResponse.json(
        { error: "Cloudinary service is not configured" },
        { status: 503 }
      );
    }

    const body = await req.json();
    const { publicId } = body;

    if (!publicId || typeof publicId !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid publicId" },
        { status: 400 }
      );
    }

    // Security check: Only allow deleting assets inside eventscout/ folders
    if (!publicId.startsWith("eventscout/")) {
      return NextResponse.json(
        { error: "Forbidden: Cannot delete assets outside EventScout" },
        { status: 403 }
      );
    }

    const deleteResult = await deleteCloudinaryAsset(publicId);

    return NextResponse.json({
      success: deleteResult.success,
      result: deleteResult.result,
    });
  } catch (error: unknown) {
    console.error("API DELETE /api/upload error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unexpected error occurred during asset removal";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
