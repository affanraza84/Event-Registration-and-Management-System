"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application error boundary caught error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-red-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-1/3 right-1/4 w-72 h-72 bg-purple-600/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="relative z-10 max-w-md w-full bg-neutral-900/80 border border-neutral-800 backdrop-blur-xl p-8 rounded-2xl shadow-2xl text-center space-y-6">
        <div className="w-14 h-14 bg-red-950/60 border border-red-800/60 rounded-2xl flex items-center justify-center mx-auto text-red-400">
          <AlertTriangle className="w-7 h-7" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-neutral-100">
            Something went wrong
          </h1>
          <p className="text-sm text-neutral-400 leading-relaxed">
            An unexpected error occurred while processing this page. If you just deployed, make sure your environment variables (like <code className="text-xs bg-neutral-800 px-1 py-0.5 rounded text-neutral-300">MONGODB_URI</code>) are configured.
          </p>
        </div>

        {error.digest && (
          <div className="bg-neutral-950/60 border border-neutral-800/60 rounded-xl px-3 py-2 text-xs text-neutral-400 font-mono">
            Error digest: {error.digest}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            onClick={() => reset()}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 hover:text-white rounded-xl text-sm font-medium transition-all cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
          <Link
            href="/"
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-sm font-medium transition-all shadow-md shadow-purple-950/30"
          >
            <Home className="w-4 h-4" />
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
