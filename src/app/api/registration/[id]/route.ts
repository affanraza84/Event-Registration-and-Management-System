import { NextRequest, NextResponse } from "next/server";
import { cancelRegistrationAction } from "@/actions/events";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: registrationId } = await params;
    const result = await cancelRegistrationAction(registrationId);

    if (result.error) {
      const status = result.error.includes("Unauthorized") ? 403 : 400;
      return NextResponse.json({ error: result.error }, { status });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error("API DELETE /api/registration/[id] error:", error);
    return NextResponse.json(
      {
        error:
          error.message ||
          "An unexpected error occurred during registration cancellation",
      },
      { status: 500 }
    );
  }
}
