import Link from "next/link";
import Navbar from "@/components/Navbar";
import EventCard from "@/components/EventCard";
import {
  Compass,
  Sparkles,
  Search,
  MapPin,
  Calendar,
  ArrowRight,
  Code2,
  Users,
  Presentation,
  GraduationCap,
  Flame,
  Globe2,
  ShieldCheck,
  Zap,
  BarChart3,
  CheckCircle2,
  ArrowUpRight,
  Share2,
  FileSpreadsheet,
} from "lucide-react";
import { connectToDatabase } from "@/lib/db";
import Event from "@/models/Event";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "EventScout — Live Event Discovery & Community RSVP Platform",
  description:
    "Discover hackathons, tech meetups, workshops, and conferences worth showing up for. Find your community, learn something new, and make your next connection.",
};

const DISCOVERY_CATEGORIES = [
  {
    title: "Hackathons & Competitions",
    description: "48-hour buildathons, project sprints, and team innovation challenges.",
    icon: Code2,
    categoryQuery: "Hackathons",
    badge: "High Energy",
    color: "from-emerald-500/10 to-teal-500/5 text-emerald-700 border-emerald-200/80",
  },
  {
    title: "Conferences & Summits",
    description: "Multi-track developer conferences, keynote talks, and founder gatherings.",
    icon: Presentation,
    categoryQuery: "Conferences",
    badge: "Keynotes",
    color: "from-indigo-500/10 to-purple-500/5 text-indigo-700 border-indigo-200/80",
  },
  {
    title: "Workshops & Masterclasses",
    description: "Hands-on coding labs, deep-dives, and technical skill accelerators.",
    icon: Zap,
    categoryQuery: "Workshops",
    badge: "Hands-on",
    color: "from-violet-500/10 to-fuchsia-500/5 text-violet-700 border-violet-200/80",
  },
  {
    title: "Tech Meetups & Socials",
    description: "Informal local developer meetups, coffee chats, and community mixers.",
    icon: Users,
    categoryQuery: "Meetups",
    badge: "Networking",
    color: "from-blue-500/10 to-cyan-500/5 text-blue-700 border-blue-200/80",
  },
  {
    title: "Student & Campus Events",
    description: "University tech clubs, open-source workshops, and student fellowships.",
    icon: GraduationCap,
    categoryQuery: "Student Events",
    badge: "Campus",
    color: "from-amber-500/10 to-orange-500/5 text-amber-700 border-amber-200/80",
  },
  {
    title: "AI & Emerging Tech",
    description: "Generative AI roundtables, machine learning summits, and robotics labs.",
    icon: Flame,
    categoryQuery: "AI",
    badge: "Trending",
    color: "from-rose-500/10 to-pink-500/5 text-rose-700 border-rose-200/80",
  },
];

