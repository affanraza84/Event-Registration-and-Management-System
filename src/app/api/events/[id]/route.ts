import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Event from "@/models/Event";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await connectToDatabase();

    // The client queries this using the event slug in the URL
    const event = await Event.findOne({ slug: id });

    if (!event) {
      return NextResponse.json(
        { error: `Event with slug "${id}" not found` },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, event }, { status: 200 });
  } catch (error: unknown) {
    console.error("API GET /api/events/[id] error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unexpected error occurred";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
