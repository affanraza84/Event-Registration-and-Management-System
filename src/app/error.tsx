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
    <div className="min-h-screen bg-[#FAF9F6] text-[#171923] flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full bg-white border border-[#E8E5DF] p-8 rounded-2xl shadow-[0_8px_30px_rgba(23,25,35,0.06)] text-center space-y-6">
        <div className="w-14 h-14 bg-[#FEF2F2] rounded-2xl flex items-center justify-center mx-auto text-[#DC2626]">
          <AlertTriangle className="w-7 h-7" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-[#171923]">
            Something went wrong
          </h1>
          <p className="text-sm text-[#686D78] leading-relaxed">
            An unexpected error occurred while rendering this view. Please try reloading or returning to the homepage.
          </p>
        </div>

        {error.digest && (
          <div className="bg-[#FAF9F6] border border-[#E8E5DF] rounded-xl px-3 py-2 text-xs text-[#686D78] font-mono">
            Error digest: {error.digest}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            onClick={() => reset()}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-white hover:bg-[#FAF9F6] border border-[#E8E5DF] text-[#171923] rounded-xl text-sm font-medium transition-all cursor-pointer shadow-2xs"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
          <Link
            href="/"
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[#5146E5] hover:bg-[#4338CA] text-white rounded-xl text-sm font-medium transition-all shadow-xs"
          >
            <Home className="w-4 h-4" />
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
