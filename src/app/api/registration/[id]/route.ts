import { NextRequest, NextResponse } from "next/server";
import { cancelRegistrationAction } from "@/actions/events";
import { getClearErrorMessage } from "@/utils/errorMessage";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: registrationId } = await params;
    const result = await cancelRegistrationAction(registrationId);

    if (result.error) {
      const status =
        result.error.includes("Unauthorized") ||
        result.error.includes("permission") ||
        result.error.includes("sign in")
          ? 403
          : 400;
      return NextResponse.json({ error: result.error }, { status });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("API DELETE /api/registration/[id] error:", error);
    const message = getClearErrorMessage(
      error,
      "An unexpected error occurred during registration cancellation. Please try again."
    );
    return NextResponse.json(
      {
        error: message,
      },
      { status: 500 }
    );
  }
}
