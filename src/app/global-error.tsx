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
      <body className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col items-center justify-center p-6 antialiased font-sans">
        <div className="max-w-md w-full bg-neutral-900 border border-neutral-800 p-8 rounded-2xl shadow-2xl text-center space-y-6">
          <div className="w-14 h-14 bg-red-950/60 border border-red-800/60 rounded-2xl flex items-center justify-center mx-auto text-red-400">
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
            <h1 className="text-2xl font-bold tracking-tight text-neutral-100">
              Application Error
            </h1>
            <p className="text-sm text-neutral-400 leading-relaxed">
              A critical server error occurred. Please verify your environment configuration (such as database credentials) and reload.
            </p>
          </div>

          {error.digest && (
            <div className="bg-neutral-950/80 border border-neutral-800 px-3 py-2 rounded-xl text-xs text-neutral-400 font-mono">
              Error digest: {error.digest}
            </div>
          )}

          <div className="pt-2">
            <button
              onClick={() => reset()}
              className="w-full px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-sm font-semibold transition-all cursor-pointer shadow-lg shadow-purple-950/30"
            >
              Reload Page
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
