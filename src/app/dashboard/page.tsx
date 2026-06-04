"use client";

import { useSession, signOut } from "next-auth/react";
import { LogOut, Calendar, Users, Shield } from "lucide-react";

export default function DashboardPage() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-950">
        <div className="text-neutral-400 text-sm animate-pulse">
          Loading dashboard...
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col">
      {/* Header */}
      <header className="border-b border-neutral-900 bg-neutral-900/20 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">
            Luma Dashboard
          </span>
          <span className="px-2.5 py-0.5 text-xs font-semibold bg-purple-950/60 text-purple-300 border border-purple-900/60 rounded-full flex items-center gap-1">
            <Shield className="w-3.5 h-3.5" />
            Host
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-neutral-300">
            Welcome, <strong>{session.user.name}</strong> ({session.user.email})
          </span>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex items-center gap-2 px-3 py-1.5 bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 hover:border-neutral-700 text-sm font-medium rounded-lg transition-all"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-8 max-w-7xl mx-auto w-full">
        <h1 className="text-3xl font-bold tracking-tight mb-8">Host Management</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-neutral-900/40 border border-neutral-800/80 rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-purple-400">
              <Calendar className="w-5 h-5" />
              Your Hosted Events
            </h2>
            <p className="text-neutral-400 text-sm mb-6">
              Manage existing events, create new ones, and track registration counts.
            </p>
            <div className="border border-dashed border-neutral-800/80 rounded-lg p-8 text-center text-neutral-500">
              Event creation is not available in this foundation build.
            </div>
          </div>

          <div className="bg-neutral-900/40 border border-neutral-800/80 rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-indigo-400">
              <Users className="w-5 h-5" />
              Registration Activity
            </h2>
            <p className="text-neutral-400 text-sm mb-6">
              Monitor attendees registering for your hosted events.
            </p>
            <div className="border border-dashed border-neutral-800/80 rounded-lg p-8 text-center text-neutral-500">
              Registration tracking is not available in this foundation build.
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
