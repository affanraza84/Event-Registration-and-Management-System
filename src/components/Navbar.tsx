"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import {
  User,
  Plus,
  ChevronDown,
  LayoutDashboard,
  LogOut,
  Ticket,
  Compass,
  Loader2,
} from "lucide-react";

export default function Navbar() {
  const { data: session, status } = useSession();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown if clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <nav className="border-b border-neutral-900 bg-neutral-950/40 backdrop-blur-md px-6 py-4 flex items-center justify-between z-50 sticky top-0">
      {/* Brand logo */}
      <Link
        href="/"
        className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-purple-400 via-pink-500 to-amber-400 bg-clip-text text-transparent hover:opacity-90 transition-opacity"
      >
        Luma
      </Link>

      <div className="flex items-center gap-4">
        {status === "loading" && (
          <div className="flex items-center justify-center w-8 h-8">
            <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
          </div>
        )}

        {status === "unauthenticated" && (
          <div className="flex items-center gap-4 animate-fade-in">
            <Link
              href="/login"
              className="text-sm font-medium text-neutral-450 hover:text-neutral-200 transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-sm font-medium rounded-xl transition-all shadow-md shadow-purple-950/20 hover:scale-[1.02] active:scale-[0.98]"
            >
              Create Account
            </Link>
          </div>
        )}

        {status === "authenticated" && session?.user && (
          <div className="flex items-center gap-4 animate-fade-in">
            {/* Quick Action Button for Host: Create Event */}
            {session.user.role === "host" && (
              <Link
                href="/events/new"
                className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-sm font-medium rounded-xl transition-all shadow-md hover:scale-[1.02] active:scale-[0.98]"
              >
                <Plus className="w-4 h-4" />
                Create Event
              </Link>
            )}

            {/* Profile Dropdown Trigger */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen((prev) => !prev)}
                className="flex items-center gap-2 px-3 py-1.5 bg-neutral-900/80 hover:bg-neutral-850 border border-neutral-800 hover:border-neutral-700 rounded-xl transition-all text-sm font-medium cursor-pointer"
              >
                <div className="w-6 h-6 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 flex items-center justify-center text-xs font-bold text-white uppercase shadow-sm">
                  {session.user.name ? session.user.name[0] : "U"}
                </div>
                <span className="max-w-[120px] truncate hidden md:inline text-neutral-200">
                  {session.user.name}
                </span>
                <ChevronDown className={`w-4 h-4 text-neutral-400 transition-transform duration-200 ${dropdownOpen ? "rotate-180" : ""}`} />
              </button>

              {/* Dropdown Menu */}
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-neutral-900/95 backdrop-blur-xl border border-neutral-800/80 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  {/* User Info Header */}
                  <div className="px-4 py-3 border-b border-neutral-800/60 mb-2">
                    <div className="font-semibold text-sm text-neutral-100 truncate">
                      {session.user.name}
                    </div>
                    <div className="text-xs text-neutral-500 truncate mb-2">
                      {session.user.email}
                    </div>
                    <span className={`inline-flex px-2 py-0.5 text-[10px] font-bold uppercase rounded-md tracking-wider border ${
                      session.user.role === "host"
                        ? "bg-purple-950/60 text-purple-300 border-purple-900/60"
                        : "bg-indigo-950/60 text-indigo-300 border-indigo-900/60"
                    }`}>
                      {session.user.role}
                    </span>
                  </div>

                  {/* Menu Options */}
                  <div className="space-y-1">
                    {session.user.role === "host" ? (
                      <>
                        <Link
                          href="/dashboard"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 text-sm text-neutral-300 hover:text-white hover:bg-neutral-800 rounded-lg transition-all"
                        >
                          <LayoutDashboard className="w-4 h-4 text-purple-400" />
                          Host Dashboard
                        </Link>
                        <Link
                          href="/events/new"
                          onClick={() => setDropdownOpen(false)}
                          className="flex sm:hidden items-center gap-2.5 px-3 py-2 text-sm text-neutral-300 hover:text-white hover:bg-neutral-800 rounded-lg transition-all"
                        >
                          <Plus className="w-4 h-4 text-purple-400" />
                          Create Event
                        </Link>
                      </>
                    ) : (
                      <>
                        <Link
                          href="/my-events"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 text-sm text-neutral-300 hover:text-white hover:bg-neutral-800 rounded-lg transition-all"
                        >
                          <Ticket className="w-4 h-4 text-indigo-400" />
                          My Registrations
                        </Link>
                      </>
                    )}

                    <Link
                      href="/"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-sm text-neutral-300 hover:text-white hover:bg-neutral-800 rounded-lg transition-all"
                    >
                      <Compass className="w-4 h-4 text-neutral-400" />
                      Browse Gatherings
                    </Link>

                    {/* Sign out */}
                    <button
                      onClick={() => {
                        setDropdownOpen(false);
                        signOut({ callbackUrl: "/" });
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-400 hover:text-red-350 hover:bg-red-950/20 rounded-lg transition-all text-left cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
