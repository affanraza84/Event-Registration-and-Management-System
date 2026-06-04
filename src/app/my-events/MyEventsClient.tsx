"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signOut } from "next-auth/react";
import {
  LogOut,
  Calendar,
  Clock,
  MapPin,
  Ticket,
  User,
  Trash2,
  Loader2,
  X,
  AlertTriangle,
  ExternalLink,
} from "lucide-react";
import { cancelRegistrationAction } from "@/actions/events";

interface RegistrationItem {
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
}

interface MyEventsClientProps {
  initialRegistrations: RegistrationItem[];
  session: {
    user: {
      name?: string | null;
      email?: string | null;
      id?: string | null;
      role?: string | null;
    };
  };
}

export default function MyEventsClient({
  initialRegistrations,
  session,
}: MyEventsClientProps) {
  const router = useRouter();
  const [registrations, setRegistrations] =
    useState<RegistrationItem[]>(initialRegistrations);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [selectedRegId, setSelectedRegId] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const openConfirmation = (regId: string) => {
    setSelectedRegId(regId);
    setIsConfirmOpen(true);
    setErrorMsg(null);
  };

  const closeConfirmation = () => {
    setIsConfirmOpen(false);
    setSelectedRegId(null);
  };

  const handleCancelRegistration = async () => {
    if (!selectedRegId) return;

    setIsCancelling(true);
    setErrorMsg(null);

    try {
      const result = await cancelRegistrationAction(selectedRegId);

      if (result.error) {
        setErrorMsg(result.error);
      } else {
        // Remove registration from local state
        setRegistrations((prev) =>
          prev.filter((item) => item.id !== selectedRegId)
        );
        closeConfirmation();
        router.refresh();
      }
    } catch {
      setErrorMsg("Failed to cancel registration. Please try again.");
    } finally {
      setIsCancelling(false);
    }
  };

  const getEventDateString = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getRegisteredDateString = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col relative overflow-hidden">
      {/* Background blobs for premium glow effect */}
      <div className="absolute top-1/4 left-1/3 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-600/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-amber-500/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Header */}
      <header className="border-b border-neutral-900 bg-neutral-900/20 backdrop-blur-md px-6 py-4 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent hover:opacity-90 transition-opacity"
          >
            Luma Events
          </Link>
          <span className="px-2.5 py-0.5 text-xs font-semibold bg-indigo-950/60 text-indigo-300 border border-indigo-900/60 rounded-full flex items-center gap-1">
            <User className="w-3.5 h-3.5" />
            Attendee
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-neutral-350 hidden sm:inline">
            Logged in as <strong>{session.user.name}</strong> ({session.user.email})
          </span>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex items-center gap-2 px-3 py-1.5 bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 hover:border-neutral-700 text-sm font-medium rounded-lg transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-8 max-w-5xl mx-auto w-full z-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-purple-400 via-pink-500 to-amber-400 bg-clip-text text-transparent">
              My Registrations
            </h1>
            <p className="text-neutral-400 mt-2 text-sm">
              Keep track of events you have RSVP&apos;d for and manage your tickets.
            </p>
          </div>
        </div>

        {registrations.length === 0 ? (
          <div className="bg-neutral-900/20 border border-neutral-800/80 rounded-2xl p-12 text-center max-w-lg mx-auto mt-12 space-y-4">
            <div className="inline-flex p-3 bg-neutral-900 border border-neutral-800 rounded-full text-neutral-500">
              <Ticket className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-neutral-350">
              No registered events yet
            </h3>
            <p className="text-neutral-500 text-sm">
              You haven&apos;t registered for any events. Browse the homepage to RSVP for active events!
            </p>
            <Link
              href="/"
              className="inline-flex items-center justify-center px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium rounded-xl transition-all"
            >
              Explore Events
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {registrations.map((reg) => (
              <div
                key={reg.id}
                className="bg-neutral-900/40 border border-neutral-800/80 rounded-2xl p-6 shadow-xl flex flex-col justify-between hover:border-neutral-700/80 transition-all duration-200"
              >
                <div className="space-y-4">
                  {/* Event Title */}
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-extrabold text-lg text-neutral-100 line-clamp-1">
                      {reg.event.title}
                    </h3>
                    <Link
                      href={`/events/${reg.event.slug}`}
                      className="text-purple-400 hover:text-purple-300 shrink-0 inline-flex items-center gap-1 text-xs"
                      title="View Event Details"
                    >
                      Details
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>

                  {/* Date & Time */}
                  <div className="space-y-2 text-sm text-neutral-400">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-purple-400 shrink-0" />
                      <span>{getEventDateString(reg.event.date)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-purple-400 shrink-0" />
                      <span>{reg.event.time}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-purple-400 shrink-0" />
                      <span className="line-clamp-1">{reg.event.location}</span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-neutral-900 mt-6 pt-4 flex items-center justify-between gap-4">
                  <div className="text-xs text-neutral-500">
                    Registered: {getRegisteredDateString(reg.registeredAt)}
                  </div>
                  <button
                    onClick={() => openConfirmation(reg.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-red-950/20 hover:bg-red-950/40 text-red-400 border border-red-900/40 hover:border-red-900/60 rounded-xl transition-all cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Cancel RSVP
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Confirmation Dialog Overlay */}
      {isConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop blur overlay */}
          <div
            className="fixed inset-0 bg-neutral-950/80 backdrop-blur-sm"
            onClick={closeConfirmation}
          />
          {/* Modal Container */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative z-10 space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2 text-red-500">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <h3 className="text-lg font-bold">Cancel Registration</h3>
              </div>
              <button
                onClick={closeConfirmation}
                className="text-neutral-500 hover:text-neutral-400 rounded-full hover:bg-neutral-800 p-1 transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-sm text-neutral-300 leading-relaxed">
              Are you sure you want to cancel your registration for this event? This will release your capacity slot and remove this event from your dashboard. This action cannot be undone.
            </p>

            {errorMsg && (
              <div className="p-3 bg-red-950/40 border border-red-900/50 rounded-xl text-red-400 text-xs font-medium">
                {errorMsg}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={closeConfirmation}
                disabled={isCancelling}
                className="px-4 py-2 border border-neutral-800 hover:border-neutral-700 bg-neutral-900 text-neutral-300 text-sm font-medium rounded-xl transition-all cursor-pointer disabled:opacity-50"
              >
                No, Keep RSVP
              </button>
              <button
                onClick={handleCancelRegistration}
                disabled={isCancelling}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-red-650 hover:bg-red-650/90 text-white text-sm font-medium rounded-xl transition-all cursor-pointer disabled:opacity-50"
              >
                {isCancelling ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Cancelling...
                  </>
                ) : (
                  "Yes, Cancel RSVP"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
