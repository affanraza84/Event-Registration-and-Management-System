import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Event from "@/models/Event";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    await connectToDatabase();

    const event = await Event.findOne({ slug });

    if (!event) {
      return NextResponse.json(
        { error: `Event with slug "${slug}" not found` },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, event }, { status: 200 });
  } catch (error: any) {
    console.error("API GET /api/events/[slug] error:", error);
    return NextResponse.json(
      { error: error.message || "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
