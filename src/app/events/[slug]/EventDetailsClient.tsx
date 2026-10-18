"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Loader2,
  Ticket,
  Lock,
  Mail,
  User,
  ShieldAlert,
  ExternalLink,
  Globe,
  Compass,
  ShieldCheck,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { registerForEventAction } from "@/actions/events";
import Navbar from "@/components/Navbar";
import { getEventCover } from "@/lib/eventCovers";

interface EventDetailsClientProps {
  event: {
    id: string;
    title: string;
    slug: string;
    description: string;
    date: string;
    time: string;
    location: string;
    capacity: number;
    registrationDeadline: string;
    isClosed: boolean;
    sourceUrl?: string;
  };
  initialIsRegistered: boolean;
  initialAttendeeCount: number;
  session: {
    user?: {
      name?: string | null;
      email?: string | null;
      id?: string | null;
      role?: string | null;
    } | null;
  } | null;
}

export default function EventDetailsClient({
  event,
  initialIsRegistered,
  initialAttendeeCount,
  session,
}: EventDetailsClientProps) {
  const router = useRouter();
  const [isRegistered, setIsRegistered] = useState(initialIsRegistered);
  const [attendeeCount, setAttendeeCount] = useState(initialAttendeeCount);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Parse Dates
  const eventDate = new Date(event.date);
  const deadlineDate = new Date(event.registrationDeadline);
  const formattedEventDate = eventDate.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const formattedDeadlineDate = deadlineDate.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Calculate live limits
  const deadlineEnd = new Date(
    deadlineDate.getFullYear(),
    deadlineDate.getMonth(),
    deadlineDate.getDate(),
    23,
    59,
    59
  );
  const isDeadlinePassed = new Date() > deadlineEnd;
  const isCapacityFull = attendeeCount >= event.capacity;
  const isHost = session?.user?.role === "host";
  const isAttendee = session?.user?.role === "attendee";
  const spotsLeft = Math.max(0, event.capacity - attendeeCount);
  const capacityPercent = Math.min(
    100,
    Math.round((attendeeCount / event.capacity) * 100)
  );

  const cover = getEventCover(event.title, undefined, event.id);

  // Form setup
  const { register, handleSubmit } = useForm({
    defaultValues: {
      name: session?.user?.name || "",
      email: session?.user?.email || "",
      password: "",
    },
  });

  const onSubmit = async (data: {
    name?: string;
    email?: string;
    password?: string;
  }) => {
    setIsSubmitting(true);
    setGlobalError(null);

    try {
      const result = await registerForEventAction({
        eventId: event.id,
        name: (isAttendee ? session?.user?.name : data.name) || "",
        email: (isAttendee ? session?.user?.email : data.email) || "",
        password: isAttendee ? undefined : data.password,
      });

      if (result.error) {
        setGlobalError(result.error);
        setIsSubmitting(false);
        return;
      }

      setAttendeeCount((prev) => prev + 1);
      setIsRegistered(true);
      setSuccessMsg(
        isAttendee
          ? "RSVP confirmed! You are registered for this event."
          : "RSVP confirmed! An attendee account has been created and you are registered."
      );

      if (!isAttendee && data.email && data.password) {
        await signIn("credentials", {
          email: data.email,
          password: data.password,
          role: "attendee",
          redirect: false,
        });
      }

      router.refresh();
    } catch {
      setGlobalError("An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#171923] flex flex-col">
      <Navbar />

      <main className="flex-1 py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        {/* Navigation Breadcrumb */}
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-[#686D78] hover:text-[#171923] text-sm font-medium transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Gatherings</span>
          </Link>
        </div>

        {/* Hero Cover Banner */}
        <div className="rounded-2xl overflow-hidden border border-[#E8E5DF] bg-white shadow-xs mb-8 relative aspect-[21/9] sm:aspect-[24/9]">
          <img
            src={cover.url}
            alt={cover.alt}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#171923]/80 via-[#171923]/30 to-transparent" />
          <div className="absolute bottom-6 left-6 right-6 text-white flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div className="space-y-2 max-w-3xl">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold uppercase tracking-wider bg-white/20 backdrop-blur-md text-white border border-white/20">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Verified Gathering
                </span>
                {event.sourceUrl && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-black/40 backdrop-blur-md text-white/90 border border-white/10">
                    <Compass className="w-3.5 h-3.5 text-[#EEEAFE]" />
                    Web Discovery
                  </span>
                )}
              </div>
              <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-white drop-shadow-xs">
                {event.title}
              </h1>
            </div>

            <div className="shrink-0">
              <span
                className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-semibold shadow-xs ${
                  isCapacityFull || isDeadlinePassed
                    ? "bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA]"
                    : "bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]"
                }`}
              >
                {isCapacityFull
                  ? "Capacity Reached"
                  : isDeadlinePassed
                  ? "Registration Closed"
                  : "Registration Active"}
              </span>
            </div>
          </div>
        </div>

        {/* Two-Column Grid: Details & Registration Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Event Metadata & Description (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            {/* Quick Metadata Bar */}
            <div className="bg-white border border-[#E8E5DF] rounded-2xl p-5 shadow-xs grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-[#EEEAFE] text-[#5146E5] shrink-0">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-[#686D78]">
                    Date
                  </div>
                  <div className="text-sm font-semibold text-[#171923] mt-0.5">
                    {formattedEventDate}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-[#EEEAFE] text-[#5146E5] shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-[#686D78]">
                    Time
                  </div>
                  <div className="text-sm font-semibold text-[#171923] mt-0.5">
                    {event.time}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-[#EEEAFE] text-[#5146E5] shrink-0">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-[#686D78]">
                    Location
                  </div>
                  <div className="text-sm font-semibold text-[#171923] mt-0.5 line-clamp-2">
                    {event.location}
                  </div>
                </div>
              </div>
            </div>

            {/* Source Attribution Callout */}
            {event.sourceUrl && (
              <div className="bg-white border border-[#E8E5DF] rounded-2xl p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-[#686D78]">
                <div className="flex items-center gap-2 truncate">
                  <Globe className="w-4 h-4 text-[#5146E5] shrink-0" />
                  <span className="truncate">
                    Original Source: <span className="font-mono text-[#171923]">{event.sourceUrl}</span>
                  </span>
                </div>
                <a
                  href={event.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-semibold text-[#5146E5] hover:text-[#4338CA] shrink-0"
                >
                  <span>View Source Website</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            )}

            {/* Description Section */}
            <div className="bg-white border border-[#E8E5DF] rounded-2xl p-6 sm:p-8 shadow-xs space-y-4">
              <h2 className="text-xl font-bold tracking-tight text-[#171923]">
                About This Experience
              </h2>
              <div className="text-[#686D78] leading-relaxed whitespace-pre-wrap text-base font-normal">
                {event.description}
              </div>
            </div>
          </div>

          {/* Right Column: RSVP Registration Panel (4 cols) */}
          <div className="lg:col-span-4 sticky top-24 space-y-6">
            <div className="bg-white border border-[#E8E5DF] rounded-2xl p-6 shadow-[0_4px_20px_rgba(23,25,35,0.06)] space-y-6">
              {/* Capacity & Progress */}
              <div className="space-y-3 pb-4 border-b border-[#E8E5DF]">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#686D78] font-medium flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-[#5146E5]" />
                    Registration Capacity
                  </span>
                  <span className="font-bold text-[#171923]">
                    {attendeeCount} / {event.capacity}
                  </span>
                </div>

                <div className="w-full bg-[#FAF9F6] border border-[#E8E5DF] rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-[#5146E5] h-2 rounded-full transition-all duration-300"
                    style={{ width: `${capacityPercent}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-xs text-[#686D78]">
                  <span>
                    {isCapacityFull ? (
                      <strong className="text-[#DC2626]">At capacity</strong>
                    ) : (
                      <>
                        <strong className="text-[#171923]">{spotsLeft}</strong> spots remaining
                      </>
                    )}
                  </span>
                  <span>Deadline: {formattedDeadlineDate}</span>
                </div>
              </div>

              {/* Status / RSVP Logic */}
              {successMsg ? (
                <div className="space-y-4">
                  <div className="p-4 bg-[#ECFDF5] border border-[#A7F3D0] rounded-xl text-[#059669] text-sm flex items-start gap-2.5 font-medium leading-relaxed">
                    <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
                    <span>{successMsg}</span>
                  </div>
                  <Link
                    href="/my-events"
                    className="w-full flex items-center justify-center gap-2 py-3 bg-[#5146E5] hover:bg-[#4338CA] text-white font-medium rounded-xl transition-all shadow-xs"
                  >
                    <Ticket className="w-4 h-4" />
                    View My Tickets
                  </Link>
                </div>
              ) : isRegistered ? (
                <div className="space-y-4">
                  <div className="p-4 bg-[#EEEAFE] border border-[#DDD6FE] rounded-xl text-[#5146E5] text-sm flex items-center justify-center gap-2 font-medium">
                    <CheckCircle2 className="w-4 h-4" />
                    You are confirmed for this event
                  </div>
                  <Link
                    href="/my-events"
                    className="w-full flex items-center justify-center gap-2 py-3 bg-white hover:bg-[#FAF9F6] border border-[#E8E5DF] text-[#171923] font-medium rounded-xl transition-all shadow-xs"
                  >
                    <Ticket className="w-4 h-4 text-[#5146E5]" />
                    Manage Registration
                  </Link>
                </div>
              ) : isDeadlinePassed ? (
                <div className="p-4 bg-[#FEF2F2] border border-[#FECACA] rounded-xl text-[#DC2626] text-sm text-center font-medium">
                  Registration Closed: RSVP deadline has passed.
                </div>
              ) : isCapacityFull ? (
                <div className="p-4 bg-[#FEF2F2] border border-[#FECACA] rounded-xl text-[#DC2626] text-sm text-center font-medium">
                  Registration Closed: All spots have been reserved.
                </div>
              ) : isHost ? (
                <div className="p-4 bg-[#FFFBEB] border border-[#FDE68A] rounded-xl text-[#92400E] text-xs flex items-start gap-2.5">
                  <ShieldAlert className="w-4 h-4 text-[#D97706] shrink-0 mt-0.5" />
                  <span>
                    You are logged in with a Host account. Event hosts cannot RSVP to gatherings. Log in as an attendee to reserve a spot.
                  </span>
                </div>
              ) : (
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <h3 className="font-bold text-sm uppercase tracking-wider text-[#171923]">
                    Reserve Your Seat
                  </h3>

                  {globalError && (
                    <div className="p-3 bg-[#FEF2F2] border border-[#FECACA] rounded-xl text-[#DC2626] text-xs flex items-center gap-2 font-medium">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{globalError}</span>
                    </div>
                  )}

                  {isAttendee ? (
                    <div className="space-y-3">
                      <p className="text-xs text-[#686D78]">
                        Registering as <strong className="text-[#171923]">{session?.user?.name}</strong> ({session?.user?.email}).
                      </p>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full flex items-center justify-center gap-2 py-3 bg-[#5146E5] hover:bg-[#4338CA] text-white font-medium rounded-xl transition-all shadow-xs cursor-pointer disabled:opacity-50 active:scale-[0.99]"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Confirming RSVP...</span>
                          </>
                        ) : (
                          <>
                            <Ticket className="w-4 h-4" />
                            <span>Confirm RSVP</span>
                          </>
                        )}
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3.5">
                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-[#686D78] uppercase tracking-wider">
                          Full Name
                        </label>
                        <div className="relative">
                          <User className="w-4 h-4 text-[#686D78] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                          <input
                            type="text"
                            placeholder="Your full name"
                            required
                            disabled={isSubmitting}
                            {...register("name")}
                            className="w-full pl-9 pr-3 py-2 bg-[#FAF9F6] border border-[#E8E5DF] focus:border-[#5146E5] focus:bg-white rounded-xl text-sm text-[#171923] placeholder-[#9CA3AF] focus:outline-none transition-all"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-[#686D78] uppercase tracking-wider">
                          Email Address
                        </label>
                        <div className="relative">
                          <Mail className="w-4 h-4 text-[#686D78] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                          <input
                            type="email"
                            placeholder="name@example.com"
                            required
                            disabled={isSubmitting}
                            {...register("email")}
                            className="w-full pl-9 pr-3 py-2 bg-[#FAF9F6] border border-[#E8E5DF] focus:border-[#5146E5] focus:bg-white rounded-xl text-sm text-[#171923] placeholder-[#9CA3AF] focus:outline-none transition-all"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-[#686D78] uppercase tracking-wider">
                          Create Password
                        </label>
                        <div className="relative">
                          <Lock className="w-4 h-4 text-[#686D78] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                          <input
                            type="password"
                            placeholder="At least 6 characters"
                            required
                            disabled={isSubmitting}
                            {...register("password")}
                            className="w-full pl-9 pr-3 py-2 bg-[#FAF9F6] border border-[#E8E5DF] focus:border-[#5146E5] focus:bg-white rounded-xl text-sm text-[#171923] placeholder-[#9CA3AF] focus:outline-none transition-all"
                          />
                        </div>
                        <p className="text-[10px] text-[#686D78]">
                          We will set up an attendee account so you can manage your ticket.
                        </p>
                      </div>

                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full flex items-center justify-center gap-2 py-3 bg-[#5146E5] hover:bg-[#4338CA] text-white font-medium rounded-xl transition-all shadow-xs cursor-pointer disabled:opacity-50 active:scale-[0.99] mt-2"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Processing Registration...</span>
                          </>
                        ) : (
                          <>
                            <Ticket className="w-4 h-4" />
                            <span>Register & RSVP</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </form>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
