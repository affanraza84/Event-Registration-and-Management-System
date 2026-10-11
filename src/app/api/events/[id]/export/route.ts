import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import Event from "@/models/Event";
import Registration from "@/models/Registration";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "host") {
      return NextResponse.json(
        { error: "Unauthorized: Only hosts can export registration data" },
        { status: 401 }
      );
    }

    const { id: eventId } = await params;

    await connectToDatabase();

    // Check event existence and Host ownership
    const event = await Event.findById(eventId);
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    if (event.hostId.toString() !== session.user.id) {
      return NextResponse.json(
        { error: "Unauthorized: You do not own this event" },
        { status: 403 }
      );
    }

    // Fetch registrations (only select public attendee details: name, email, registration date)
    const registrations = await Registration.find({ eventId: event._id }).sort({
      registeredAt: 1,
    });

    // Format registrations into CSV string with formula injection protection
    const sanitizeCsvCell = (val: string) => {
      let clean = (val || "").replace(/"/g, '""');
      if (/^[=+\-@\t\r]/.test(clean)) {
        clean = `'${clean}`;
      }
      return `"${clean}"`;
    };

    const headers = "Name,Email,Registration Date\n";
    const rows = registrations
      .map((reg) => {
        const escapedName = sanitizeCsvCell(reg.attendeeName);
        const escapedEmail = sanitizeCsvCell(reg.attendeeEmail);
        const formattedDate = sanitizeCsvCell(
          reg.registeredAt.toISOString().split("T")[0]
        );
        return `${escapedName},${escapedEmail},${formattedDate}`;
      })
      .join("\n");

    const csvContent = headers + rows;

    // Return the response as a downloadable file stream
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${event.slug}-attendees.csv"`,
      },
    });
  } catch (error: unknown) {
    console.error("CSV Export API error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unexpected error occurred during CSV export";
    return NextResponse.json(
      {
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}
