"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  Plus,
  ChevronDown,
  LayoutDashboard,
  LogOut,
  Ticket,
  Compass,
  Loader2,
  Sparkles,
  Menu,
  X,
} from "lucide-react";

export default function Navbar() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [prevPathname, setPrevPathname] = useState(pathname);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown if clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Close mobile menu when pathname changes
  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    setMobileMenuOpen(false);
  }

  const isHost = session?.user?.role === "host";

  return (
    <nav className="border-b border-[#E8E5DF] bg-[#FAF9F6]/90 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18">
          {/* Brand mark & Desktop Links */}
          <div className="flex items-center gap-6 xl:gap-8 min-w-0">
            <Link
              href="/"
              className="flex items-center gap-2.5 group focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5146E5] rounded-lg shrink-0"
            >
              <div className="w-8 h-8 rounded-lg bg-[#5146E5] flex items-center justify-center text-white shadow-xs transition-transform duration-150 group-hover:scale-105 shrink-0">
                <Compass className="w-4.5 h-4.5" />
              </div>
              <span className="font-semibold text-xl tracking-tight text-[#171923] whitespace-nowrap">
                Event<span className="text-[#5146E5]">Scout</span>
              </span>
            </Link>

            {/* Desktop Navigation Links (Visible on lg: 1024px+) */}
            <div className="hidden lg:flex items-center gap-1 xl:gap-1.5 shrink-0">
              <Link
                href="/discover"
                className={`text-sm font-medium px-3.5 py-2 rounded-xl transition-all whitespace-nowrap ${
                  pathname === "/discover"
                    ? "bg-[#EEEAFE] text-[#5146E5] font-semibold"
                    : "text-[#686D78] hover:text-[#171923] hover:bg-[#F2EFE9]"
                }`}
              >
                Discover Events
              </Link>
              <Link
                href="/#featured"
                className={`text-sm font-medium px-3.5 py-2 rounded-xl transition-all whitespace-nowrap ${
                  pathname === "/"
                    ? "text-[#171923] hover:bg-[#F2EFE9]"
                    : "text-[#686D78] hover:text-[#171923] hover:bg-[#F2EFE9]"
                }`}
              >
                Featured Gatherings
              </Link>
              <Link
                href="/#how-it-works"
                className="text-sm font-medium px-3.5 py-2 rounded-xl text-[#686D78] hover:text-[#171923] hover:bg-[#F2EFE9] transition-all whitespace-nowrap"
              >
                How It Works
              </Link>
            </div>
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center gap-2 sm:gap-2.5 lg:gap-3 shrink-0">
            {status === "loading" && (
              <div className="flex items-center justify-center w-8 h-8 text-[#686D78]">
                <Loader2 className="w-4 h-4 animate-spin text-[#5146E5]" />
              </div>
            )}

            {status === "unauthenticated" && (
              <>
                <Link
                  href="/login"
                  className="hidden sm:inline-flex text-sm font-medium text-[#686D78] hover:text-[#171923] px-3 py-2 rounded-xl transition-colors whitespace-nowrap shrink-0"
                >
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  className="hidden sm:inline-flex items-center justify-center text-sm font-medium px-3.5 lg:px-4 py-2 bg-white text-[#171923] border border-[#E8E5DF] hover:border-[#D5D1C8] hover:bg-[#FAF9F6] rounded-xl shadow-xs transition-all duration-150 whitespace-nowrap shrink-0"
                >
                  Host an Event
                </Link>
                <Link
                  href="/discover"
                  className="inline-flex items-center justify-center gap-1.5 text-sm font-medium px-3.5 lg:px-4.5 py-2 bg-[#5146E5] text-white hover:bg-[#4338CA] rounded-xl shadow-xs transition-all duration-150 active:scale-[0.99] whitespace-nowrap shrink-0"
                >
                  <Compass className="w-4 h-4 shrink-0" />
                  <span>Explore</span>
                </Link>
              </>
            )}

            {status === "authenticated" && session?.user && (
              <>
                {/* Host Quick Create */}
                {isHost && (
                  <Link
                    href="/events/new"
                    className="inline-flex items-center gap-1.5 px-3 lg:px-3.5 py-2 bg-[#5146E5] hover:bg-[#4338CA] text-white text-sm font-medium rounded-xl shadow-xs transition-all duration-150 active:scale-[0.99] whitespace-nowrap shrink-0"
                  >
                    <Plus className="w-4 h-4 shrink-0" />
                    <span className="hidden sm:inline">Create Event</span>
                    <span className="sm:hidden">Create</span>
                  </Link>
                )}

                {/* Account Dropdown */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setDropdownOpen((prev) => !prev)}
                    className="flex items-center gap-2 pl-1.5 sm:pl-2 pr-2 sm:pr-3 py-1.5 bg-white hover:bg-[#FAF9F6] border border-[#E8E5DF] hover:border-[#D5D1C8] rounded-xl transition-all text-sm font-medium text-[#171923] shadow-xs cursor-pointer focus-visible:outline-2 focus-visible:outline-[#5146E5] shrink-0"
                    aria-expanded={dropdownOpen}
                    aria-label="User menu"
                  >
                    <div className="w-6.5 h-6.5 rounded-full bg-[#EEEAFE] text-[#5146E5] flex items-center justify-center text-xs font-semibold uppercase shrink-0">
                      {session.user.name ? session.user.name[0] : "U"}
                    </div>
                    <span className="max-w-[80px] sm:max-w-[120px] truncate text-sm font-medium hidden sm:inline">
                      {session.user.name || "Account"}
                    </span>
                    <ChevronDown
                      className={`w-3.5 h-3.5 text-[#686D78] transition-transform duration-150 shrink-0 ${
                        dropdownOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {/* Dropdown Card */}
                  {dropdownOpen && (
                    <div className="absolute right-0 mt-2 w-64 bg-white border border-[#E8E5DF] rounded-2xl shadow-[0_12px_32px_rgba(23,25,35,0.08)] p-2 z-50 animate-fade-in">
                      <div className="px-3.5 py-3 border-b border-[#E8E5DF] mb-1.5">
                        <div className="font-medium text-sm text-[#171923] truncate">
                          {session.user.name}
                        </div>
                        <div className="text-xs text-[#686D78] truncate mb-2">
                          {session.user.email}
                        </div>
                        <span className="inline-flex px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-md border border-[#E8E5DF] bg-[#FAF9F6] text-[#686D78]">
                          {session.user.role} account
                        </span>
                      </div>

                      <div className="space-y-0.5">
                        {isHost ? (
                          <>
                            <Link
                              href="/dashboard"
                              onClick={() => setDropdownOpen(false)}
                              className="flex items-center gap-2.5 px-3 py-2 text-sm text-[#171923] hover:bg-[#FAF9F6] rounded-lg transition-colors"
                            >
                              <LayoutDashboard className="w-4 h-4 text-[#5146E5]" />
                              Host Dashboard
                            </Link>
                            <Link
                              href="/events/new"
                              onClick={() => setDropdownOpen(false)}
                              className="flex items-center gap-2.5 px-3 py-2 text-sm text-[#171923] hover:bg-[#FAF9F6] rounded-lg transition-colors"
                            >
                              <Plus className="w-4 h-4 text-[#5146E5]" />
                              Create Event
                            </Link>
                          </>
                        ) : (
                          <Link
                            href="/my-events"
                            onClick={() => setDropdownOpen(false)}
                            className="flex items-center gap-2.5 px-3 py-2 text-sm text-[#171923] hover:bg-[#FAF9F6] rounded-lg transition-colors"
                          >
                            <Ticket className="w-4 h-4 text-[#5146E5]" />
                            My Registrations
                          </Link>
                        )}

                        <Link
                          href="/discover"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 text-sm text-[#171923] hover:bg-[#FAF9F6] rounded-lg transition-colors"
                        >
                          <Sparkles className="w-4 h-4 text-[#5146E5]" />
                          Discover Live Events
                        </Link>

                        <div className="pt-1.5 border-t border-[#E8E5DF] mt-1">
                          <button
                            onClick={() => {
                              setDropdownOpen(false);
                              signOut({ callbackUrl: "/" });
                            }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-[#DC2626] hover:bg-[#FEF2F2] rounded-lg transition-colors text-left cursor-pointer"
                          >
                            <LogOut className="w-4 h-4" />
                            Sign Out
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Mobile / Tablet Menu Button (Visible on screens < lg: 1024px) */}
            <button
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className="lg:hidden p-2 rounded-xl text-[#686D78] hover:text-[#171923] hover:bg-[#F2EFE9] border border-transparent hover:border-[#E8E5DF] transition-colors shrink-0 cursor-pointer"
              aria-label="Toggle navigation menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile & Tablet Menu Drawer (screens < lg) */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-[#E8E5DF] bg-[#FAF9F6] px-4 sm:px-6 pt-3 pb-6 space-y-4 animate-fade-in shadow-md">
          {/* Nav links */}
          <div className="space-y-1">
            <Link
              href="/discover"
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                pathname === "/discover"
                  ? "bg-[#EEEAFE] text-[#5146E5] font-semibold"
                  : "text-[#171923] hover:bg-white"
              }`}
            >
              <Compass className="w-4 h-4 text-[#5146E5]" />
              <span>Discover Events</span>
            </Link>
            <Link
              href="/#featured"
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                pathname === "/"
                  ? "text-[#171923] hover:bg-white"
                  : "text-[#686D78] hover:text-[#171923] hover:bg-white"
              }`}
            >
              <Sparkles className="w-4 h-4 text-[#5146E5]" />
              <span>Featured Gatherings</span>
            </Link>
            <Link
              href="/#how-it-works"
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-[#686D78] hover:text-[#171923] hover:bg-white transition-all"
            >
              <Ticket className="w-4 h-4 text-[#5146E5]" />
              <span>How It Works</span>
            </Link>
          </div>

          {/* Unauthenticated actions in drawer */}
          {status === "unauthenticated" && (
            <div className="pt-3 border-t border-[#E8E5DF] flex flex-col sm:flex-row gap-2.5">
              <Link
                href="/login"
                className="flex items-center justify-center flex-1 px-4 py-2.5 text-sm font-medium text-[#171923] bg-white border border-[#E8E5DF] hover:border-[#D5D1C8] rounded-xl transition-all shadow-xs"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                className="flex items-center justify-center flex-1 px-4 py-2.5 text-sm font-medium text-white bg-[#5146E5] hover:bg-[#4338CA] rounded-xl transition-all shadow-xs"
              >
                Host an Event
              </Link>
            </div>
          )}

          {/* Authenticated actions in drawer */}
          {status === "authenticated" && session?.user && (
            <div className="pt-3 border-t border-[#E8E5DF] space-y-2">
              <div className="flex items-center gap-2.5 px-3 py-2 bg-white border border-[#E8E5DF] rounded-xl">
                <div className="w-8 h-8 rounded-full bg-[#EEEAFE] text-[#5146E5] flex items-center justify-center text-xs font-semibold uppercase shrink-0">
                  {session.user.name ? session.user.name[0] : "U"}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-[#171923] truncate">
                    {session.user.name}
                  </p>
                  <p className="text-xs text-[#686D78] truncate">{session.user.email}</p>
                </div>
                <span className="inline-flex px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-md border border-[#E8E5DF] bg-[#FAF9F6] text-[#686D78] shrink-0">
                  {session.user.role}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                {isHost ? (
                  <>
                    <Link
                      href="/dashboard"
                      className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium text-[#171923] bg-white border border-[#E8E5DF] hover:bg-[#FAF9F6] transition-colors"
                    >
                      <LayoutDashboard className="w-4 h-4 text-[#5146E5]" />
                      <span>Host Dashboard</span>
                    </Link>
                    <Link
                      href="/events/new"
                      className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium text-white bg-[#5146E5] hover:bg-[#4338CA] transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Create Event</span>
                    </Link>
                  </>
                ) : (
                  <Link
                    href="/my-events"
                    className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium text-[#171923] bg-white border border-[#E8E5DF] hover:bg-[#FAF9F6] transition-colors"
                  >
                    <Ticket className="w-4 h-4 text-[#5146E5]" />
                    <span>My Registrations</span>
                  </Link>
                )}
              </div>

              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-[#DC2626] bg-[#FEF2F2] hover:bg-[#FEE2E2] rounded-xl transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
