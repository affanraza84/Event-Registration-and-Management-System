import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import Event from "@/models/Event";
import { getUniqueSlug } from "@/utils/slug";
import { eventCreationSchema } from "@/validations/event";
import mongoose from "mongoose";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "host") {
      return NextResponse.json(
        { error: "Unauthorized: Only hosts can create events" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const validated = eventCreationSchema.safeParse(body);
    if (!validated.success) {
      const errorMessage = validated.error.issues
        .map((err) => err.message)
        .join(", ");
      return NextResponse.json({ error: errorMessage }, { status: 400 });
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
  } catch (error: any) {
    console.error("API POST /api/events error:", error);
    return NextResponse.json(
      { error: error.message || "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
