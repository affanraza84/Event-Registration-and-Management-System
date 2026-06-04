import { NextRequest, NextResponse } from "next/server";
import { registerForEventAction } from "@/actions/events";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await params;
    const body = await req.json();

    if (!body?.email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    const result = await registerForEventAction({
      eventId,
      name: body.name,
      email: body.email,
      password: body.password,
    });

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, ...result }, { status: 201 });
  } catch (error: any) {
    console.error("API POST /api/events/[id]/register error:", error);
    return NextResponse.json(
      { error: error.message || "An unexpected error occurred during registration" },
      { status: 500 }
    );
  }
}
