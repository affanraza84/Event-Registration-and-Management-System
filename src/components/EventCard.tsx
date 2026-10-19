"use client";

import Link from "next/link";
import { Clock, MapPin, ArrowRight, Users, Sparkles } from "lucide-react";
import { getEventCover } from "@/lib/eventCovers";

export interface EventCardData {
  id: string;
  title: string;
  slug: string;
  date: string;
  time: string;
  location: string;
  capacity: number;
  attendeeCount: number;
  imageUrl?: string;
  category?: string;
  description?: string;
  isClosed?: boolean;
}

interface EventCardProps {
  event: EventCardData;
  variant?: "grid" | "horizontal" | "featured";
  priority?: boolean;
}

export default function EventCard({
  event,
  variant = "grid",
}: EventCardProps) {
  const spotsLeft = Math.max(0, event.capacity - event.attendeeCount);
  const isFull = spotsLeft <= 0;
  const isClosed = event.isClosed || false;
  const cover = getEventCover(event.title, event.category, event.id, event.imageUrl);

  // Date formatting
  const eventDateObj = new Date(event.date);
  const monthStr = eventDateObj.toLocaleDateString("en-US", { month: "short" });
  const dayStr = eventDateObj.toLocaleDateString("en-US", { day: "numeric" });
  const weekdayStr = eventDateObj.toLocaleDateString("en-US", { weekday: "short" });

  const capacityPercent = Math.min(
    100,
    Math.round((event.attendeeCount / Math.max(1, event.capacity)) * 100)
  );

  if (variant === "featured") {
    return (
      <article className="group relative bg-white border border-[#E8E5DF] hover:border-[#D5D1C8] rounded-3xl overflow-hidden shadow-xs hover:shadow-[0_16px_40px_rgba(23,25,35,0.08)] transition-all duration-300 flex flex-col md:flex-row max-h-none md:max-h-[340px]">
        {/* Cover Image Container */}
        <div className="relative w-full md:w-5/12 lg:w-5/12 h-56 sm:h-64 md:h-full md:min-h-[260px] md:max-h-[340px] overflow-hidden bg-[#FAF9F6] shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={cover.url}
            alt={cover.alt}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent md:hidden" />
          
          {/* Overlaid Badges */}
          <div className="absolute top-4 left-4 flex items-center gap-2">
            <span className="flex flex-col items-center justify-center min-w-[46px] px-2 py-1 rounded-xl bg-white/95 backdrop-blur-md text-[#171923] border border-[#E8E5DF] shadow-xs">
              <span className="text-[9px] font-bold uppercase tracking-wider text-[#5146E5]">
                {monthStr}
              </span>
              <span className="text-base font-black leading-none">{dayStr}</span>
            </span>
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-lg bg-[#171923]/85 text-white backdrop-blur-md">
              <Sparkles className="w-3 h-3 text-[#DDD6FE]" />
              Featured
            </span>
          </div>

          <div className="absolute top-4 right-4">
            <span
              className={`text-[10px] font-semibold px-2.5 py-1 rounded-lg shadow-xs backdrop-blur-md border ${
                isClosed
                  ? "bg-[#F3F4F6]/95 text-[#4B5563] border-[#E5E7EB]"
                  : isFull
                  ? "bg-[#FEF2F2]/95 text-[#DC2626] border-[#FECACA]"
                  : "bg-[#ECFDF5]/95 text-[#059669] border-[#A7F3D0]"
              }`}
            >
              {isClosed ? "Closed" : isFull ? "Capacity Reached" : "RSVP Open"}
            </span>
          </div>
        </div>

        {/* Content Column */}
        <div className="md:w-7/12 p-6 sm:p-7 flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#5146E5] uppercase tracking-wider">
              <span>{weekdayStr}, {monthStr} {dayStr}</span>
              <span>•</span>
              <span>{event.time}</span>
            </div>

            <h3 className="text-2xl sm:text-3xl font-bold text-[#171923] group-hover:text-[#5146E5] transition-colors leading-tight">
              <Link href={`/events/${event.slug}`} className="focus:outline-none">
                {event.title}
              </Link>
            </h3>

            {event.description && (
              <p className="text-sm text-[#686D78] line-clamp-3 leading-relaxed">
                {event.description}
              </p>
            )}

            <div className="space-y-2 pt-1 text-xs text-[#686D78]">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#5146E5] shrink-0" />
                <span className="font-medium text-[#171923] line-clamp-1">{event.location}</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-[#5146E5] shrink-0" />
                <span>
                  {event.attendeeCount} / {event.capacity} registered
                </span>
              </div>
            </div>

            {/* Capacity Meter */}
            <div className="space-y-1.5 pt-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-[#686D78]">Capacity Status</span>
                <span className="font-semibold text-[#171923]">
                  {isFull ? "100% Full" : `${spotsLeft} spots left`}
                </span>
              </div>
              <div className="h-1.5 w-full bg-[#FAF9F6] border border-[#E8E5DF] rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 rounded-full ${
                    isFull ? "bg-[#DC2626]" : capacityPercent > 80 ? "bg-[#D97706]" : "bg-[#5146E5]"
                  }`}
                  style={{ width: `${capacityPercent}%` }}
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-[#E8E5DF] flex items-center justify-between">
            <span className="text-xs font-medium text-[#686D78]">
              {isFull ? "Waitlist available" : "Free RSVP confirmation"}
            </span>
            <Link
              href={`/events/${event.slug}`}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#5146E5] hover:bg-[#4338CA] text-white text-sm font-semibold rounded-xl shadow-xs transition-all active:scale-[0.99]"
            >
              <span>{isFull ? "View Event" : "Reserve Spot"}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </article>
    );
  }

  // Standard Grid Card (Default)
  return (
    <article className="group bg-white border border-[#E8E5DF] hover:border-[#D5D1C8] rounded-2xl overflow-hidden shadow-xs hover:shadow-[0_12px_32px_rgba(23,25,35,0.07)] transition-all duration-300 flex flex-col justify-between">
      <div>
        {/* Cover Image Container */}
        <div className="relative aspect-[16/10] max-h-[220px] w-full overflow-hidden bg-[#FAF9F6]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={cover.url}
            alt={cover.alt}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          {/* Top Left: Date Badge */}
          <div className="absolute top-3 left-3 flex items-center gap-2">
            <span className="flex flex-col items-center justify-center min-w-[42px] px-2 py-1 rounded-lg bg-white/95 backdrop-blur-md text-[#171923] border border-[#E8E5DF] shadow-xs">
              <span className="text-[9px] font-bold uppercase tracking-wider text-[#5146E5] leading-none">
                {monthStr}
              </span>
              <span className="text-sm font-black leading-tight">{dayStr}</span>
            </span>
          </div>

          {/* Top Right: Status Badge */}
          <div className="absolute top-3 right-3">
            <span
              className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg shadow-xs backdrop-blur-md border ${
                isClosed
                  ? "bg-[#F3F4F6]/95 text-[#4B5563] border-[#E5E7EB]"
                  : isFull
                  ? "bg-[#FEF2F2]/95 text-[#DC2626] border-[#FECACA]"
                  : "bg-[#ECFDF5]/95 text-[#059669] border-[#A7F3D0]"
              }`}
            >
              {isClosed ? "Closed" : isFull ? "Full" : "RSVP Open"}
            </span>
          </div>
        </div>

        {/* Card Body */}
        <div className="p-5 space-y-3">
          <div className="flex items-center gap-1.5 text-xs text-[#5146E5] font-semibold">
            <span>{weekdayStr}</span>
            <span>•</span>
            <div className="flex items-center gap-1 text-[#686D78] font-normal">
              <Clock className="w-3.5 h-3.5 text-[#5146E5] shrink-0" />
              <span>{event.time}</span>
            </div>
          </div>

          <h3 className="font-bold text-base sm:text-lg text-[#171923] group-hover:text-[#5146E5] transition-colors line-clamp-2 leading-snug">
            <Link href={`/events/${event.slug}`} className="focus:outline-none">
              {event.title}
            </Link>
          </h3>

          <div className="flex items-start gap-2 text-xs text-[#686D78] pt-1">
            <MapPin className="w-3.5 h-3.5 text-[#5146E5] shrink-0 mt-0.5" />
            <span className="line-clamp-1">{event.location}</span>
          </div>
        </div>
      </div>

      {/* Card Footer */}
      <div className="px-5 py-3.5 bg-[#FAF9F6] border-t border-[#E8E5DF] flex items-center justify-between">
        <div className="text-xs">
          {isClosed ? (
            <span className="text-[#686D78] font-medium">Registrations closed</span>
          ) : isFull ? (
            <span className="text-[#DC2626] font-semibold">Capacity reached</span>
          ) : (
            <span className="text-[#686D78]">
              <strong className="text-[#171923] font-bold">{spotsLeft}</strong> spots left
            </span>
          )}
        </div>

        <Link
          href={`/events/${event.slug}`}
          className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 bg-white hover:bg-[#FAF9F6] text-[#5146E5] border border-[#DDD6FE] hover:border-[#5146E5] rounded-lg transition-colors shadow-2xs group-hover:bg-[#5146E5] group-hover:text-white group-hover:border-[#5146E5]"
        >
          <span>RSVP</span>
          <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
    </article>
  );
}
