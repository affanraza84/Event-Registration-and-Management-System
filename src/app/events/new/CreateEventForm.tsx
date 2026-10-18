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
  AlertCircle,
} from "lucide-react";
import { eventCreationSchema, EventCreationInput } from "@/validations/event";
import { createEventAction } from "@/actions/events";
import Navbar from "@/components/Navbar";
import ImageUpload from "@/components/ImageUpload";

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
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [posterUrl, setPosterUrl] = useState("");
  const [posterPublicId, setPosterPublicId] = useState("");
  const [globalError, setGlobalError] = useState<string | null>(null);

  const isImportedDraft = initialDraft?.importSource === "discovery";
  const [confirmedByHost, setConfirmedByHost] = useState(!isImportedDraft);

  const {
    register,
    handleSubmit,
    setValue,
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
      imageUrl: "",
      imagePublicId: "",
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
    <div className="min-h-screen bg-[#FAF9F6] text-[#171923] flex flex-col">
      <Navbar />

      <main className="flex-1 py-10 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto w-full animate-fade-in">
        {/* Back Link */}
        <div className="mb-6">
          <Link
            href={isImportedDraft ? "/discover" : "/dashboard"}
            className="inline-flex items-center gap-1.5 text-[#686D78] hover:text-[#171923] text-xs font-medium transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{isImportedDraft ? "Back to Event Discovery" : "Back to Host Workspace"}</span>
          </Link>
        </div>

        {/* Page Header */}
        <div className="mb-8 pb-6 border-b border-[#E8E5DF] space-y-2">
          <span className="text-xs font-semibold text-[#5146E5] uppercase tracking-wider">
            {isImportedDraft ? "Discovery Integration" : "New Gathering"}
          </span>
          <h1 className="text-3xl font-bold tracking-tight text-[#171923]">
            {isImportedDraft ? "Review & Publish Event Draft" : "Create a New Gathering"}
          </h1>
          <p className="text-sm text-[#686D78]">
            {isImportedDraft
              ? "Verify external search details, adjust timing, and confirm registration capacity."
              : "Set up dates, venue location, attendee limits, and open registrations."}
          </p>
        </div>

        {/* Imported Draft Warning Callout */}
        {isImportedDraft && (
          <div
            role="alert"
            className="mb-8 p-5 bg-[#FFFBEB] border border-[#FDE68A] rounded-2xl text-[#92400E] space-y-3 shadow-xs"
          >
            <div className="flex items-start gap-3">
              <div className="p-2 bg-[#FEF3C7] rounded-xl text-[#D97706] shrink-0 mt-0.5">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-[#FEF3C7] text-[#B45309] px-2 py-0.5 rounded border border-[#FDE68A]">
                    Unverified Draft
                  </span>
                  {initialDraft?.category && (
                    <span className="text-xs text-[#92400E] font-medium">
                      Category: {initialDraft.category}
                    </span>
                  )}
                </div>
                <h3 className="text-sm font-bold text-[#171923]">
                  Host Verification Required Prior to Publication
                </h3>
                <p className="text-xs text-[#92400E]/90 leading-relaxed">
                  This draft was imported from live web search results. Please confirm that all dates, venue details, and capacity bounds are correct.
                </p>
              </div>
            </div>

            {initialDraft?.sourceUrl && (
              <div className="pt-2 border-t border-[#FDE68A] flex items-center justify-between gap-3 text-xs">
                <span className="text-[#92400E] truncate font-mono text-[11px]">
                  {initialDraft.sourceUrl}
                </span>
                <a
                  href={initialDraft.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-semibold text-[#5146E5] hover:text-[#4338CA] shrink-0"
                >
                  <span>Inspect Source</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            )}
          </div>
        )}

        {/* Main Form Card */}
        <div className="bg-white border border-[#E8E5DF] rounded-2xl p-6 sm:p-8 shadow-[0_2px_12px_rgba(23,25,35,0.04)]">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {globalError && (
              <div
                role="alert"
                className="p-3 bg-[#FEF2F2] border border-[#FECACA] rounded-xl text-[#DC2626] text-xs flex items-center gap-2 font-medium"
              >
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{globalError}</span>
              </div>
            )}

            {/* Event Cover Poster Upload */}
            <ImageUpload
              value={posterUrl}
              publicId={posterPublicId}
              onChange={(url, publicId) => {
                setPosterUrl(url);
                setPosterPublicId(publicId);
                setValue("imageUrl", url, { shouldValidate: true });
                setValue("imagePublicId", publicId, { shouldValidate: true });
              }}
              onRemove={() => {
                setPosterUrl("");
                setPosterPublicId("");
                setValue("imageUrl", "", { shouldValidate: true });
                setValue("imagePublicId", "", { shouldValidate: true });
              }}
              onUploadStateChange={setIsUploadingImage}
              disabled={isLoading}
            />

            {/* Event Title */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#171923] uppercase tracking-wider">
                Event Title
              </label>
              <div className="relative">
                <Sparkles className="w-4 h-4 text-[#686D78] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="e.g. Bengaluru Open Source Summit 2026"
                  disabled={isLoading}
                  {...register("title")}
                  className={`w-full pl-10 pr-3.5 py-2.5 bg-[#FAF9F6] border rounded-xl text-sm text-[#171923] placeholder-[#9CA3AF] focus:outline-none focus:bg-white transition-all ${
                    errors.title
                      ? "border-[#FECACA] focus:border-[#DC2626] focus:ring-2 focus:ring-[#DC2626]/10"
                      : "border-[#E8E5DF] focus:border-[#5146E5] focus:ring-2 focus:ring-[#5146E5]/15"
                  }`}
                />
              </div>
              {errors.title && (
                <p className="text-[#DC2626] text-xs mt-1">{errors.title.message}</p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#171923] uppercase tracking-wider">
                Description & Agenda
              </label>
              <textarea
                placeholder="Describe the topics, speakers, what attendees should bring, and schedule..."
                disabled={isLoading}
                rows={5}
                {...register("description")}
                className={`w-full px-4 py-3 bg-[#FAF9F6] border rounded-xl text-sm text-[#171923] placeholder-[#9CA3AF] focus:outline-none focus:bg-white transition-all resize-y ${
                  errors.description
                    ? "border-[#FECACA] focus:border-[#DC2626] focus:ring-2 focus:ring-[#DC2626]/10"
                    : "border-[#E8E5DF] focus:border-[#5146E5] focus:ring-2 focus:ring-[#5146E5]/15"
                }`}
              />
              {errors.description && (
                <p className="text-[#DC2626] text-xs mt-1">
                  {errors.description.message}
                </p>
              )}
            </div>

            {/* Date & Time Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#171923] uppercase tracking-wider">
                  Event Date
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-[#686D78] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="date"
                    disabled={isLoading}
                    {...register("date")}
                    className={`w-full pl-10 pr-3.5 py-2.5 bg-[#FAF9F6] border rounded-xl text-sm text-[#171923] focus:outline-none focus:bg-white transition-all ${
                      errors.date
                        ? "border-[#FECACA] focus:border-[#DC2626] focus:ring-2 focus:ring-[#DC2626]/10"
                        : "border-[#E8E5DF] focus:border-[#5146E5] focus:ring-2 focus:ring-[#5146E5]/15"
                    }`}
                  />
                </div>
                {errors.date && (
                  <p className="text-[#DC2626] text-xs mt-1">{errors.date.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-[#171923] uppercase tracking-wider">
                    Event Time
                  </label>
                  <span className="text-[10px] text-[#686D78]">e.g. 10:00 AM</span>
                </div>
                <div className="relative">
                  <Clock className="w-4 h-4 text-[#686D78] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="e.g. 10:00 AM - 4:00 PM"
                    disabled={isLoading}
                    {...register("time")}
                    className={`w-full pl-10 pr-3.5 py-2.5 bg-[#FAF9F6] border rounded-xl text-sm text-[#171923] placeholder-[#9CA3AF] focus:outline-none focus:bg-white transition-all ${
                      errors.time
                        ? "border-[#FECACA] focus:border-[#DC2626] focus:ring-2 focus:ring-[#DC2626]/10"
                        : "border-[#E8E5DF] focus:border-[#5146E5] focus:ring-2 focus:ring-[#5146E5]/15"
                    }`}
                  />
                </div>
                {errors.time && (
                  <p className="text-[#DC2626] text-xs mt-1">{errors.time.message}</p>
                )}
              </div>
            </div>

            {/* Location & Capacity Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#171923] uppercase tracking-wider">
                  Location / Venue
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-[#686D78] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="e.g. Koramangala, Bengaluru or Online"
                    disabled={isLoading}
                    {...register("location")}
                    className={`w-full pl-10 pr-3.5 py-2.5 bg-[#FAF9F6] border rounded-xl text-sm text-[#171923] placeholder-[#9CA3AF] focus:outline-none focus:bg-white transition-all ${
                      errors.location
                        ? "border-[#FECACA] focus:border-[#DC2626] focus:ring-2 focus:ring-[#DC2626]/10"
                        : "border-[#E8E5DF] focus:border-[#5146E5] focus:ring-2 focus:ring-[#5146E5]/15"
                    }`}
                  />
                </div>
                {errors.location && (
                  <p className="text-[#DC2626] text-xs mt-1">
                    {errors.location.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-[#171923] uppercase tracking-wider">
                    Capacity Limit
                  </label>
                  <span className="text-[10px] text-[#686D78]">Strict RSVP ceiling</span>
                </div>
                <div className="relative">
                  <Users className="w-4 h-4 text-[#686D78] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="number"
                    min="1"
                    disabled={isLoading}
                    {...register("capacity")}
                    className={`w-full pl-10 pr-3.5 py-2.5 bg-[#FAF9F6] border rounded-xl text-sm text-[#171923] focus:outline-none focus:bg-white transition-all ${
                      errors.capacity
                        ? "border-[#FECACA] focus:border-[#DC2626] focus:ring-2 focus:ring-[#DC2626]/10"
                        : "border-[#E8E5DF] focus:border-[#5146E5] focus:ring-2 focus:ring-[#5146E5]/15"
                    }`}
                  />
                </div>
                {errors.capacity && (
                  <p className="text-[#DC2626] text-xs mt-1">
                    {errors.capacity.message}
                  </p>
                )}
              </div>
            </div>

            {/* Registration Deadline */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-[#171923] uppercase tracking-wider">
                  Registration Deadline
                </label>
                <span className="text-[10px] text-[#686D78]">
                  Must be on or before the event date
                </span>
              </div>
              <div className="relative">
                <CalendarCheck className="w-4 h-4 text-[#686D78] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="date"
                  disabled={isLoading}
                  {...register("registrationDeadline")}
                  className={`w-full pl-10 pr-3.5 py-2.5 bg-[#FAF9F6] border rounded-xl text-sm text-[#171923] focus:outline-none focus:bg-white transition-all ${
                    errors.registrationDeadline
                      ? "border-[#FECACA] focus:border-[#DC2626] focus:ring-2 focus:ring-[#DC2626]/10"
                      : "border-[#E8E5DF] focus:border-[#5146E5] focus:ring-2 focus:ring-[#5146E5]/15"
                  }`}
                />
              </div>
              {errors.registrationDeadline && (
                <p className="text-[#DC2626] text-xs mt-1">
                  {errors.registrationDeadline.message}
                </p>
              )}
            </div>

            {/* Hidden Source Attribution URL */}
            <input type="hidden" {...register("sourceUrl")} />

            {/* Host Verification Checkbox for Imported Drafts */}
            {isImportedDraft && (
              <div className="p-4 bg-[#FAF9F6] border border-[#E8E5DF] rounded-xl space-y-2">
                <label className="flex items-start gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={confirmedByHost}
                    onChange={(e) => setConfirmedByHost(e.target.checked)}
                    className="mt-1 w-4 h-4 text-[#5146E5] rounded border-[#E8E5DF] focus:ring-[#5146E5] cursor-pointer"
                  />
                  <span className="text-xs text-[#686D78] leading-relaxed">
                    <strong className="text-[#171923] block">
                      Host Verification Confirmation
                    </strong>
                    I confirm that I have reviewed the details against the source website. I understand that publishing this event will open official RSVPs on EventScout.
                  </span>
                </label>
              </div>
            )}

            {/* Action Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-end gap-3">
              <Link
                href={isImportedDraft ? "/discover" : "/dashboard"}
                className="w-full sm:w-auto px-5 py-2.5 bg-white hover:bg-[#FAF9F6] border border-[#E8E5DF] hover:border-[#D5D1C8] text-[#171923] text-sm font-medium rounded-xl text-center transition-all shadow-2xs"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={isLoading || isUploadingImage || (isImportedDraft && !confirmedByHost)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-[#5146E5] hover:bg-[#4338CA] text-white text-sm font-semibold rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.99]"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{isImportedDraft ? "Publishing Event..." : "Creating Event..."}</span>
                  </>
                ) : isUploadingImage ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Uploading Poster...</span>
                  </>
                ) : isImportedDraft ? (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Review & Publish Event</span>
                  </>
                ) : (
                  <span>Publish Event</span>
                )}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
