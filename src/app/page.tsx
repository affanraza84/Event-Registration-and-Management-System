import Link from "next/link";
import Navbar from "@/components/Navbar";
import {
  Calendar,
  ArrowRight,
  ShieldCheck,
  Clock,
  MapPin,
  Compass,
  Zap,
  BarChart3,
  Search,
  Sparkles,
  Users,
  CheckCircle2,
} from "lucide-react";
import { connectToDatabase } from "@/lib/db";
import Event from "@/models/Event";
import { getEventCover } from "@/lib/eventCovers";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "EventScout — Live Event Discovery & Registration",
  description:
    "Explore inspiring tech meetups, hackathons, conferences, and community gatherings across India. Curated discovery and seamless RSVP management.",
};

export default async function Home() {
  let serializedEvents: Array<{
    id: string;
    title: string;
    slug: string;
    date: string;
    time: string;
    location: string;
    capacity: number;
    attendeeCount: number;
    imageUrl?: string;
  }> = [];

  try {
    await connectToDatabase();

    const upcomingEvents = await Event.find({
      isClosed: false,
      date: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) },
    })
      .sort({ date: 1 })
      .limit(6);

    serializedEvents = upcomingEvents.map((ev) => ({
      id: ev._id.toString(),
      title: ev.title,
      slug: ev.slug,
      date: ev.date.toISOString().split("T")[0],
      time: ev.time,
      location: ev.location,
      capacity: ev.capacity,
      attendeeCount: ev.attendeeCount,
      imageUrl: ev.imageUrl || undefined,
    }));
  } catch (error) {
    console.error("Failed to load upcoming events:", error);
    serializedEvents = [];
  }

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#171923] flex flex-col">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-12 pb-20 md:pt-20 md:pb-28 overflow-hidden border-b border-[#E8E5DF]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Left Column: Editorial Headline & Actions */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#EEEAFE] border border-[#DDD6FE] text-[#5146E5] text-xs font-semibold tracking-wide uppercase">
                <Sparkles className="w-3.5 h-3.5" />
                Live Event Discovery & Management
              </div>

              <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-[#171923] leading-[1.12]">
                Find Your People. <br />
                <span className="text-[#5146E5]">Discover Your Next Experience.</span>
              </h1>

              <p className="text-lg sm:text-xl text-[#686D78] leading-relaxed max-w-xl font-normal">
                Explore inspiring tech meetups, hackathons, conferences, and community gatherings across India.
              </p>

              {/* Primary Call to Actions */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Link
                  href="/discover"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-[#5146E5] hover:bg-[#4338CA] text-white text-base font-medium rounded-xl shadow-xs transition-all duration-150 active:scale-[0.99]"
                >
                  <Compass className="w-4.5 h-4.5" />
                  Explore Events
                  <ArrowRight className="w-4 h-4 ml-0.5" />
                </Link>
                <Link
                  href="/signup"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-white hover:bg-[#FAF9F6] text-[#171923] border border-[#E8E5DF] hover:border-[#D5D1C8] text-base font-medium rounded-xl shadow-xs transition-all duration-150"
                >
                  Host an Event
                </Link>
              </div>

              {/* Live quick search bar */}
              <div className="pt-4">
                <form
                  action="/discover"
                  method="GET"
                  className="bg-white border border-[#E8E5DF] p-2 rounded-2xl shadow-[0_2px_12px_rgba(23,25,35,0.04)] flex flex-col sm:flex-row items-stretch gap-2"
                >
                  <div className="flex items-center gap-2.5 px-3 py-2 flex-1 min-w-0">
                    <Search className="w-4.5 h-4.5 text-[#686D78] shrink-0" />
                    <input
                      type="text"
                      name="q"
                      placeholder="e.g. AI Hackathon, Web3, Python meetup"
                      className="w-full text-sm text-[#171923] placeholder-[#9CA3AF] bg-transparent focus:outline-none"
                    />
                  </div>
                  <div className="h-px sm:h-auto sm:w-px bg-[#E8E5DF]" />
                  <div className="flex items-center gap-2.5 px-3 py-2 sm:w-48 shrink-0">
                    <MapPin className="w-4.5 h-4.5 text-[#686D78] shrink-0" />
                    <input
                      type="text"
                      name="location"
                      placeholder="City (e.g. Bengaluru)"
                      className="w-full text-sm text-[#171923] placeholder-[#9CA3AF] bg-transparent focus:outline-none"
                    />
                  </div>
                  <button
                    type="submit"
                    className="inline-flex items-center justify-center px-5 py-2.5 bg-[#171923] hover:bg-[#2D313E] text-white text-sm font-medium rounded-xl transition-colors cursor-pointer"
                  >
                    Find
                  </button>
                </form>
              </div>

              {/* Trust signals */}
              <div className="pt-2 flex flex-wrap items-center gap-y-2 gap-x-6 text-xs text-[#686D78]">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#059669]" />
                  <span>Real-time SerpApi event intelligence</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#059669]" />
                  <span>Automated attendee capacity limits</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#059669]" />
                  <span>Secure host CSV exports</span>
                </div>
              </div>
            </div>

            {/* Right Column: Editorial Visual Composition */}
            <div className="lg:col-span-5 relative">
              <div className="relative mx-auto max-w-md lg:max-w-none">
                {/* Main featured editorial image */}
                <div className="rounded-2xl overflow-hidden border border-[#E8E5DF] shadow-[0_12px_40px_rgba(23,25,35,0.08)] bg-white aspect-[4/3] relative">
                  <img
                    src="https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80"
                    alt="Audience and founders collaborating at a tech gathering"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#171923]/70 via-transparent to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4 text-white">
                    <span className="text-[11px] font-semibold uppercase tracking-wider bg-white/20 backdrop-blur-md px-2 py-0.5 rounded text-white inline-block mb-1">
                      Curated Experience
                    </span>
                    <h3 className="text-base font-semibold text-white drop-shadow-xs">
                      Community Gatherings That Spark Breakthroughs
                    </h3>
                  </div>
                </div>

                {/* Overlaid floating mini stat card */}
                <div className="hidden sm:flex absolute -bottom-6 -left-6 bg-white border border-[#E8E5DF] rounded-2xl p-4 shadow-[0_8px_30px_rgba(23,25,35,0.08)] items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-[#EEEAFE] flex items-center justify-center text-[#5146E5]">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-medium text-[#686D78]">
                      Active Ecosystem
                    </div>
                    <div className="text-sm font-bold text-[#171923]">
                      Hackathons & Conferences
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured & Upcoming Events Section */}
      <section className="py-16 md:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10 pb-4 border-b border-[#E8E5DF]">
          <div>
            <span className="text-xs font-semibold text-[#5146E5] uppercase tracking-wider">
              Upcoming Gatherings
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#171923] mt-1">
              Discover What&apos;s Happening
            </h2>
            <p className="text-[#686D78] text-sm mt-1">
              Handcrafted meetups, workshops, and symposiums open for registration.
            </p>
          </div>
          <Link
            href="/discover"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#5146E5] hover:text-[#4338CA] transition-colors"
          >
            <span>Explore all live events</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {serializedEvents.length === 0 ? (
          <div className="bg-white border border-[#E8E5DF] rounded-2xl p-12 text-center max-w-xl mx-auto space-y-4 shadow-xs">
            <div className="w-12 h-12 rounded-2xl bg-[#EEEAFE] text-[#5146E5] flex items-center justify-center mx-auto">
              <Calendar className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-[#171923]">
                No public events active right now
              </h3>
              <p className="text-[#686D78] text-sm max-w-md mx-auto">
                Be the first to bring your community together. Create a host account and organize an inspiring gathering today.
              </p>
            </div>
            <div className="pt-2">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center px-5 py-2.5 bg-[#5146E5] hover:bg-[#4338CA] text-white text-sm font-medium rounded-xl transition-all shadow-xs"
              >
                Host the First Event
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {serializedEvents.map((ev) => {
              const spotsLeft = ev.capacity - ev.attendeeCount;
              const isFull = spotsLeft <= 0;
              const cover = getEventCover(ev.title, undefined, ev.id, ev.imageUrl);

              return (
                <article
                  key={ev.id}
                  className="group bg-white border border-[#E8E5DF] hover:border-[#D5D1C8] rounded-2xl overflow-hidden shadow-xs hover:shadow-[0_8px_30px_rgba(23,25,35,0.06)] transition-all duration-200 flex flex-col justify-between"
                >
                  <div>
                    {/* Event Cover Image */}
                    <div className="relative aspect-[16/9] w-full overflow-hidden bg-[#FAF9F6]">
                      <img
                        src={cover.url}
                        alt={cover.alt}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-103"
                        loading="lazy"
                      />
                      <div className="absolute top-3 left-3 flex items-center gap-2">
                        <span className="text-[11px] font-semibold tracking-wider uppercase px-2.5 py-1 rounded-md bg-white/95 text-[#171923] border border-[#E8E5DF] shadow-xs backdrop-blur-sm">
                          {new Date(ev.date).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      </div>
                      <div className="absolute top-3 right-3">
                        <span
                          className={`text-[11px] font-semibold px-2.5 py-1 rounded-md shadow-xs backdrop-blur-sm border ${
                            isFull
                              ? "bg-[#FEF2F2]/95 text-[#DC2626] border-[#FECACA]"
                              : "bg-[#ECFDF5]/95 text-[#059669] border-[#A7F3D0]"
                          }`}
                        >
                          {isFull ? "Event Full" : "RSVP Open"}
                        </span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-5 space-y-3">
                      <h3 className="font-bold text-lg text-[#171923] group-hover:text-[#5146E5] transition-colors line-clamp-2">
                        <Link href={`/events/${ev.slug}`}>
                          {ev.title}
                        </Link>
                      </h3>

                      <div className="space-y-1.5 text-xs text-[#686D78]">
                        <div className="flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5 text-[#5146E5] shrink-0" />
                          <span>{ev.time}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-[#5146E5] shrink-0" />
                          <span className="line-clamp-1">{ev.location}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="px-5 py-3.5 bg-[#FAF9F6] border-t border-[#E8E5DF] flex items-center justify-between">
                    <div className="text-xs text-[#686D78]">
                      {isFull ? (
                        <span className="text-[#DC2626] font-semibold">Capacity reached</span>
                      ) : (
                        <span>
                          <strong className="text-[#171923] font-semibold">
                            {spotsLeft}
                          </strong>{" "}
                          spots remaining
                        </span>
                      )}
                    </div>
                    <Link
                      href={`/events/${ev.slug}`}
                      className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 bg-white hover:bg-[#FAF9F6] text-[#5146E5] border border-[#DDD6FE] hover:border-[#5146E5] rounded-lg transition-colors shadow-2xs"
                    >
                      <span>RSVP</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* Platform Features Section */}
      <section className="py-16 md:py-24 bg-white border-y border-[#E8E5DF]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto text-center mb-16 space-y-3">
            <span className="text-xs font-semibold text-[#5146E5] uppercase tracking-wider">
              Engineered for Creators & Communities
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#171923]">
              Sophisticated Tools for Every Stage of Your Event
            </h2>
            <p className="text-[#686D78] text-base leading-relaxed">
              From real-time discovery to high-integrity registration tracking and attendee management.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="space-y-3.5 p-6 rounded-2xl bg-[#FAF9F6] border border-[#E8E5DF]">
              <div className="w-10 h-10 rounded-xl bg-[#EEEAFE] text-[#5146E5] flex items-center justify-center">
                <Compass className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-[#171923]">
                Seamless Event Discovery
              </h3>
              <p className="text-sm text-[#686D78] leading-relaxed">
                Scout live tech gatherings, hackathons, and regional conferences powered by real-time SerpApi intelligence.
              </p>
            </div>

            <div className="space-y-3.5 p-6 rounded-2xl bg-[#FAF9F6] border border-[#E8E5DF]">
              <div className="w-10 h-10 rounded-xl bg-[#EEEAFE] text-[#5146E5] flex items-center justify-center">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-[#171923]">
                Effortless Event Hosting
              </h3>
              <p className="text-sm text-[#686D78] leading-relaxed">
                Launch elegant event invitation pages in minutes with automated RSVP deadlines and capacity enforcement.
              </p>
            </div>

            <div className="space-y-3.5 p-6 rounded-2xl bg-[#FAF9F6] border border-[#E8E5DF]">
              <div className="w-10 h-10 rounded-xl bg-[#EEEAFE] text-[#5146E5] flex items-center justify-center">
                <BarChart3 className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-[#171923]">
                Real-Time Registration
              </h3>
              <p className="text-sm text-[#686D78] leading-relaxed">
                Attendees receive instant confirmations, guest onboarding flows, and personal dashboards to manage tickets.
              </p>
            </div>

            <div className="space-y-3.5 p-6 rounded-2xl bg-[#FAF9F6] border border-[#E8E5DF]">
              <div className="w-10 h-10 rounded-xl bg-[#EEEAFE] text-[#5146E5] flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-[#171923]">
                Attendee Insights & CSV Export
              </h3>
              <p className="text-sm text-[#686D78] leading-relaxed">
                TanStack-powered attendee directories, search filters, and formula-sanitized CSV exports restricted to hosts.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#FAF9F6] border-t border-[#E8E5DF] py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-1.5 text-center md:text-left">
              <Link href="/" className="inline-flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-[#5146E5] flex items-center justify-center text-white">
                  <Compass className="w-3.5 h-3.5" />
                </div>
                <span className="font-bold text-lg text-[#171923]">
                  Event<span className="text-[#5146E5]">Scout</span>
                </span>
              </Link>
              <p className="text-xs text-[#686D78]">
                &copy; {new Date().getFullYear()} EventScout. Discover and host gatherings across India.
              </p>
            </div>

            <div className="flex items-center gap-6 text-xs text-[#686D78]">
              <Link href="/discover" className="hover:text-[#171923] transition-colors">
                Discover Events
              </Link>
              <Link href="/login" className="hover:text-[#171923] transition-colors">
                Sign In
              </Link>
              <Link href="/signup" className="hover:text-[#171923] transition-colors">
                Host an Event
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
