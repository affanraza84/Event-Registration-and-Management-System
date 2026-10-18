import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import Registration from "@/models/Registration";
import { IEventDocument } from "@/models/Event";
import MyEventsClient from "./MyEventsClient";

export const metadata = {
  title: "My Registrations | EventScout",
  description: "Manage your registered event tickets and community RSVPs.",
};

export default async function MyEventsPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login?callbackUrl=/my-events");
  }

  if (session.user.role !== "attendee") {
    redirect("/dashboard");
  }

  let serializedRegistrations: Array<{
    id: string;
    registeredAt: string;
    attendeeName: string;
    attendeeEmail: string;
    event: {
      id: string;
      title: string;
      slug: string;
      date: string;
      time: string;
      location: string;
    };
  }> = [];

  try {
    await connectToDatabase();

    const registrations = await Registration.find({
      attendeeId: session.user.id,
    })
      .populate("eventId")
      .sort({ registeredAt: -1 });

    serializedRegistrations = registrations
      .map((reg) => {
        const event = reg.eventId as unknown as IEventDocument;

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
  } catch (error) {
    console.error("Failed to load attendee registrations:", error);
  }

  return (
    <MyEventsClient
      initialRegistrations={serializedRegistrations}
      session={session}
    />
  );
}
