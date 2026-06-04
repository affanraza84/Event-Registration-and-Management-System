import Link from "next/link";
import {
  Sparkles,
  Calendar,
  ArrowRight,
  ShieldCheck,
  Ticket,
  Clock,
  MapPin,
  Users,
  Compass,
  Zap,
  BarChart3,
  Mail,
} from "lucide-react";
import { connectToDatabase } from "@/lib/db";
import Event from "@/models/Event";

export const metadata = {
  title: "Luma | Host Memorable Events & Gatherings",
  description:
    "The elegant, all-in-one platform for creating event pages, collecting RSVPs, tracking attendee statistics, and hosting gatherings.",
};

export default async function Home() {
  await connectToDatabase();

  // Fetch upcoming, active events to showcase on landing page
  const upcomingEvents = await Event.find({
    isClosed: false,
    date: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) },
  })
    .sort({ date: 1 })
    .limit(4);

  const serializedEvents = upcomingEvents.map((ev) => ({
    id: ev._id.toString(),
    title: ev.title,
    slug: ev.slug,
    date: ev.date.toISOString().split("T")[0],
    time: ev.time,
    location: ev.location,
    capacity: ev.capacity,
    attendeeCount: ev.attendeeCount,
  }));

  return (
    <div className="min-h-screen bg-neutral-955 text-neutral-100 flex flex-col relative overflow-hidden">
      {/* Background blurs */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-purple-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/3 right-10 w-96 h-96 bg-amber-500/5 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-10 w-96 h-96 bg-indigo-600/5 rounded-full blur-[140px] pointer-events-none" />

      {/* Nav bar */}
      <nav className="border-b border-neutral-900 bg-neutral-950/30 backdrop-blur-md px-6 py-4 flex items-center justify-between z-10">
        <Link
          href="/"
          className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-purple-400 via-pink-500 to-amber-400 bg-clip-text text-transparent hover:opacity-90 transition-opacity"
        >
          Luma
        </Link>
        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="text-sm font-medium text-neutral-400 hover:text-neutral-200 transition-colors"
          >
            Sign In
          </Link>
          <Link
            href="/signup"
            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-sm font-medium rounded-xl transition-all shadow-md shadow-purple-950/20"
          >
            Create Account
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="z-10 text-center max-w-4xl mx-auto px-6 pt-20 pb-16 flex flex-col items-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-950/40 border border-purple-900/40 rounded-full text-purple-300 text-xs font-semibold mb-6 animate-fade-in">
          <Sparkles className="w-3.5 h-3.5" />
          The elegant way to host gatherings
        </div>

        <h1 className="text-5xl sm:text-7xl font-extrabold tracking-tight mb-6 leading-tight">
          Delightful events,{" "}
          <span className="bg-gradient-to-r from-purple-400 via-pink-500 to-amber-400 bg-clip-text text-transparent">
            effortless RSVPs.
          </span>
        </h1>

        <p className="text-lg sm:text-xl text-neutral-400 font-light max-w-2xl leading-relaxed mb-8">
          Luma helps you create beautiful event pages, securely manage attendee lists, track analytics, and export registrations in seconds.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
          <Link
            href="/signup"
            className="flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold rounded-xl transition-all shadow-xl shadow-purple-950/30 hover:scale-[1.02] active:scale-[0.98]"
          >
            Host Your First Event
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/login"
            className="flex items-center justify-center gap-2 px-8 py-4 bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 hover:border-neutral-700 text-neutral-200 font-semibold rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            Browse Attendees
          </Link>
        </div>
      </header>

      {/* Featured Events Section */}
      <section className="z-10 max-w-6xl mx-auto px-6 py-12 w-full space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-neutral-100 flex items-center gap-2">
              <Compass className="w-6 h-6 text-purple-400" />
              Discover Gatherings
            </h2>
            <p className="text-neutral-400 text-sm mt-1">
              Explore upcoming public meetups and reserve your ticket.
            </p>
          </div>
          {serializedEvents.length > 0 && (
            <span className="text-xs text-neutral-500">
              Showing {serializedEvents.length} active events
            </span>
          )}
        </div>

        {serializedEvents.length === 0 ? (
          <div className="bg-neutral-900/30 border border-neutral-800/80 rounded-2xl p-12 text-center max-w-lg mx-auto space-y-4">
            <div className="inline-flex p-3 bg-neutral-900 border border-neutral-850 rounded-full text-neutral-500">
              <Calendar className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-neutral-350">
              No public events active right now
            </h3>
            <p className="text-neutral-500 text-sm">
              Be the pioneer! Create a host account and design the first gathering in your community.
            </p>
            <Link
              href="/signup"
              className="inline-flex items-center justify-center px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold rounded-xl transition-all"
            >
              Sign Up as Host
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {serializedEvents.map((ev) => {
              const spotsLeft = ev.capacity - ev.attendeeCount;
              const isFull = spotsLeft <= 0;

              return (
                <div
                  key={ev.id}
                  className="bg-neutral-900/40 border border-neutral-800/80 rounded-2xl p-5 shadow-xl flex flex-col justify-between hover:border-neutral-700/80 transition-all duration-200"
                >
                  <div className="space-y-4">
                    {/* Date Badge */}
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold tracking-wider uppercase bg-purple-950/60 text-purple-300 border border-purple-900/50 px-2 py-0.5 rounded-md">
                        RSVP Open
                      </span>
                      <span className="text-xs text-neutral-550">
                        {new Date(ev.date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <h3 className="font-extrabold text-neutral-100 line-clamp-1">
                        {ev.title}
                      </h3>
                      <div className="flex items-center gap-1.5 text-xs text-neutral-400">
                        <Clock className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                        <span>{ev.time}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-neutral-400">
                        <MapPin className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                        <span className="line-clamp-1">{ev.location}</span>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-neutral-900 mt-6 pt-4 flex items-center justify-between gap-2">
                    <div className="text-[11px] text-neutral-450">
                      {isFull ? (
                        <span className="text-red-400 font-semibold">Sold Out</span>
                      ) : (
                        <span>
                          <strong className="text-neutral-250 font-bold">
                            {spotsLeft}
                          </strong>{" "}
                          spots left
                        </span>
                      )}
                    </div>
                    <Link
                      href={`/events/${ev.slug}`}
                      className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-xs font-semibold rounded-lg text-neutral-300 transition-all shrink-0"
                    >
                      RSVP
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Features Grid Section */}
      <section className="z-10 max-w-6xl mx-auto px-6 py-20 w-full border-t border-neutral-900/50 mt-12">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <h2 className="text-3xl font-extrabold tracking-tight text-neutral-100">
            SaaS-Grade Features Built for scale
          </h2>
          <p className="text-neutral-400 text-sm">
            Everything you need to host elegant events and gather data without leaks.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-neutral-900/30 border border-neutral-800/60 rounded-2xl p-6 space-y-3">
            <div className="p-3 bg-purple-950/50 border border-purple-900/50 rounded-xl text-purple-400 w-fit">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-neutral-200">Instant Event Landing</h3>
            <p className="text-neutral-450 text-sm leading-relaxed">
              Generate static-optimized event invitation pages with live attendee counts, capacity guards, and RSVP deadlines automatically.
            </p>
          </div>

          <div className="bg-neutral-900/30 border border-neutral-800/60 rounded-2xl p-6 space-y-3">
            <div className="p-3 bg-purple-950/50 border border-purple-900/50 rounded-xl text-purple-400 w-fit">
              <BarChart3 className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-neutral-200">Host Analytics Panel</h3>
            <p className="text-neutral-450 text-sm leading-relaxed">
              Track registration totals, monitor incoming attendees with TanStack Table search/filter metrics, and cancel registrations with cascading capacity release.
            </p>
          </div>

          <div className="bg-neutral-900/30 border border-neutral-800/60 rounded-2xl p-6 space-y-3">
            <div className="p-3 bg-purple-950/50 border border-purple-900/50 rounded-xl text-purple-400 w-fit">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-neutral-200">Protected CSV Export</h3>
            <p className="text-neutral-450 text-sm leading-relaxed">
              Download clean list registration exports securely. Authentication ownership reviews ensure that only the creator can query event CSV datasets.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="z-10 border-t border-neutral-900 bg-neutral-950/50 py-12 px-6 mt-auto">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-center md:text-left space-y-2">
            <span className="text-xl font-bold bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">
              Luma
            </span>
            <p className="text-neutral-500 text-xs">
              &copy; {new Date().getFullYear()} Luma. All rights reserved. Foundation & Event Modules.
            </p>
          </div>

          <div className="flex gap-4 text-neutral-500">
            <Link
              href="https://twitter.com"
              className="hover:text-neutral-300 transition-colors"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
            </Link>
            <Link
              href="https://github.com"
              className="hover:text-neutral-300 transition-colors"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
              </svg>
            </Link>
            <Link
              href="https://instagram.com"
              className="hover:text-neutral-300 transition-colors"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
              </svg>
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
