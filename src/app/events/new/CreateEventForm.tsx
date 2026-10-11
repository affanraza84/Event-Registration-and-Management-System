"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Sparkles,
  Loader2,
  ArrowLeft,
  CalendarCheck,
  AlertTriangle,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";
import { eventCreationSchema, EventCreationInput } from "@/validations/event";
import { createEventAction } from "@/actions/events";
import Navbar from "@/components/Navbar";

interface CreateEventFormProps {
  initialDraft?: {
    importSource?: string;
    title?: string;
    description?: string;
    location?: string;
    date?: string;
    sourceUrl?: string;
    category?: string;
  };
}

export default function CreateEventForm({ initialDraft }: CreateEventFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);

  const isImportedDraft = initialDraft?.importSource === "discovery";
  const [confirmedByHost, setConfirmedByHost] = useState(!isImportedDraft);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(eventCreationSchema),
    defaultValues: {
      title: initialDraft?.title || "",
      description: initialDraft?.description || "",
      date: initialDraft?.date || "",
      time: "",
      location: initialDraft?.location || "",
      capacity: 50,
      registrationDeadline: "",
      sourceUrl: initialDraft?.sourceUrl || "",
    },
  });

  const onSubmit = async (data: EventCreationInput) => {
    if (isImportedDraft && !confirmedByHost) {
      setGlobalError(
        "Please confirm that you have reviewed the imported details against the original source before publishing."
      );
      return;
    }

    setIsLoading(true);
    setGlobalError(null);

    try {
      const result = await createEventAction(data);

      if (result.error) {
        setGlobalError(result.error);
      } else if (result.success && result.event) {
        router.push(`/events/${result.event.slug}`);
      }
    } catch {
      setGlobalError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-neutral-950 text-neutral-100 flex flex-col">
      <Navbar />

      <div className="relative flex-1 py-12 px-4 flex flex-col items-center justify-center overflow-hidden">
        {/* Ambient glow effects */}
        <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="w-full max-w-2xl z-10">
          {/* Back Navigation */}
          <Link
            href={isImportedDraft ? "/discover" : "/dashboard"}
            className="inline-flex items-center gap-2 text-neutral-400 hover:text-neutral-200 text-sm font-medium mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {isImportedDraft ? "Back to Event Discovery" : "Back to Dashboard"}
          </Link>

          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-purple-400 via-pink-500 to-amber-400 bg-clip-text text-transparent">
              {isImportedDraft ? "Review & Publish Event Draft" : "Create a New Event"}
            </h1>
            <p className="text-neutral-400 mt-2 text-sm">
              {isImportedDraft
                ? "Review, verify, and complete the imported details before publishing to EventScout."
                : "Host a new experience and invite your audience to RSVP."}
            </p>
          </div>

          {/* Unverified Imported Draft Warning Banner */}
          {isImportedDraft && (
            <div
              role="alert"
              className="mb-6 p-4 sm:p-5 bg-amber-950/30 border border-amber-900/60 rounded-2xl text-amber-200 space-y-3 shadow-lg"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 bg-amber-900/50 rounded-lg text-amber-300 shrink-0 mt-0.5">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold uppercase tracking-wider bg-amber-900/60 text-amber-300 px-2 py-0.5 rounded border border-amber-800/80">
                      Unverified Imported Draft
                    </span>
                    {initialDraft?.category && (
                      <span className="text-xs text-amber-400/90 font-medium">
                        Category: {initialDraft.category}
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm font-bold text-amber-100">
                    Details require host verification prior to platform publication
                  </h3>
                  <p className="text-xs text-amber-300/80 leading-relaxed">
                    This draft was prepared from external search results. Snippets may be incomplete, unverified, or subject to change. Please review all fields, set missing dates/capacities, and ensure accuracy.
                  </p>
                </div>
              </div>

              {/* Source attribution link */}
              {initialDraft?.sourceUrl && (
                <div className="pt-2 border-t border-amber-900/40 flex items-center justify-between gap-3 text-xs">
                  <span className="text-amber-400/80 truncate">
                    Source: {initialDraft.sourceUrl}
                  </span>
                  <a
                    href={initialDraft.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-amber-300 hover:text-white font-medium hover:underline shrink-0"
                  >
                    <span>Inspect Original Source</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}
            </div>
          )}

          {/* Glassmorphic Form Card */}
          <div className="bg-neutral-900/40 backdrop-blur-xl border border-neutral-800/80 rounded-2xl p-6 sm:p-8 shadow-2xl">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {globalError && (
                <div className="p-3.5 bg-red-950/40 border border-red-900/50 rounded-lg text-red-400 text-sm font-medium">
                  {globalError}
                </div>
              )}

              {/* Title */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">
                    Event Title
                  </label>
                  {isImportedDraft && (
                    <span className="text-[11px] text-amber-400 flex items-center gap-1 font-medium">
                      <AlertTriangle className="w-3 h-3" />
                      Verify imported title
                    </span>
                  )}
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-500">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    placeholder="e.g. Ranchi AI Dev Meetup 2026"
                    disabled={isLoading}
                    {...register("title")}
                    className={`w-full pl-10 pr-4 py-3 bg-neutral-950/50 border rounded-xl text-neutral-100 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all ${
                      errors.title
                        ? "border-red-900/50 focus:border-red-500"
                        : "border-neutral-800/80 focus:border-purple-500/80"
                    }`}
                  />
                </div>
                {errors.title && (
                  <p className="text-red-400 text-xs mt-1">{errors.title.message}</p>
                )}
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">
                    Description & Source Details
                  </label>
                  {isImportedDraft && (
                    <span className="text-[11px] text-purple-400 font-medium">
                      Editable draft with attribution
                    </span>
                  )}
                </div>
                <textarea
                  placeholder="Give your attendees more details about the event..."
                  disabled={isLoading}
                  rows={5}
                  {...register("description")}
                  className={`w-full px-4 py-3 bg-neutral-950/50 border rounded-xl text-neutral-100 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all resize-none ${
                    errors.description
                      ? "border-red-900/50 focus:border-red-500"
                      : "border-neutral-800/80 focus:border-purple-500/80"
                  }`}
                />
                {errors.description && (
                  <p className="text-red-400 text-xs mt-1">
                    {errors.description.message}
                  </p>
                )}
              </div>

              {/* Date & Time Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">
                      Event Date
                    </label>
                    {isImportedDraft && !initialDraft?.date && (
                      <span className="text-[11px] text-red-400 font-medium">
                        Manual entry required
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-500">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <input
                      type="date"
                      disabled={isLoading}
                      {...register("date")}
                      className={`w-full pl-10 pr-4 py-3 bg-neutral-950/50 border rounded-xl text-neutral-100 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all ${
                        errors.date
                          ? "border-red-900/50 focus:border-red-500"
                          : "border-neutral-800/80 focus:border-purple-500/80"
                      }`}
                    />
                  </div>
                  {errors.date && (
                    <p className="text-red-400 text-xs mt-1">{errors.date.message}</p>
                  )}
                  {isImportedDraft && !initialDraft?.date && (
                    <p className="text-[11px] text-neutral-400">
                      External search did not confirm a date. Select a verified date.
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">
                      Time
                    </label>
                    <span className="text-[11px] text-neutral-400">e.g. 10:00 AM</span>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-500">
                      <Clock className="w-4 h-4" />
                    </div>
                    <input
                      type="time"
                      disabled={isLoading}
                      {...register("time")}
                      className={`w-full pl-10 pr-4 py-3 bg-neutral-950/50 border rounded-xl text-neutral-100 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all ${
                        errors.time
                          ? "border-red-900/50 focus:border-red-500"
                          : "border-neutral-800/80 focus:border-purple-500/80"
                      }`}
                    />
                  </div>
                  {errors.time && (
                    <p className="text-red-400 text-xs mt-1">{errors.time.message}</p>
                  )}
                </div>
              </div>

              {/* Location & Capacity Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">
                      Location / Venue
                    </label>
                    {isImportedDraft && !initialDraft?.location && (
                      <span className="text-[11px] text-amber-400 font-medium">
                        Specify venue
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-500">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      placeholder="e.g. Ranchi, Jharkhand or Online"
                      disabled={isLoading}
                      {...register("location")}
                      className={`w-full pl-10 pr-4 py-3 bg-neutral-950/50 border rounded-xl text-neutral-100 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all ${
                        errors.location
                          ? "border-red-900/50 focus:border-red-500"
                          : "border-neutral-800/80 focus:border-purple-500/80"
                      }`}
                    />
                  </div>
                  {errors.location && (
                    <p className="text-red-400 text-xs mt-1">
                      {errors.location.message}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">
                      Attendee Capacity
                    </label>
                    <span className="text-[11px] text-neutral-400">Strict limit</span>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-500">
                      <Users className="w-4 h-4" />
                    </div>
                    <input
                      type="number"
                      min="1"
                      disabled={isLoading}
                      {...register("capacity")}
                      className={`w-full pl-10 pr-4 py-3 bg-neutral-950/50 border rounded-xl text-neutral-100 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all ${
                        errors.capacity
                          ? "border-red-900/50 focus:border-red-500"
                          : "border-neutral-800/80 focus:border-purple-500/80"
                      }`}
                    />
                  </div>
                  {errors.capacity && (
                    <p className="text-red-400 text-xs mt-1">
                      {errors.capacity.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Registration Deadline */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">
                    Registration Deadline
                  </label>
                  <span className="text-[11px] text-neutral-400">
                    Must be on or before event date
                  </span>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-500">
                    <CalendarCheck className="w-4 h-4" />
                  </div>
                  <input
                    type="date"
                    disabled={isLoading}
                    {...register("registrationDeadline")}
                    className={`w-full pl-10 pr-4 py-3 bg-neutral-950/50 border rounded-xl text-neutral-100 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all ${
                      errors.registrationDeadline
                        ? "border-red-900/50 focus:border-red-500"
                        : "border-neutral-800/80 focus:border-purple-500/80"
                    }`}
                  />
                </div>
                {errors.registrationDeadline && (
                  <p className="text-red-400 text-xs mt-1">
                    {errors.registrationDeadline.message}
                  </p>
                )}
              </div>

              {/* Optional Source Attribution URL (Hidden input or read-only indicator) */}
              <input type="hidden" {...register("sourceUrl")} />

              {/* Host Verification & Confirmation Checkbox for Imported Drafts */}
              {isImportedDraft && (
                <div className="p-4 bg-neutral-950/80 border border-neutral-800 rounded-xl space-y-2">
                  <label className="flex items-start gap-3 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={confirmedByHost}
                      onChange={(e) => setConfirmedByHost(e.target.checked)}
                      className="mt-1 w-4 h-4 text-purple-600 rounded bg-neutral-900 border-neutral-700 focus:ring-purple-500 cursor-pointer"
                    />
                    <span className="text-xs text-neutral-300 leading-relaxed">
                      <strong className="text-neutral-100 block">
                        Host Verification Confirmation
                      </strong>
                      I confirm that I have reviewed the imported details against the original source. I understand that publishing this event will open official RSVP registrations on EventScout.
                    </span>
                  </label>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading || (isImportedDraft && !confirmedByHost)}
                className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-medium rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/40 shadow-lg shadow-purple-950/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 mt-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {isImportedDraft ? "Publishing Event..." : "Creating Event..."}
                  </>
                ) : isImportedDraft ? (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    Review & Publish Event to Platform
                  </>
                ) : (
                  "Create Event"
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