export default async function Home() {
  let serializedEvents: Array<{
    id: string;
    title: string;
    slug: string;
    description?: string;
    date: string;
    time: string;
    location: string;
    capacity: number;
    attendeeCount: number;
    imageUrl?: string;
    isClosed?: boolean;
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
      description: ev.description,
      date: ev.date.toISOString().split("T")[0],
      time: ev.time,
      location: ev.location,
      capacity: ev.capacity,
      attendeeCount: ev.attendeeCount,
      imageUrl: ev.imageUrl || undefined,
      isClosed: ev.isClosed || false,
    }));
  } catch (error) {
    console.error("Failed to load upcoming events:", error);
    serializedEvents = [];
  }

  const featuredEvent = serializedEvents.length > 0 ? serializedEvents[0] : null;
  const standardEvents = serializedEvents.length > 0 ? serializedEvents.slice(1) : [];

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#171923] flex flex-col selection:bg-[#EEEAFE] selection:text-[#5146E5]">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-12 pb-20 md:pt-20 md:pb-28 overflow-hidden border-b border-[#E8E5DF] bg-gradient-to-b from-white via-[#FAF9F6] to-[#FAF9F6]">
        {/* Subtle decorative ambient backdrop elements */}
        <div
          aria-hidden="true"
          className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 pointer-events-none opacity-40 blur-3xl -z-10 bg-gradient-to-br from-[#EEEAFE] via-indigo-50/50 to-transparent"
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-10 items-center">
            {/* Left Column: Hero Typography & Search */}
            <div className="lg:col-span-7 space-y-7 animate-fade-in-up">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#EEEAFE] border border-[#DDD6FE] text-[#5146E5] text-xs font-semibold tracking-wide uppercase shadow-2xs">
                <Sparkles className="w-3.5 h-3.5" />
                <span>The Modern Event Platform for Communities</span>
              </div>

              <div className="space-y-4">
                <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-[#171923] leading-[1.1]">
                  Your next big opportunity <br className="hidden sm:inline" />
                  <span className="bg-gradient-to-r from-[#5146E5] via-[#6366F1] to-[#4338CA] bg-clip-text text-transparent">
                    starts with an event.
                  </span>
                </h1>

                <p className="text-lg sm:text-xl text-[#686D78] leading-relaxed max-w-2xl font-normal">
                  Discover hackathons, tech meetups, workshops, and conferences worth showing up for. Find your community, learn something new, and make your next connection.
                </p>
              </div>

              {/* Primary Call to Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-1">
                <Link
                  href="/discover"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-[#5146E5] hover:bg-[#4338CA] text-white text-base font-semibold rounded-2xl shadow-[0_4px_16px_rgba(81,70,229,0.25)] hover:shadow-[0_6px_20px_rgba(81,70,229,0.35)] transition-all duration-200 active:scale-[0.99]"
                >
                  <Compass className="w-5 h-5" />
                  <span>Explore Events</span>
                  <ArrowRight className="w-4 h-4 ml-0.5" />
                </Link>

                <Link
                  href="/signup"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-white hover:bg-[#FAF9F6] text-[#171923] border border-[#E8E5DF] hover:border-[#D5D1C8] text-base font-semibold rounded-2xl shadow-xs transition-all duration-200 active:scale-[0.99]"
                >
                  <span>Host an Event</span>
                </Link>
              </div>

              {/* Prominent Quick-Search Bar */}
              <div className="pt-3">
                <form
                  action="/discover"
                  method="GET"
                  className="bg-white border border-[#E8E5DF] hover:border-[#D5D1C8] p-2 sm:p-2.5 rounded-2xl shadow-[0_4px_24px_rgba(23,25,35,0.06)] flex flex-col sm:flex-row items-stretch gap-2 transition-all focus-within:ring-2 focus-within:ring-[#5146E5]/15 focus-within:border-[#5146E5]"
                >
                  <div className="flex items-center gap-3 px-3 py-2 flex-1 min-w-0">
                    <Search className="w-5 h-5 text-[#5146E5] shrink-0" />
                    <input
                      type="text"
                      name="q"
                      placeholder="e.g. AI Hackathon, React meetup, Web3 summit"
                      className="w-full text-sm font-medium text-[#171923] placeholder-[#9CA3AF] bg-transparent focus:outline-none"
                    />
                  </div>

                  <div className="h-px sm:h-auto sm:w-px bg-[#E8E5DF]" />

                  <div className="flex items-center gap-3 px-3 py-2 sm:w-52 shrink-0">
                    <MapPin className="w-4.5 h-4.5 text-[#686D78] shrink-0" />
                    <input
                      type="text"
                      name="location"
                      placeholder="City (e.g. Bengaluru, Mumbai)"
                      className="w-full text-sm font-medium text-[#171923] placeholder-[#9CA3AF] bg-transparent focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="inline-flex items-center justify-center px-6 py-3 bg-[#171923] hover:bg-[#2D313E] text-white text-sm font-semibold rounded-xl transition-all cursor-pointer active:scale-[0.99] shrink-0"
                  >
                    <span>Find Events</span>
                  </button>
                </form>

                {/* Popular Search Suggestions */}
                <div className="flex flex-wrap items-center gap-2 pt-3 text-xs text-[#686D78]">
                  <span className="font-medium text-[#171923]">Popular:</span>
                  <Link
                    href="/discover?q=AI%20meetups&location=Bengaluru"
                    className="px-2.5 py-1 rounded-lg bg-white border border-[#E8E5DF] hover:border-[#5146E5] hover:text-[#5146E5] transition-colors"
                  >
                    AI in Bengaluru
                  </Link>
                  <Link
                    href="/discover?q=Hackathons&location=India"
                    className="px-2.5 py-1 rounded-lg bg-white border border-[#E8E5DF] hover:border-[#5146E5] hover:text-[#5146E5] transition-colors"
                  >
                    National Hackathons
                  </Link>
                  <Link
                    href="/discover?q=Web%20Conferences&location=Mumbai"
                    className="px-2.5 py-1 rounded-lg bg-white border border-[#E8E5DF] hover:border-[#5146E5] hover:text-[#5146E5] transition-colors"
                  >
                    Mumbai Conferences
                  </Link>
                </div>
              </div>

              {/* Trust & Architecture Signals */}
              <div className="pt-2 flex flex-wrap items-center gap-y-2 gap-x-6 text-xs text-[#686D78]">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#059669]" />
                  <span>Real-time SerpApi Web Discovery</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#059669]" />
                  <span>Automated RSVP Capacity Safeguards</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#059669]" />
                  <span>Verified Host Management</span>
                </div>
              </div>
            </div>

            {/* Right Column: Visual Collage of Real Poster Art */}
            <div className="lg:col-span-5 relative">
              <div className="relative mx-auto max-w-md lg:max-w-none">
                {/* Main Hero Card (Large Cover) */}
                <div className="relative rounded-3xl overflow-hidden border border-[#E8E5DF] bg-white shadow-[0_20px_50px_rgba(23,25,35,0.1)] group">
                  <div className="aspect-[4/3] w-full relative overflow-hidden bg-[#FAF9F6]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80"
                      alt="Audience and founders collaborating at a premier tech symposium"
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#171923]/80 via-[#171923]/20 to-transparent" />
                    
                    {/* Floating Chip Top Left */}
                    <div className="absolute top-4 left-4 flex items-center gap-2">
                      <span className="px-3 py-1 rounded-full bg-white/90 backdrop-blur-md text-[#5146E5] text-xs font-bold uppercase tracking-wider border border-white/50 shadow-xs">
                        Curated Gathering
                      </span>
                    </div>

                    {/* Floating Chip Top Right */}
                    <div className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#171923]/70 backdrop-blur-md text-white text-xs font-medium border border-white/20">
                      <Calendar className="w-3.5 h-3.5 text-[#DDD6FE]" />
                      <span>This Weekend</span>
                    </div>

                    {/* Card Title Bottom */}
                    <div className="absolute bottom-5 left-5 right-5 text-white space-y-1">
                      <div className="text-xs font-medium text-white/80">Bengaluru • Tech Hub</div>
                      <h3 className="text-lg font-bold text-white drop-shadow-xs leading-snug">
                        AI & Autonomous Systems Summit 2026
                      </h3>
                      <div className="flex items-center gap-4 pt-1 text-xs text-white/90">
                        <span>120+ Builders Attending</span>
                        <span>•</span>
                        <span className="text-[#A7F3D0] font-semibold">RSVP Open</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Overlaid Mini Poster Snippet */}
                <div className="hidden sm:flex absolute -bottom-8 -left-6 bg-white/95 backdrop-blur-md border border-[#E8E5DF] rounded-2xl p-4 shadow-[0_12px_36px_rgba(23,25,35,0.12)] items-center gap-3.5 max-w-xs animate-scale-in">
                  <div className="w-12 h-12 rounded-xl bg-[#EEEAFE] flex items-center justify-center text-[#5146E5] shrink-0">
                    <Code2 className="w-6 h-6" />
                  </div>
                  <div className="space-y-0.5">
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-[#5146E5]">
                      Live Discovery
                    </div>
                    <div className="text-sm font-bold text-[#171923] leading-tight">
                      Hackathons & Sprints
                    </div>
                    <div className="text-xs text-[#686D78]">
                      Connecting 10,000+ builders
                    </div>
                  </div>
                </div>

                {/* Overlaid Mini Badge Top Right */}
                <div className="hidden sm:flex absolute -top-5 -right-5 bg-white/95 backdrop-blur-md border border-[#E8E5DF] rounded-2xl py-2.5 px-4 shadow-[0_8px_24px_rgba(23,25,35,0.08)] items-center gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#059669] animate-pulse" />
                  <span className="text-xs font-bold text-[#171923]">RSVP Real-Time Sync</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Discovery Shortcuts: Category Pills & Cards */}
      <section className="py-12 bg-white border-b border-[#E8E5DF]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <span className="text-xs font-semibold text-[#5146E5] uppercase tracking-wider">
                Browse by Category
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-[#171923] mt-0.5">
                Explore What Inspires You
              </h2>
            </div>
            <Link
              href="/discover"
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#5146E5] hover:text-[#4338CA] transition-colors"
            >
              <span>View all categories</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {DISCOVERY_CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              return (
                <Link
                  key={cat.title}
                  href={`/discover?category=${encodeURIComponent(cat.categoryQuery)}`}
                  className="group relative bg-[#FAF9F6] hover:bg-white border border-[#E8E5DF] hover:border-[#5146E5]/40 rounded-2xl p-5 shadow-2xs hover:shadow-[0_8px_24px_rgba(81,70,229,0.08)] transition-all duration-200 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="w-10 h-10 rounded-xl bg-white border border-[#E8E5DF] flex items-center justify-center text-[#5146E5] group-hover:scale-105 group-hover:bg-[#5146E5] group-hover:text-white transition-all duration-200 shadow-2xs">
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md bg-white border border-[#E8E5DF] text-[#686D78]">
                        {cat.badge}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-base font-bold text-[#171923] group-hover:text-[#5146E5] transition-colors">
                        {cat.title}
                      </h3>
                      <p className="text-xs text-[#686D78] mt-1 leading-relaxed">
                        {cat.description}
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 flex items-center justify-between text-xs font-semibold text-[#5146E5]">
                    <span>Browse listings</span>
                    <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Featured Gatherings & Upcoming Events */}
      <section id="featured" className="py-16 md:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10 pb-4 border-b border-[#E8E5DF]">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EEEAFE] text-[#5146E5] text-xs font-semibold uppercase tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Handpicked Gatherings</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-[#171923] tracking-tight">
              Featured Events on EventScout
            </h2>
            <p className="text-[#686D78] text-sm sm:text-base mt-1.5 max-w-xl">
              Verified community events with live RSVP tracking, attendee limits, and instant confirmations.
            </p>
          </div>

          <Link
            href="/discover"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#5146E5] hover:text-[#4338CA] transition-colors"
          >
            <span>Explore all events</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {serializedEvents.length === 0 ? (
          <div className="bg-white border border-[#E8E5DF] rounded-3xl p-12 text-center max-w-xl mx-auto space-y-5 shadow-xs">
            <div className="w-14 h-14 rounded-2xl bg-[#EEEAFE] text-[#5146E5] flex items-center justify-center mx-auto shadow-2xs">
              <Calendar className="w-7 h-7" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-xl font-bold text-[#171923]">
                Be the pioneer organizer
              </h3>
              <p className="text-[#686D78] text-sm leading-relaxed max-w-md mx-auto">
                No public events are currently active. Create an event host account to launch your meetup, hackathon, or workshop on EventScout.
              </p>
            </div>
            <div className="pt-2">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#5146E5] hover:bg-[#4338CA] text-white text-sm font-semibold rounded-xl shadow-xs transition-all active:scale-[0.99]"
              >
                <span>Host Your First Event</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Editorial Featured Large Card if available */}
            {featuredEvent && (
              <EventCard event={featuredEvent} variant="featured" priority={true} />
            )}

            {/* Grid of Remaining Upcoming Events */}
            {standardEvents.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
                {standardEvents.map((ev) => (
                  <EventCard key={ev.id} event={ev} variant="grid" />
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      {/* Live Event Discovery Spotlight Section */}
      <section className="py-16 md:py-24 bg-white border-y border-[#E8E5DF]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-[#171923] via-[#1E2230] to-[#171923] text-white rounded-3xl p-8 sm:p-12 lg:p-16 shadow-[0_20px_60px_rgba(23,25,35,0.15)] relative overflow-hidden">
            {/* Ambient background glow */}
            <div
              aria-hidden="true"
              className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-[#5146E5]/30 blur-3xl pointer-events-none"
            />

            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
              <div className="lg:col-span-7 space-y-6">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md text-[#DDD6FE] text-xs font-semibold uppercase tracking-wider border border-white/15">
                  <Globe2 className="w-3.5 h-3.5 text-[#A7F3D0]" />
                  <span>Real-Time Web Intelligence</span>
                </div>

                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-[1.15]">
                  Search every tech gathering across the web in one place.
                </h2>

                <p className="text-base sm:text-lg text-[#9CA3AF] leading-relaxed max-w-xl">
                  Can&apos;t find an event on our native roster? EventScout connects directly to live web search data to bring you tech meetups, hackathons, and conferences happening across India in real time.
                </p>

                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <Link
                    href="/discover"
                    className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-[#5146E5] hover:bg-[#4338CA] text-white text-sm font-semibold rounded-xl shadow-xs transition-all active:scale-[0.99]"
                  >
                    <Compass className="w-4 h-4" />
                    <span>Launch Live Discovery</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>

                  <Link
                    href="/signup"
                    className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-white/10 hover:bg-white/15 text-white text-sm font-semibold rounded-xl border border-white/20 transition-all"
                  >
                    <span>Import Events as Host</span>
                  </Link>
                </div>
              </div>

              {/* Discovery Feature Points Column */}
              <div className="lg:col-span-5 space-y-4">
                <div className="p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm space-y-2">
                  <div className="flex items-center gap-2 text-sm font-bold text-white">
                    <CheckCircle2 className="w-4.5 h-4.5 text-[#059669]" />
                    <span>Verified Date & Domain Badging</span>
                  </div>
                  <p className="text-xs text-[#9CA3AF] leading-relaxed">
                    Our relevance algorithm flags confirmed dates and source domains so you never show up to outdated gatherings.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm space-y-2">
                  <div className="flex items-center gap-2 text-sm font-bold text-white">
                    <CheckCircle2 className="w-4.5 h-4.5 text-[#059669]" />
                    <span>One-Click Host Draft Import</span>
                  </div>
                  <p className="text-xs text-[#9CA3AF] leading-relaxed">
                    Found an event on the web? Organizers can import external event details directly into an EventScout draft with full source attribution.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm space-y-2">
                  <div className="flex items-center gap-2 text-sm font-bold text-white">
                    <CheckCircle2 className="w-4.5 h-4.5 text-[#059669]" />
                    <span>City-Level Filtering</span>
                  </div>
                  <p className="text-xs text-[#9CA3AF] leading-relaxed">
                    Filter by Bengaluru, Delhi NCR, Mumbai, Hyderabad, Pune, or nation-wide virtual symposiums.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How EventScout Works: 3 Step Visual Journey */}
      <section id="how-it-works" className="py-16 md:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <span className="text-xs font-semibold text-[#5146E5] uppercase tracking-wider">
            Simple & Purpose-Built
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#171923]">
            How EventScout Works
          </h2>
          <p className="text-[#686D78] text-base leading-relaxed">
            A frictionless platform built for attendees seeking genuine community and organizers demanding reliability.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {/* Step 1 */}
          <div className="bg-white border border-[#E8E5DF] rounded-3xl p-8 space-y-5 shadow-xs relative">
            <div className="w-12 h-12 rounded-2xl bg-[#EEEAFE] text-[#5146E5] flex items-center justify-center font-bold text-lg">
              1
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-[#171923]">Discover Gatherings</h3>
              <p className="text-sm text-[#686D78] leading-relaxed">
                Filter verified events by category, date, and city, or query live web results to find relevant hackathons and meetups.
              </p>
            </div>
            <div className="pt-2 text-xs font-semibold text-[#5146E5] flex items-center gap-1.5">
              <span>Instant search indexing</span>
            </div>
          </div>

          {/* Step 2 */}
          <div className="bg-white border border-[#E8E5DF] rounded-3xl p-8 space-y-5 shadow-xs relative">
            <div className="w-12 h-12 rounded-2xl bg-[#EEEAFE] text-[#5146E5] flex items-center justify-center font-bold text-lg">
              2
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-[#171923]">RSVP with Confidence</h3>
              <p className="text-sm text-[#686D78] leading-relaxed">
                Reserve your spot in seconds. Automated capacity locks ensure events never overbook, with instant ticket tracking in your dashboard.
              </p>
            </div>
            <div className="pt-2 text-xs font-semibold text-[#5146E5] flex items-center gap-1.5">
              <span>Concurrency-safe seats</span>
            </div>
          </div>

          {/* Step 3 */}
          <div className="bg-white border border-[#E8E5DF] rounded-3xl p-8 space-y-5 shadow-xs relative">
            <div className="w-12 h-12 rounded-2xl bg-[#EEEAFE] text-[#5146E5] flex items-center justify-center font-bold text-lg">
              3
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-[#171923]">Host & Grow Community</h3>
              <p className="text-sm text-[#686D78] leading-relaxed">
                Publish high-converting invitation pages, track registration velocity, manage attendee rosters, and export formula-safe CSVs.
              </p>
            </div>
            <div className="pt-2 text-xs font-semibold text-[#5146E5] flex items-center gap-1.5">
              <span>Full organizer dashboard</span>
            </div>
          </div>
        </div>
      </section>

      {/* Why EventScout: Platform Capabilities Grid */}
      <section className="py-16 md:py-24 bg-white border-t border-[#E8E5DF]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto text-center mb-16 space-y-3">
            <span className="text-xs font-semibold text-[#5146E5] uppercase tracking-wider">
              Engineering Excellence
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#171923]">
              Everything You Need to Run Inspiring Events
            </h2>
            <p className="text-[#686D78] text-base leading-relaxed">
              Carefully engineered with production guarantees, clean data models, and high security standards.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-[#FAF9F6] border border-[#E8E5DF] space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#EEEAFE] text-[#5146E5] flex items-center justify-center">
                <Globe2 className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-[#171923]">Live Web Event Discovery</h3>
              <p className="text-xs text-[#686D78] leading-relaxed">
                Integrated with SerpApi to surface regional conferences, workshops, and hackathons across the web with real-time rate limiting.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#FAF9F6] border border-[#E8E5DF] space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#EEEAFE] text-[#5146E5] flex items-center justify-center">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-[#171923]">Organized Event Hosting</h3>
              <p className="text-xs text-[#686D78] leading-relaxed">
                Launch bespoke event landing pages with custom cover photos, deadline enforcements, venue metadata, and slug-based shareable URLs.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#FAF9F6] border border-[#E8E5DF] space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#EEEAFE] text-[#5146E5] flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-[#171923]">Capacity-Aware Registration</h3>
              <p className="text-xs text-[#686D78] leading-relaxed">
                Strict MongoDB transaction boundaries guarantee events cannot be overbooked even during registration spikes.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#FAF9F6] border border-[#E8E5DF] space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#EEEAFE] text-[#5146E5] flex items-center justify-center">
                <BarChart3 className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-[#171923]">Host Workspace Analytics</h3>
              <p className="text-xs text-[#686D78] leading-relaxed">
                Monitor attendee counts, track upcoming deadlines, close registrations on demand, and oversee your entire event catalog.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#FAF9F6] border border-[#E8E5DF] space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#EEEAFE] text-[#5146E5] flex items-center justify-center">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-[#171923]">Formula-Sanitized CSV Exports</h3>
              <p className="text-xs text-[#686D78] leading-relaxed">
                Download verified attendee rosters anytime. All exports are sanitized against spreadsheet formula injection attacks.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#FAF9F6] border border-[#E8E5DF] space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#EEEAFE] text-[#5146E5] flex items-center justify-center">
                <Share2 className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-[#171923]">Cloudinary Poster Management</h3>
              <p className="text-xs text-[#686D78] leading-relaxed">
                Seamless image upload pipeline with automatic format optimization, aspect ratio scaling, and curated fallback photography.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Host Call to Action Banner */}
      <section className="py-16 md:py-24 bg-[#FAF9F6] border-t border-[#E8E5DF]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-[#171923] rounded-3xl p-8 sm:p-14 lg:p-16 text-center text-white relative overflow-hidden shadow-2xl">
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-[radial-gradient(#5146E5_1px,transparent_1px)] [background-size:24px_24px] opacity-15 pointer-events-none"
            />

            <div className="relative z-10 max-w-2xl mx-auto space-y-6">
              <span className="inline-flex px-3.5 py-1.5 rounded-full bg-white/10 text-[#DDD6FE] text-xs font-semibold uppercase tracking-wider border border-white/15">
                Organize Your Next Meetup
              </span>

              <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
                Bring your community together.
              </h2>

              <p className="text-base sm:text-lg text-[#9CA3AF] leading-relaxed">
                Create your event, share the details, and manage registrations from one place. Free to start, purpose-built for creators.
              </p>

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  href="/signup"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 bg-[#5146E5] hover:bg-[#4338CA] text-white text-base font-semibold rounded-2xl shadow-[0_4px_20px_rgba(81,70,229,0.4)] transition-all active:scale-[0.99]"
                >
                  <span>Start Hosting on EventScout</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <Link
                  href="/discover"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-4 bg-white/10 hover:bg-white/15 text-white text-base font-semibold rounded-2xl border border-white/20 transition-all"
                >
                  <span>Explore Discoveries</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Comprehensive Editorial Footer */}
      <footer className="bg-white border-t border-[#E8E5DF] pt-16 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-[#E8E5DF]">
            {/* Brand Column */}
            <div className="lg:col-span-2 space-y-4">
              <Link href="/" className="inline-flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#5146E5] flex items-center justify-center text-white shadow-xs">
                  <Compass className="w-4.5 h-4.5" />
                </div>
                <span className="font-bold text-xl tracking-tight text-[#171923]">
                  Event<span className="text-[#5146E5]">Scout</span>
                </span>
              </Link>
              <p className="text-sm text-[#686D78] leading-relaxed max-w-sm">
                The curated platform for discovering tech meetups, hackathons, and conferences across India, paired with robust RSVP management for organizers.
              </p>
              <div className="flex items-center gap-2 text-xs text-[#059669] font-medium">
                <span className="w-2 h-2 rounded-full bg-[#059669] animate-pulse" />
                <span>All systems operational</span>
              </div>
            </div>

            {/* Discover Column */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-[#171923] uppercase tracking-wider">
                Discover
              </h4>
              <ul className="space-y-2 text-sm text-[#686D78]">
                <li>
                  <Link href="/discover" className="hover:text-[#5146E5] transition-colors">
                    Live Event Search
                  </Link>
                </li>
                <li>
                  <Link href="/discover?category=Hackathons" className="hover:text-[#5146E5] transition-colors">
                    Hackathons & Sprints
                  </Link>
                </li>
                <li>
                  <Link href="/discover?category=Conferences" className="hover:text-[#5146E5] transition-colors">
                    Conferences & Summits
                  </Link>
                </li>
                <li>
                  <Link href="/discover?category=Meetups" className="hover:text-[#5146E5] transition-colors">
                    Community Meetups
                  </Link>
                </li>
              </ul>
            </div>

            {/* Hosting Column */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-[#171923] uppercase tracking-wider">
                Hosting
              </h4>
              <ul className="space-y-2 text-sm text-[#686D78]">
                <li>
                  <Link href="/signup" className="hover:text-[#5146E5] transition-colors">
                    Create Host Account
                  </Link>
                </li>
                <li>
                  <Link href="/dashboard" className="hover:text-[#5146E5] transition-colors">
                    Organizer Workspace
                  </Link>
                </li>
                <li>
                  <Link href="/events/new" className="hover:text-[#5146E5] transition-colors">
                    Publish New Gathering
                  </Link>
                </li>
                <li>
                  <Link href="/login" className="hover:text-[#5146E5] transition-colors">
                    Host Sign In
                  </Link>
                </li>
              </ul>
            </div>

            {/* Platform & Trust Column */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-[#171923] uppercase tracking-wider">
                Platform
              </h4>
              <ul className="space-y-2 text-sm text-[#686D78]">
                <li>
                  <Link href="/#how-it-works" className="hover:text-[#5146E5] transition-colors">
                    How EventScout Works
                  </Link>
                </li>
                <li>
                  <Link href="/#featured" className="hover:text-[#5146E5] transition-colors">
                    Featured Gatherings
                  </Link>
                </li>
                <li>
                  <Link href="/my-events" className="hover:text-[#5146E5] transition-colors">
                    Attendee Tickets
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#686D78]">
            <p>
              &copy; {new Date().getFullYear()} EventScout. Crafted for tech communities, organizers, and creators.
            </p>
            <div className="flex items-center gap-6">
              <span>Next.js 16 App Router</span>
              <span>•</span>
              <span>Tailwind CSS</span>
              <span>•</span>
              <span>MongoDB & NextAuth</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
