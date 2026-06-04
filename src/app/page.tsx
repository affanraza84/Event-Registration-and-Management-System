import Link from "next/link";
import { Sparkles, Calendar, ArrowRight, ShieldCheck, Ticket } from "lucide-react";

export default function Home() {
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-neutral-950 px-4">
      {/* Background blobs for premium glow effect */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-amber-500/5 rounded-full blur-[140px] pointer-events-none" />

      {/* Main Content */}
      <main className="z-10 text-center max-w-2xl px-6 flex flex-col items-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-950/40 border border-purple-800/40 rounded-full text-purple-300 text-xs font-semibold mb-6">
          <Sparkles className="w-3.5 h-3.5" />
          Foundation Build Complete
        </div>

        <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight mb-6">
          <span className="bg-gradient-to-r from-purple-400 via-pink-500 to-amber-400 bg-clip-text text-transparent">
            Luma
          </span>
        </h1>

        <p className="text-xl text-neutral-300 font-light leading-relaxed mb-8">
          The elegant platform for hosting memorable experiences, managing RSVPs, and registering for events.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
          <Link
            href="/login"
            className="flex items-center justify-center gap-2 px-8 py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-medium rounded-xl transition-all shadow-lg shadow-purple-950/20 hover:scale-[1.02] active:scale-[0.98]"
          >
            Get Started
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/signup"
            className="flex items-center justify-center gap-2 px-8 py-3.5 bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 hover:border-neutral-700 text-neutral-200 font-medium rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            Create Account
          </Link>
        </div>

        {/* Feature Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-16 border-t border-neutral-900 pt-12 w-full text-left">
          <div className="space-y-2">
            <div className="p-2 w-fit bg-purple-950/50 border border-purple-900/50 rounded-lg text-purple-400">
              <Calendar className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-neutral-200">Event Hosting</h3>
            <p className="text-neutral-400 text-sm">
              Create beautifully customized invitation pages and manage invite lists.
            </p>
          </div>
          <div className="space-y-2">
            <div className="p-2 w-fit bg-purple-950/50 border border-purple-900/50 rounded-lg text-purple-400">
              <Ticket className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-neutral-200">Attendee RSVPs</h3>
            <p className="text-neutral-400 text-sm">
              Register for events instantly and keep track of your registrations.
            </p>
          </div>
          <div className="space-y-2">
            <div className="p-2 w-fit bg-purple-950/50 border border-purple-900/50 rounded-lg text-purple-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-neutral-200">Secure Access</h3>
            <p className="text-neutral-400 text-sm">
              Bcrypt security and NextAuth route protection keep data safe.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

