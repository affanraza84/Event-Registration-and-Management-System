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
} from "lucide-react";
import { eventCreationSchema, EventCreationInput } from "@/validations/event";
import { createEventAction } from "@/actions/events";

export default function CreateEventForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(eventCreationSchema),
    defaultValues: {
      title: "",
      description: "",
      date: "",
      time: "",
      location: "",
      capacity: 50,
      registrationDeadline: "",
    },
  });

  const onSubmit = async (data: EventCreationInput) => {
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
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-neutral-950 px-4 py-12">
      {/* Background blobs for premium glow effect */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-2xl z-10">
        {/* Back Button */}
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-neutral-400 hover:text-neutral-200 text-sm font-medium mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-purple-400 via-pink-500 to-amber-400 bg-clip-text text-transparent">
            Create a New Event
          </h1>
          <p className="text-neutral-400 mt-2 text-sm">
            Host a new experience and invite your audience to RSVP.
          </p>
        </div>

        {/* Glassmorphic Form Card */}
        <div className="bg-neutral-900/40 backdrop-blur-xl border border-neutral-800/80 rounded-2xl p-8 shadow-2xl">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {globalError && (
              <div className="p-3.5 bg-red-950/40 border border-red-900/50 rounded-lg text-red-400 text-sm font-medium">
                {globalError}
              </div>
            )}

            {/* Title */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">
                Event Title
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-500">
                  <Sparkles className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  placeholder="e.g. Byamn Dev Meetup 2026"
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
                <p className="text-red-400 text-xs mt-1">
                  {errors.title.message}
                </p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">
                Description
              </label>
              <textarea
                placeholder="Give your attendees more details about the event..."
                disabled={isLoading}
                rows={4}
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
                <label className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">
                  Date
                </label>
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
                  <p className="text-red-400 text-xs mt-1">
                    {errors.date.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">
                  Time
                </label>
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
                  <p className="text-red-400 text-xs mt-1">
                    {errors.time.message}
                  </p>
                )}
              </div>
            </div>

            {/* Location & Capacity Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">
                  Location
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-500">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    placeholder="e.g. San Francisco, CA or Online"
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
                <label className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">
                  Capacity
                </label>
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
              <label className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">
                Registration Deadline
              </label>
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

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-medium rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/40 shadow-lg shadow-purple-950/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 mt-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating Event...
                </>
              ) : (
                "Create Event"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
