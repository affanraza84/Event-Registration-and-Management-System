import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { getHostDashboardDataAction } from "@/actions/events";
import DashboardClient from "./DashboardClient";

export const metadata = {
  title: "Host Dashboard | Luma",
  description: "Manage your hosted experiences, RSVPs, and attendees.",
};

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login?callbackUrl=/dashboard");
  }

  if (session.user.role !== "host") {
    redirect("/my-events");
  }

  const result = await getHostDashboardDataAction();

  if (result.error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-950 text-neutral-100 p-4">
        <div className="text-center p-8 bg-neutral-900 border border-neutral-800 rounded-2xl max-w-md shadow-2xl">
          <h2 className="text-xl font-bold text-red-500 mb-2">
            Error Loading Dashboard
          </h2>
          <p className="text-neutral-400 text-sm mb-6">{result.error}</p>
          <a
            href="/dashboard"
            className="inline-block px-5 py-2.5 bg-purple-600 hover:bg-purple-500 rounded-xl text-white text-sm font-medium transition-all"
          >
            Retry
          </a>
        </div>
      </div>
    );
  }

  return (
    <DashboardClient
      initialAnalytics={
        result.analytics || {
          totalEvents: 0,
          totalAttendees: 0,
          upcomingEvents: 0,
        }
      }
      initialEvents={result.events || []}
      initialRegistrations={result.registrations || []}
      session={session}
    />
  );
}
