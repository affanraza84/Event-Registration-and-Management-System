import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import DiscoverClient from "./DiscoverClient";

export const metadata: Metadata = {
  title: "Live Event Discovery | EventScout",
  description:
    "Discover live hackathons, tech meetups, workshops, and developer conferences across India powered by live web search.",
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
    <div className="min-h-screen bg-[#FAF9F6] text-[#171923] flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <DiscoverClient initialValues={initialValues} />
      </main>
    </div>
  );
}
