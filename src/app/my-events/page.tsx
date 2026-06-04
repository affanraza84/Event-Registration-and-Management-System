import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import Registration from "@/models/Registration";
import { IEventDocument } from "@/models/Event";
import MyEventsClient from "./MyEventsClient";

export const metadata = {
  title: "My Events | Luma",
  description: "Manage your registered event tickets and RSVPs.",
};

export default async function MyEventsPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login?callbackUrl=/my-events");
  }

  if (session.user.role !== "attendee") {
    // If a host navigates here, redirect them to the host dashboard
    redirect("/dashboard");
  }

  await connectToDatabase();

  // Find all registrations for this attendee and populate the event info
  const registrations = await Registration.find({
    attendeeId: session.user.id,
  })
    .populate("eventId")
    .sort({ registeredAt: -1 });

  // Map to simple JSON structure for Client Component
  const serializedRegistrations = registrations
    .map((reg) => {
      const event = reg.eventId as unknown as IEventDocument; // Cast as populated mongoose object

      if (!event) return null;

      return {
        id: reg._id.toString(),
        registeredAt: reg.registeredAt.toISOString(),
        attendeeName: reg.attendeeName,
        attendeeEmail: reg.attendeeEmail,
        event: {
          id: event._id.toString(),
          title: event.title,
          slug: event.slug,
          date: event.date.toISOString(),
          time: event.time,
          location: event.location,
        },
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  return (
    <MyEventsClient
      initialRegistrations={serializedRegistrations}
      session={session}
    />
  );
}
