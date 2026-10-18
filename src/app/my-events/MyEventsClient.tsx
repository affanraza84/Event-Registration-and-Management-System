"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Calendar,
  Clock,
  MapPin,
  Ticket,
  Trash2,
  Loader2,
  X,
  AlertTriangle,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import { cancelRegistrationAction } from "@/actions/events";
import Navbar from "@/components/Navbar";
import { getEventCover } from "@/lib/eventCovers";

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
    imageUrl?: string;
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
    <div className="min-h-screen bg-[#FAF9F6] text-[#171923] flex flex-col">
      <Navbar />

      <main className="flex-1 p-6 sm:p-10 max-w-6xl mx-auto w-full animate-fade-in">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 pb-6 border-b border-[#E8E5DF]">
          <div>
            <span className="text-xs font-semibold text-[#5146E5] uppercase tracking-wider">
              Attendee Hub
            </span>
            <h1 className="text-3xl font-bold tracking-tight text-[#171923] mt-1">
              My Registrations
            </h1>
            <p className="text-[#686D78] mt-1 text-sm">
              Keep track of events you have RSVP&apos;d for, review details, or manage your tickets.
            </p>
          </div>
          <Link
            href="/discover"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#5146E5] hover:bg-[#4338CA] text-white text-xs font-semibold rounded-xl shadow-xs transition-colors shrink-0"
          >
            <span>Discover More Events</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {registrations.length === 0 ? (
          <div className="bg-white border border-[#E8E5DF] rounded-2xl p-12 text-center max-w-lg mx-auto mt-8 space-y-4 shadow-xs">
            <div className="w-12 h-12 rounded-2xl bg-[#EEEAFE] text-[#5146E5] flex items-center justify-center mx-auto">
              <Ticket className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-[#171923]">
                No active registrations yet
              </h3>
              <p className="text-[#686D78] text-sm max-w-sm mx-auto">
                You haven&apos;t registered for any events yet. Browse our curated gatherings and reserve your first ticket!
              </p>
            </div>
            <div className="pt-2">
              <Link
                href="/discover"
                className="inline-flex items-center justify-center px-5 py-2.5 bg-[#5146E5] hover:bg-[#4338CA] text-white text-sm font-medium rounded-xl transition-all shadow-xs"
              >
                Explore Events
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {registrations.map((reg) => {
              const cover = getEventCover(reg.event.title, undefined, reg.event.id, reg.event.imageUrl);
              return (
                <div
                  key={reg.id}
                  className="bg-white border border-[#E8E5DF] hover:border-[#D5D1C8] rounded-2xl overflow-hidden shadow-xs hover:shadow-[0_8px_30px_rgba(23,25,35,0.06)] flex flex-col justify-between transition-all duration-200 group"
                >
                  <div>
                    {/* Cover Banner */}
                    <div className="relative aspect-[21/9] w-full overflow-hidden bg-[#FAF9F6]">
                      <img
                        src={cover.url}
                        alt={cover.alt}
                        className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                        loading="lazy"
                      />
                      <div className="absolute top-3 left-3">
                        <span className="text-[11px] font-semibold bg-white/95 text-[#059669] border border-[#A7F3D0] px-2.5 py-0.5 rounded-md shadow-2xs backdrop-blur-sm">
                          Confirmed RSVP
                        </span>
                      </div>
                      <div className="absolute top-3 right-3">
                        <Link
                          href={`/events/${reg.event.slug}`}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold bg-white/95 text-[#171923] hover:text-[#5146E5] border border-[#E8E5DF] px-2.5 py-0.5 rounded-md shadow-2xs backdrop-blur-sm transition-colors"
                        >
                          <span>Event Page</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>

                    {/* Event Body */}
                    <div className="p-5 space-y-3">
                      <h3 className="font-bold text-lg text-[#171923] group-hover:text-[#5146E5] transition-colors line-clamp-1">
                        <Link href={`/events/${reg.event.slug}`}>
                          {reg.event.title}
                        </Link>
                      </h3>

                      <div className="space-y-1.5 text-xs text-[#686D78]">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-[#5146E5] shrink-0" />
                          <span>{getEventDateString(reg.event.date)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-[#5146E5] shrink-0" />
                          <span>{reg.event.time}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-[#5146E5] shrink-0" />
                          <span className="line-clamp-1">{reg.event.location}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="px-5 py-3.5 bg-[#FAF9F6] border-t border-[#E8E5DF] flex items-center justify-between gap-4">
                    <div className="text-[11px] text-[#686D78]">
                      Registered: {getRegisteredDateString(reg.registeredAt)}
                    </div>
                    <button
                      onClick={() => openConfirmation(reg.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#DC2626] hover:bg-[#FEF2F2] border border-[#FECACA] rounded-xl transition-all cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Cancel RSVP</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Confirmation Dialog Overlay */}
      {isConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#171923]/50 backdrop-blur-xs animate-fade-in">
          <div className="bg-white border border-[#E8E5DF] rounded-2xl max-w-md w-full p-6 shadow-[0_20px_50px_rgba(23,25,35,0.15)] relative space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2 text-[#DC2626]">
                <div className="p-2 bg-[#FEE2E2] rounded-xl text-[#DC2626]">
                  <AlertTriangle className="w-5 h-5 shrink-0" />
                </div>
                <h3 className="text-base font-bold text-[#171923]">Cancel Registration</h3>
              </div>
              <button
                onClick={closeConfirmation}
                className="text-[#686D78] hover:text-[#171923] rounded-lg p-1 transition-all cursor-pointer hover:bg-[#FAF9F6]"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-sm text-[#686D78] leading-relaxed">
              Are you sure you want to cancel your registration? This will release your capacity slot for others and remove this ticket from your dashboard.
            </p>

            {errorMsg && (
              <div className="p-3 bg-[#FEF2F2] border border-[#FECACA] rounded-xl text-[#DC2626] text-xs font-medium">
                {errorMsg}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={closeConfirmation}
                disabled={isCancelling}
                className="px-4 py-2 border border-[#E8E5DF] hover:border-[#D5D1C8] bg-white text-[#171923] text-xs font-semibold rounded-xl transition-all cursor-pointer disabled:opacity-50 shadow-2xs"
              >
                Keep RSVP
              </button>
              <button
                onClick={handleCancelRegistration}
                disabled={isCancelling}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-semibold rounded-xl transition-all cursor-pointer disabled:opacity-50 shadow-xs"
              >
                {isCancelling ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Cancelling...</span>
                  </>
                ) : (
                  "Yes, Cancel Registration"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
