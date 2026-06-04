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
} from "lucide-react";
import { registerForEventAction } from "@/actions/events";

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

  // Form setup
  const {
    register,
    handleSubmit,
  } = useForm({
    defaultValues: {
      name: session?.user?.name || "",
      email: session?.user?.email || "",
      password: "",
    },
  });

  const onSubmit = async (data: { name?: string; email?: string; password?: string }) => {
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

      // Success
      setAttendeeCount((prev) => prev + 1);
      setIsRegistered(true);
      setSuccessMsg(
        isAttendee
          ? "RSVP Successful! You have been registered for this event."
          : "RSVP Successful! An attendee account has been created and you are registered."
      );

      // If a new attendee account was created, auto-log them in so their dashboard updates
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
    <div className="relative min-h-screen bg-neutral-950 text-neutral-100 py-12 px-4">
      {/* Background blobs for premium glow effect */}
      <div className="absolute top-1/4 left-1/3 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-5xl mx-auto z-10 relative">
        {/* Header */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-neutral-400 hover:text-neutral-200 text-sm font-medium mb-8 transition-colors"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          Back to Events
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Left / Center Details (2 Columns) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="space-y-4">
              <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-purple-400 via-pink-500 to-amber-400 bg-clip-text text-transparent">
                {event.title}
              </h1>
              <div className="flex flex-wrap gap-4 text-neutral-400 text-sm">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-purple-400" />
                  {formattedEventDate}
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-purple-400" />
                  {event.time}
                </div>
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-purple-400" />
                  {event.location}
                </div>
              </div>
            </div>

            <div className="border-t border-neutral-900 pt-6">
              <h2 className="text-xl font-bold text-neutral-200 mb-3">
                About this Event
              </h2>
              <p className="text-neutral-300 leading-relaxed whitespace-pre-wrap">
                {event.description}
              </p>
            </div>
          </div>

          {/* Right RSVP Card (1 Column) */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-neutral-900/40 backdrop-blur-xl border border-neutral-800/80 rounded-2xl p-6 shadow-2xl space-y-6">
              {/* Attendee Counter */}
              <div className="flex items-center justify-between pb-4 border-b border-neutral-900">
                <div className="flex items-center gap-2 text-neutral-300">
                  <Users className="w-5 h-5 text-indigo-400" />
                  <span className="font-medium">Attendees</span>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-neutral-100">
                    {attendeeCount}
                  </div>
                  <div className="text-xs text-neutral-500">
                    of {event.capacity} spots filled
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-neutral-950 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-purple-500 to-indigo-500 h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.min(
                      (attendeeCount / event.capacity) * 100,
                      100
                    )}%`,
                  }}
                />
              </div>

              {/* Deadline Indicator */}
              <div className="text-xs text-neutral-400 flex items-center justify-between">
                <span>RSVP Deadline:</span>
                <span className="font-semibold text-neutral-200">
                  {formattedDeadlineDate}
                </span>
              </div>

              {/* RSVP Form Logic */}
              {successMsg ? (
                <div className="space-y-4 pt-2">
                  <div className="p-4 bg-emerald-950/40 border border-emerald-900/50 rounded-xl text-emerald-400 text-sm font-medium leading-relaxed">
                    {successMsg}
                  </div>
                  <Link
                    href="/my-events"
                    className="w-full flex items-center justify-center gap-2 py-3 bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 hover:border-neutral-700 text-white font-medium rounded-xl transition-all"
                  >
                    Go to My Events
                  </Link>
                </div>
              ) : isRegistered ? (
                <div className="space-y-4 pt-2">
                  <div className="p-4 bg-purple-950/30 border border-purple-900/40 rounded-xl text-purple-300 text-sm text-center font-medium">
                    ✨ You are registered for this event!
                  </div>
                  <Link
                    href="/my-events"
                    className="w-full flex items-center justify-center gap-2 py-3 bg-neutral-900 hover:bg-neutral-850 border border-neutral-850 hover:border-neutral-750 text-white font-medium rounded-xl transition-all"
                  >
                    View My Tickets
                  </Link>
                </div>
              ) : isDeadlinePassed ? (
                <div className="p-4 bg-red-950/30 border border-red-900/40 rounded-xl text-red-400 text-sm text-center font-medium">
                  🚫 Registration Closed: The deadline has passed.
                </div>
              ) : isCapacityFull ? (
                <div className="p-4 bg-red-950/30 border border-red-900/40 rounded-xl text-red-400 text-sm text-center font-medium">
                  🚫 Registration Closed: Event capacity reached.
                </div>
              ) : isHost ? (
                <div className="p-4 bg-neutral-950/80 border border-neutral-800 rounded-xl text-neutral-400 text-xs flex items-start gap-2">
                  <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <span>
                    You are logged in as a Host. Hosts cannot register for
                    events. Please log in as an Attendee.
                  </span>
                </div>
              ) : (
                /* Registration Inputs */
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <h3 className="font-bold text-neutral-200 text-sm uppercase tracking-wider">
                    RSVP to Event
                  </h3>

                  {globalError && (
                    <div className="p-3 bg-red-950/40 border border-red-900/50 rounded-lg text-red-400 text-xs font-medium">
                      {globalError}
                    </div>
                  )}

                  {isAttendee ? (
                    /* Simple RSVP confirmation for logged-in attendee */
                    <div className="space-y-3 pt-2">
                      <p className="text-neutral-400 text-xs">
                        You are logged in as <strong>{session?.user?.name}</strong>.
                      </p>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-medium rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/40 shadow-lg disabled:opacity-50 transition-all"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Confirming...
                          </>
                        ) : (
                          <>
                            <Ticket className="w-4 h-4" />
                            Confirm RSVP
                          </>
                        )}
                      </button>
                    </div>
                  ) : (
                    /* Account creation fields for guests */
                    <div className="space-y-4">
                      {/* Name */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">
                          Full Name
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-500">
                            <User className="w-3.5 h-3.5" />
                          </div>
                          <input
                            type="text"
                            placeholder="John Doe"
                            required
                            disabled={isSubmitting}
                            {...register("name")}
                            className="w-full pl-9 pr-3 py-2 bg-neutral-950/50 border border-neutral-800 rounded-xl text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-purple-500/80 transition-all"
                          />
                        </div>
                      </div>

                      {/* Email */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">
                          Email Address
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-500">
                            <Mail className="w-3.5 h-3.5" />
                          </div>
                          <input
                            type="email"
                            placeholder="john@example.com"
                            required
                            disabled={isSubmitting}
                            {...register("email")}
                            className="w-full pl-9 pr-3 py-2 bg-neutral-950/50 border border-neutral-800 rounded-xl text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-purple-500/80 transition-all"
                          />
                        </div>
                      </div>

                      {/* Password */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">
                          Password
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-500">
                            <Lock className="w-3.5 h-3.5" />
                          </div>
                          <input
                            type="password"
                            placeholder="••••••••"
                            required
                            disabled={isSubmitting}
                            {...register("password")}
                            className="w-full pl-9 pr-3 py-2 bg-neutral-950/50 border border-neutral-800 rounded-xl text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-purple-500/80 transition-all"
                          />
                        </div>
                        <p className="text-[9px] text-neutral-500">
                          We will create an account for you if you don&apos;t have one.
                        </p>
                      </div>

                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-medium rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/40 shadow-lg disabled:opacity-50 transition-all pt-2"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Registering...
                          </>
                        ) : (
                          <>
                            <Ticket className="w-4 h-4" />
                            Register & RSVP
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
      </div>
    </div>
  );
}

function ArrowLeftIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2}
      stroke="currentColor"
      {...props}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
      />
    </svg>
  );
}
