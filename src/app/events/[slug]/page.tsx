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
}

export default async function EventPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  await connectToDatabase();

  const event = await Event.findOne({ slug });

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
