import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import CreateEventForm from "./CreateEventForm";
import Navbar from "@/components/Navbar";
import Link from "next/link";
import { ShieldAlert, ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Create Event | EventScout",
  description: "Host a new experience and manage registrations on EventScout.",
};

interface NewEventPageProps {
  searchParams?: Promise<{
    importSource?: string;
    title?: string;
    description?: string;
    location?: string;
    date?: string;
    sourceUrl?: string;
    category?: string;
  }>;
}

export default async function NewEventPage({ searchParams }: NewEventPageProps) {
  const resolvedParams = searchParams ? await searchParams : {};
  const session = await getServerSession(authOptions);

  if (!session) {
    const queryStr = new URLSearchParams(
      Object.entries(resolvedParams).filter(([, v]) => typeof v === "string" && v.length > 0)
    ).toString();
    const callback = queryStr ? `/events/new?${queryStr}` : "/events/new";
    redirect(`/login?callbackUrl=${encodeURIComponent(callback)}`);
  }

  if (session.user.role !== "host") {
    return (
      <div className="min-h-screen bg-[#FAF9F6] text-[#171923] flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white border border-[#E8E5DF] rounded-2xl p-8 text-center space-y-5 shadow-xs">
            <div className="w-12 h-12 bg-[#FFFBEB] rounded-2xl flex items-center justify-center mx-auto text-[#D97706]">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div className="space-y-2">
              <h1 className="text-xl font-bold text-[#171923]">Host Account Required</h1>
              <p className="text-sm text-[#686D78] leading-relaxed">
                You are currently signed in as an <strong className="text-[#171923]">Attendee</strong>.
                Only registered hosts can review drafts and publish events to EventScout.
              </p>
            </div>
            <div className="flex flex-col gap-3 pt-2">
              <Link
                href="/login?error=Please log in with a host account"
                className="w-full py-2.5 bg-[#5146E5] hover:bg-[#4338CA] text-white rounded-xl text-sm font-semibold transition-all shadow-xs"
              >
                Sign In with Host Account
              </Link>
              <Link
                href="/discover"
                className="inline-flex items-center justify-center gap-1.5 w-full py-2.5 bg-white hover:bg-[#FAF9F6] border border-[#E8E5DF] text-[#171923] rounded-xl text-sm transition-all shadow-2xs"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Discovery
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <CreateEventForm initialDraft={resolvedParams} />;
}
