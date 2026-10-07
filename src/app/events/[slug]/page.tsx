import { getServerSession } from "next-auth/next";
import { notFound } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import Event from "@/models/Event";
import Registration from "@/models/Registration";
import EventDetailsClient from "./EventDetailsClient";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  try {
    const { slug } = await params;
    await connectToDatabase();
    const event = await Event.findOne({ slug });

    if (!event) {
      return {
        title: "Event Not Found | Luma",
      };
    }

    return {
      title: `${event.title} | Luma`,
      description: event.description.substring(0, 160),
    };
  } catch {
    return {
      title: "Event Details | Luma",
    };
  }
}

export default async function EventPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  let event = null;

  try {
    await connectToDatabase();
    event = await Event.findOne({ slug });
  } catch (error) {
    console.error("Database connection error on event page:", error);
    return (
      <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-2xl font-bold mb-3 text-red-400">Unable to load event</h2>
        <p className="text-neutral-400 max-w-md mb-6">
          There was an issue connecting to the database. Please check back shortly or try reloading.
        </p>
        <a
          href={`/events/${slug}`}
          className="px-5 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl text-sm font-medium transition-all"
        >
          Try Again
        </a>
      </div>
    );
  }

  if (!event) {
    notFound();
  }

  const session = await getServerSession(authOptions);
  let isRegistered = false;

  if (session && session.user.role === "attendee") {
    const reg = await Registration.findOne({
      eventId: event._id,
      attendeeId: session.user.id,
    });
    isRegistered = !!reg;
  }

  const serializedEvent = {
    id: event._id.toString(),
    title: event.title,
    slug: event.slug,
    description: event.description,
    date: event.date.toISOString().split("T")[0],
    time: event.time,
    location: event.location,
    capacity: event.capacity,
    registrationDeadline: event.registrationDeadline.toISOString().split("T")[0],
    isClosed: event.isClosed,
  };

  return (
    <EventDetailsClient
      event={serializedEvent}
      initialIsRegistered={isRegistered}
      initialAttendeeCount={event.attendeeCount}
      session={session}
    />
  );
}
