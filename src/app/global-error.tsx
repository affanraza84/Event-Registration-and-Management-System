"use client";

import { useEffect } from "react";
import "./globals.css";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global application error:", error);
  }, [error]);

  return (
    <html lang="en">
      <body className="min-h-screen bg-[#FAF9F6] text-[#171923] flex flex-col items-center justify-center p-6 antialiased font-sans">
        <div className="max-w-md w-full bg-white border border-[#E8E5DF] p-8 rounded-2xl shadow-[0_8px_30px_rgba(23,25,35,0.06)] text-center space-y-6">
          <div className="w-14 h-14 bg-[#FEF2F2] rounded-2xl flex items-center justify-center mx-auto text-[#DC2626]">
            <svg
              className="w-7 h-7"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight text-[#171923]">
              Application Error
            </h1>
            <p className="text-sm text-[#686D78] leading-relaxed">
              A critical server error occurred. Please verify your environment configuration and reload.
            </p>
          </div>

          {error.digest && (
            <div className="bg-[#FAF9F6] border border-[#E8E5DF] px-3 py-2 rounded-xl text-xs text-[#686D78] font-mono">
              Error digest: {error.digest}
            </div>
          )}

          <div className="pt-2">
            <button
              onClick={() => reset()}
              className="w-full px-5 py-2.5 bg-[#5146E5] hover:bg-[#4338CA] text-white rounded-xl text-sm font-semibold transition-all cursor-pointer shadow-xs"
            >
              Reload Page
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
