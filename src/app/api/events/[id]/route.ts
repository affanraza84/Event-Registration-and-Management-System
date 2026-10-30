import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Event from "@/models/Event";
import { getClearErrorMessage } from "@/utils/errorMessage";

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
        { error: "The requested event could not be found." },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, event }, { status: 200 });
  } catch (error: unknown) {
    console.error("API GET /api/events/[id] error:", error);
    const errorMessage = getClearErrorMessage(
      error,
      "An unexpected error occurred while fetching the event. Please try again."
    );
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
