import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import Event from "@/models/Event";
import { getUniqueSlug } from "@/utils/slug";
import { eventCreationSchema } from "@/validations/event";
import mongoose from "mongoose";
import { getClearErrorMessage, formatValidationErrors } from "@/utils/errorMessage";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "host") {
      return NextResponse.json(
        { error: "Only registered host accounts can create new events." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const validated = eventCreationSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { error: formatValidationErrors(validated.error.issues) },
        { status: 400 }
      );
    }

    const {
      title,
      description,
      date,
      time,
      location,
      capacity,
      registrationDeadline,
    } = validated.data;

    await connectToDatabase();

    const slug = await getUniqueSlug(title);

    const newEvent = await Event.create({
      title,
      slug,
      description,
      date: new Date(date),
      time,
      location,
      capacity,
      registrationDeadline: new Date(registrationDeadline),
      hostId: new mongoose.Types.ObjectId(session.user.id),
      sourceUrl: validated.data.sourceUrl || undefined,
      imageUrl: validated.data.imageUrl || undefined,
      imagePublicId: validated.data.imagePublicId || undefined,
      attendeeCount: 0,
      isClosed: false,
    });

    return NextResponse.json(
      {
        success: true,
        event: {
          id: newEvent._id.toString(),
          slug: newEvent.slug,
          title: newEvent.title,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("API POST /api/events error:", error);
    const message = getClearErrorMessage(
      error,
      "An unexpected error occurred while creating the event. Please try again."
    );
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
