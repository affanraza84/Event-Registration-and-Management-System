import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import DiscoverClient from "./DiscoverClient";

export const metadata: Metadata = {
  title: "Live Event Discovery | EventScout",
  description:
    "Discover live hackathons, tech meetups, workshops, and developer conferences across India and globally powered by live web search.",
};

interface DiscoverPageProps {
  searchParams?: Promise<{
    q?: string;
    query?: string;
    location?: string;
    city?: string;
    category?: string;
    date?: string;
  }>;
}

export default async function DiscoverPage({ searchParams }: DiscoverPageProps) {
  const resolvedParams = searchParams ? await searchParams : {};

  const initialValues = {
    query: resolvedParams.q || resolvedParams.query || "",
    location: resolvedParams.location || resolvedParams.city || "",
    category: resolvedParams.category || "",
    date: resolvedParams.date || "",
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col relative overflow-hidden">
      {/* Background ambient gradient glow effects */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[720px] h-[450px] bg-purple-600/10 rounded-full blur-[140px] pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute top-1/3 right-10 w-96 h-96 bg-amber-500/5 rounded-full blur-[140px] pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute bottom-1/4 left-10 w-96 h-96 bg-indigo-600/5 rounded-full blur-[140px] pointer-events-none"
        aria-hidden="true"
      />

      <Navbar />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-10 z-10">
        <DiscoverClient initialValues={initialValues} />
      </main>
    </div>
  );
}
