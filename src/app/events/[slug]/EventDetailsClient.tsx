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
  Share2,
  Sparkles,
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
    imageUrl?: string;
    imagePublicId?: string;
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
  const [copiedLink, setCopiedLink] = useState(false);

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
    month: "short",
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
    Math.round((attendeeCount / Math.max(1, event.capacity)) * 100)
  );

  const cover = getEventCover(event.title, undefined, event.id, event.imageUrl);

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

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#171923] flex flex-col selection:bg-[#EEEAFE] selection:text-[#5146E5]">
      <Navbar />

      <main className="flex-1 py-8 sm:py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        {/* Navigation Breadcrumb & Action Toolbar */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <Link
            href="/#featured"
            className="inline-flex items-center gap-2 text-[#686D78] hover:text-[#171923] text-sm font-semibold transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Gatherings</span>
          </Link>

          <button
            onClick={handleCopyLink}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-[#E8E5DF] hover:border-[#5146E5] text-xs font-semibold text-[#171923] hover:text-[#5146E5] transition-all cursor-pointer shadow-2xs"
            aria-label="Share event link"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>{copiedLink ? "Link Copied!" : "Share Event"}</span>
          </button>
        </div>

        {/* Hero Cover Banner */}
        <div className="rounded-3xl overflow-hidden border border-[#E8E5DF] bg-white shadow-[0_12px_40px_rgba(23,25,35,0.08)] mb-8 relative aspect-[16/9] md:aspect-[24/9] group">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={cover.url}
            alt={cover.alt}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-103"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#171923]/90 via-[#171923]/40 to-transparent" />
          
          <div className="absolute bottom-6 left-6 right-6 text-white flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div className="space-y-2.5 max-w-3xl">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-white/20 backdrop-blur-md text-white border border-white/30 shadow-xs">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#A7F3D0]" />
                  Verified Gathering
                </span>

                {event.sourceUrl && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-black/50 backdrop-blur-md text-white/90 border border-white/20">
                    <Compass className="w-3.5 h-3.5 text-[#DDD6FE]" />
                    Live Web Discovery
                  </span>
                )}
              </div>

              <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white drop-shadow-sm leading-tight">
                {event.title}
              </h1>
            </div>

            <div className="shrink-0">
              <span
                className={`inline-flex items-center px-4 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider shadow-md backdrop-blur-md ${
                  event.isClosed
                    ? "bg-[#171923]/80 text-[#9CA3AF] border border-white/20"
                    : isCapacityFull || isDeadlinePassed
                    ? "bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA]"
                    : "bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]"
                }`}
              >
                {event.isClosed
                  ? "Host Closed"
                  : isCapacityFull
                  ? "Capacity Reached"
                  : isDeadlinePassed
                  ? "RSVP Closed"
                  : "RSVP Open"}
              </span>
            </div>
          </div>
        </div>

        {/* Two-Column Layout: Event Information & Sticky Registration Card */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Details & Agenda (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            {/* Metadata Highlights Bar */}
            <div className="bg-white border border-[#E8E5DF] rounded-3xl p-6 shadow-xs grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="flex items-start gap-3.5">
                <div className="p-3 rounded-2xl bg-[#EEEAFE] text-[#5146E5] shrink-0">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-[#686D78]">
                    Date
                  </div>
                  <div className="text-sm font-bold text-[#171923] mt-0.5 leading-snug">
                    {formattedEventDate}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="p-3 rounded-2xl bg-[#EEEAFE] text-[#5146E5] shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-[#686D78]">
                    Time
                  </div>
                  <div className="text-sm font-bold text-[#171923] mt-0.5">
                    {event.time}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="p-3 rounded-2xl bg-[#EEEAFE] text-[#5146E5] shrink-0">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-[#686D78]">
                    Location
                  </div>
                  <div className="text-sm font-bold text-[#171923] mt-0.5 line-clamp-2">
                    {event.location}
                  </div>
                </div>
              </div>
            </div>

            {/* Source Attribution Callout (for imported discoveries) */}
            {event.sourceUrl && (
              <div className="bg-white border border-[#E8E5DF] rounded-2xl p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-[#686D78]">
                <div className="flex items-center gap-2 truncate">
                  <Globe className="w-4 h-4 text-[#5146E5] shrink-0" />
                  <span className="truncate">
                    Discovered via web search:{" "}
                    <span className="font-mono text-[#171923]">{event.sourceUrl}</span>
                  </span>
                </div>
                <a
                  href={event.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-bold text-[#5146E5] hover:text-[#4338CA] shrink-0"
                >
                  <span>Verify Original Page</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            )}

            {/* Event Description Section */}
            <div className="bg-white border border-[#E8E5DF] rounded-3xl p-6 sm:p-8 shadow-xs space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-5 rounded-full bg-[#5146E5]" />
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#171923]">
                  About This Experience
                </h2>
              </div>
              <div className="text-[#4A4F5C] leading-relaxed whitespace-pre-wrap text-base font-normal pt-1">
                {event.description}
              </div>
            </div>

            {/* What to expect / Community Trust note */}
            <div className="bg-[#FAF9F6] border border-[#E8E5DF] rounded-3xl p-6 sm:p-8 space-y-4">
              <h3 className="text-base font-bold text-[#171923] flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#5146E5]" />
                <span>What to Expect at EventScout Gatherings</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-[#686D78]">
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#059669] shrink-0 mt-0.5" />
                  <span>Immediate confirmation email and access pass in your dashboard.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#059669] shrink-0 mt-0.5" />
                  <span>Verified venue instructions and live schedule updates from the organizer.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#059669] shrink-0 mt-0.5" />
                  <span>Direct contact channels and ticket cancellation should your plans change.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#059669] shrink-0 mt-0.5" />
                  <span>Strict attendee limits to prevent venue overcrowding.</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Sticky RSVP Registration Panel (4 cols) */}
          <div className="lg:col-span-4 sticky top-24 space-y-6">
            <div className="bg-white border border-[#E8E5DF] rounded-3xl p-6 sm:p-7 shadow-[0_8px_30px_rgba(23,25,35,0.07)] space-y-6">
              {/* Capacity & Progress Meter */}
              <div className="space-y-3 pb-5 border-b border-[#E8E5DF]">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#686D78] font-semibold flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-[#5146E5]" />
                    <span>RSVP Capacity</span>
                  </span>
                  <span className="font-extrabold text-[#171923]">
                    {attendeeCount} / {event.capacity}
                  </span>
                </div>

                <div className="w-full bg-[#FAF9F6] border border-[#E8E5DF] rounded-full h-2.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isCapacityFull
                        ? "bg-[#DC2626]"
                        : capacityPercent > 80
                        ? "bg-[#D97706]"
                        : "bg-[#5146E5]"
                    }`}
                    style={{ width: `${capacityPercent}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-xs text-[#686D78]">
                  <span>
                    {isCapacityFull ? (
                      <strong className="text-[#DC2626] font-bold">100% Full</strong>
                    ) : (
                      <>
                        <strong className="text-[#171923] font-bold">{spotsLeft}</strong> spots left
                      </>
                    )}
                  </span>
                  <span>RSVP by {formattedDeadlineDate}</span>
                </div>
              </div>

              {/* Status & RSVP Logic */}
              {successMsg ? (
                <div className="space-y-4">
                  <div className="p-4 bg-[#ECFDF5] border border-[#A7F3D0] rounded-2xl text-[#059669] text-sm flex items-start gap-2.5 font-semibold leading-relaxed">
                    <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-[#059669]" />
                    <span>{successMsg}</span>
                  </div>
                  <Link
                    href="/my-events"
                    className="w-full flex items-center justify-center gap-2 py-3.5 bg-[#5146E5] hover:bg-[#4338CA] text-white font-semibold rounded-2xl transition-all shadow-xs active:scale-[0.99]"
                  >
                    <Ticket className="w-4 h-4" />
                    <span>View My Registrations</span>
                  </Link>
                </div>
              ) : isRegistered ? (
                <div className="space-y-4">
                  <div className="p-4 bg-[#EEEAFE] border border-[#DDD6FE] rounded-2xl text-[#5146E5] text-sm flex items-center justify-center gap-2 font-semibold">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>You are registered for this event</span>
                  </div>
                  <Link
                    href="/my-events"
                    className="w-full flex items-center justify-center gap-2 py-3.5 bg-white hover:bg-[#FAF9F6] border border-[#E8E5DF] hover:border-[#D5D1C8] text-[#171923] font-semibold rounded-2xl transition-all shadow-xs active:scale-[0.99]"
                  >
                    <Ticket className="w-4 h-4 text-[#5146E5]" />
                    <span>Manage My Ticket</span>
                  </Link>
                </div>
              ) : event.isClosed ? (
                <div className="p-4 bg-[#F3F4F6] border border-[#E5E7EB] rounded-2xl text-[#4B5563] text-sm text-center font-medium">
                  The host has closed registrations for this event.
                </div>
              ) : isDeadlinePassed ? (
                <div className="p-4 bg-[#FEF2F2] border border-[#FECACA] rounded-2xl text-[#DC2626] text-sm text-center font-semibold">
                  Registration Closed: RSVP deadline has passed.
                </div>
              ) : isCapacityFull ? (
                <div className="p-4 bg-[#FEF2F2] border border-[#FECACA] rounded-2xl text-[#DC2626] text-sm text-center font-semibold">
                  Registration Full: All seats have been claimed.
                </div>
              ) : isHost ? (
                <div className="p-4 bg-[#FFFBEB] border border-[#FDE68A] rounded-2xl text-[#92400E] text-xs flex items-start gap-2.5">
                  <ShieldAlert className="w-4 h-4 text-[#D97706] shrink-0 mt-0.5" />
                  <span>
                    You are currently logged in with a Host account. Event hosts cannot RSVP to gatherings. Switch to an attendee account to reserve a seat.
                  </span>
                </div>
              ) : (
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-sm uppercase tracking-wider text-[#171923]">
                      Reserve Your Spot
                    </h3>
                    <span className="text-[11px] font-semibold text-[#059669] bg-[#ECFDF5] px-2 py-0.5 rounded-md">
                      Free RSVP
                    </span>
                  </div>

                  {globalError && (
                    <div
                      role="alert"
                      className="p-3 bg-[#FEF2F2] border border-[#FECACA] rounded-xl text-[#DC2626] text-xs flex items-center gap-2 font-medium"
                    >
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{globalError}</span>
                    </div>
                  )}

                  {isAttendee ? (
                    <div className="space-y-3">
                      <div className="p-3 bg-[#FAF9F6] border border-[#E8E5DF] rounded-xl text-xs text-[#686D78]">
                        Confirming RSVP for{" "}
                        <strong className="text-[#171923]">{session?.user?.name}</strong> (
                        {session?.user?.email}).
                      </div>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full flex items-center justify-center gap-2 py-3.5 bg-[#5146E5] hover:bg-[#4338CA] text-white font-semibold rounded-2xl transition-all shadow-xs cursor-pointer disabled:opacity-50 active:scale-[0.99]"
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
                        <label className="text-[11px] font-bold text-[#686D78] uppercase tracking-wider">
                          Full Name
                        </label>
                        <div className="relative">
                          <User className="w-4 h-4 text-[#686D78] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                          <input
                            type="text"
                            placeholder="Your full name"
                            required
                            disabled={isSubmitting}
                            {...register("name")}
                            className="w-full pl-10 pr-3.5 py-2.5 bg-[#FAF9F6] border border-[#E8E5DF] focus:border-[#5146E5] focus:bg-white rounded-xl text-sm text-[#171923] placeholder-[#9CA3AF] focus:outline-none transition-all"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-[#686D78] uppercase tracking-wider">
                          Email Address
                        </label>
                        <div className="relative">
                          <Mail className="w-4 h-4 text-[#686D78] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                          <input
                            type="email"
                            placeholder="name@example.com"
                            required
                            disabled={isSubmitting}
                            {...register("email")}
                            className="w-full pl-10 pr-3.5 py-2.5 bg-[#FAF9F6] border border-[#E8E5DF] focus:border-[#5146E5] focus:bg-white rounded-xl text-sm text-[#171923] placeholder-[#9CA3AF] focus:outline-none transition-all"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-[#686D78] uppercase tracking-wider">
                          Password
                        </label>
                        <div className="relative">
                          <Lock className="w-4 h-4 text-[#686D78] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                          <input
                            type="password"
                            placeholder="Create password"
                            required
                            disabled={isSubmitting}
                            {...register("password")}
                            className="w-full pl-10 pr-3.5 py-2.5 bg-[#FAF9F6] border border-[#E8E5DF] focus:border-[#5146E5] focus:bg-white rounded-xl text-sm text-[#171923] placeholder-[#9CA3AF] focus:outline-none transition-all"
                          />
                        </div>
                        <p className="text-[10px] text-[#686D78]">
                          We&apos;ll create an attendee account so you can manage your ticket.
                        </p>
                      </div>

                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full flex items-center justify-center gap-2 py-3.5 bg-[#5146E5] hover:bg-[#4338CA] text-white font-semibold rounded-2xl transition-all shadow-xs cursor-pointer disabled:opacity-50 active:scale-[0.99] mt-2"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Processing RSVP...</span>
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
