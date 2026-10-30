import { getServerSession } from "next-auth/next";
import { notFound } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import Event from "@/models/Event";
import Registration from "@/models/Registration";
import MediaAsset from "@/models/MediaAsset";
import { getSocialShareUrl } from "@/lib/mediaTransformations";
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
        title: "Event Not Found | EventScout",
      };
    }

    const ogImage = event.imageUrl ? getSocialShareUrl(event.imageUrl) : undefined;

    return {
      title: `${event.title} | EventScout`,
      description: event.description.substring(0, 160),
      openGraph: ogImage
        ? {
            title: event.title,
            description: event.description.substring(0, 160),
            images: [{ url: ogImage, width: 1200, height: 630 }],
          }
        : undefined,
      twitter: ogImage
        ? {
            card: "summary_large_image",
            title: event.title,
            description: event.description.substring(0, 160),
            images: [ogImage],
          }
        : undefined,
    };
  } catch {
    return {
      title: "Event Details | EventScout",
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

  const isHost =
    session?.user?.role === "host" && session?.user?.id === event.hostId.toString();

  const mediaQuery: Record<string, unknown> = { eventId: event._id };
  if (!isHost) {
    mediaQuery.moderationStatus = "approved";
    mediaQuery.processingStatus = "ready";
  }

  const rawMedia = await MediaAsset.find(mediaQuery).sort({ createdAt: -1 });
  const serializedMedia = rawMedia.map((a) => ({
    id: a._id.toString(),
    publicId: a.publicId,
    secureUrl: a.secureUrl,
    resourceType: a.resourceType,
    assetType: a.assetType,
    format: a.format,
    eventId: a.eventId.toString(),
    uploadedBy: a.uploadedBy.toString(),
    tags: a.tags,
    tagSource: a.tagSource,
    moderationStatus: a.moderationStatus,
    processingStatus: a.processingStatus,
    moderationReason: a.moderationReason,
    width: a.width,
    height: a.height,
    duration: a.duration,
    bytes: a.bytes,
    createdAt: a.createdAt.toISOString(),
  }));

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
    sourceUrl: event.sourceUrl || undefined,
    imageUrl: event.imageUrl || undefined,
    imagePublicId: event.imagePublicId || undefined,
  };

  return (
    <EventDetailsClient
      event={serializedEvent}
      initialIsRegistered={isRegistered}
      initialAttendeeCount={event.attendeeCount}
      initialMediaAssets={serializedMedia}
      session={session}
    />
  );
}
