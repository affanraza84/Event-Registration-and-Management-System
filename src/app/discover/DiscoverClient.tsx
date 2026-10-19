"use client";

import { useState, useRef, useEffect, useCallback, useId, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Search,
  MapPin,
  Calendar,
  ExternalLink,
  Loader2,
  AlertCircle,
  Sparkles,
  Globe,
  RotateCcw,
  SlidersHorizontal,
  Compass,
  ArrowRight,
  Clock,
  FilePlus2,
  AlertTriangle,
  X,
  CheckCircle2,
} from "lucide-react";
import { IDiscoveredEvent, DiscoveryResponse } from "@/types/discovery";
import {
  evaluateDraftEligibility,
  buildDraftUrlParams,
} from "@/utils/draftHelper";
import { getEventCover } from "@/lib/eventCovers";

interface DiscoverClientProps {
  initialValues?: {
    query?: string;
    location?: string;
    category?: string;
    date?: string;
  };
}

interface ExampleQuery {
  label: string;
  query: string;
  location: string;
  category: string;
  date: string;
}

const EXAMPLE_QUERIES: ExampleQuery[] = [
  {
    label: "AI meetups in Bengaluru",
    query: "AI meetups",
    location: "Bengaluru",
    category: "AI",
    date: "",
  },
  {
    label: "Hackathons in India",
    query: "Hackathons",
    location: "India",
    category: "Hackathons",
    date: "",
  },
  {
    label: "Web development conferences in Mumbai",
    query: "Web development conferences",
    location: "Mumbai",
    category: "Web Development",
    date: "",
  },
  {
    label: "Student tech gatherings in Delhi NCR",
    query: "Student tech events",
    location: "Delhi NCR",
    category: "Student Events",
    date: "",
  },
];

const POPULAR_CATEGORIES = [
  "All Categories",
  "Hackathons",
  "AI & Machine Learning",
  "Web Development",
  "Cloud & DevOps",
  "Open Source",
  "Tech Meetups",
  "Student Events",
];

const POPULAR_CITIES = [
  "Bengaluru",
  "Delhi NCR",
  "Mumbai",
  "Hyderabad",
  "Pune",
  "Ranchi",
  "Kolkata",
  "India",
];

function getCategoryBadgeClass(category: string): string {
  switch (category) {
    case "Hackathons and competitions":
      return "bg-[#ECFDF5] text-[#059669] border-[#A7F3D0]";
    case "Meetups and networking":
      return "bg-[#EEEAFE] text-[#5146E5] border-[#DDD6FE]";
    case "Conferences and workshops":
      return "bg-[#F5F3FF] text-[#7C3AED] border-[#DDD6FE]";
    case "Student and campus events":
      return "bg-[#FFFBEB] text-[#D97706] border-[#FDE68A]";
    default:
      return "bg-[#FAF9F6] text-[#686D78] border-[#E8E5DF]";
  }
}

export default function DiscoverClient({ initialValues }: DiscoverClientProps) {
  // Unique accessible IDs for form controls
  const queryInputId = useId();
  const locationInputId = useId();
  const categorySelectId = useId();
  const dateInputId = useId();

  // Search input state
  const [query, setQuery] = useState(initialValues?.query || "");
  const [location, setLocation] = useState(initialValues?.location || "");
  const [category, setCategory] = useState(initialValues?.category || "");
  const [date, setDate] = useState(initialValues?.date || "");

  // Client-side category filter state
  const [selectedCategoryFilter, setSelectedCategoryFilter] =
    useState<string>("All");

  // Request & results state
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "empty" | "error"
  >("idle");
  const [results, setResults] = useState<IDiscoveredEvent[]>([]);
  const [searchMetadata, setSearchMetadata] = useState<{
    queryText: string;
    total: number;
    disclaimer: string;
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Router and draft modal state
  const router = useRouter();
  const [draftModalEvent, setDraftModalEvent] =
    useState<IDiscoveredEvent | null>(null);

  // References for request cancellation and race condition handling
  const abortControllerRef = useRef<AbortController | null>(null);
  const latestRequestIdRef = useRef<number>(0);

  // Compute category breakdown from currently active results
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { All: results.length };
    for (const ev of results) {
      counts[ev.category] = (counts[ev.category] || 0) + 1;
    }
    return counts;
  }, [results]);

  // Filter results client-side by selected category
  const filteredResults = useMemo(() => {
    if (selectedCategoryFilter === "All") return results;
    return results.filter((ev) => ev.category === selectedCategoryFilter);
  }, [results, selectedCategoryFilter]);

  const performSearch = useCallback(
    async (searchParams: {
      query: string;
      location: string;
      category: string;
      date: string;
    }) => {
      const trimmedQuery = searchParams.query.trim();
      const trimmedLocation = searchParams.location.trim();
      const trimmedCategory =
        searchParams.category === "All Categories"
          ? ""
          : searchParams.category.trim();
      const trimmedDate = searchParams.date.trim();

      if (!trimmedQuery && !trimmedLocation && !trimmedCategory) {
        setValidationError(
          "Please enter a topic keyword, city/location, or category to start searching."
        );
        return;
      }

      setValidationError(null);
      setErrorMessage(null);
      setSelectedCategoryFilter("All");

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const controller = new AbortController();
      abortControllerRef.current = controller;

      const currentRequestId = ++latestRequestIdRef.current;
      setStatus("loading");

      try {
        const response = await fetch("/api/discover", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            query: trimmedQuery || undefined,
            location: trimmedLocation || undefined,
            category: trimmedCategory || undefined,
            date: trimmedDate || undefined,
            limit: 12,
          }),
          signal: controller.signal,
        });

        if (currentRequestId !== latestRequestIdRef.current) {
          return;
        }

        const data: DiscoveryResponse & { error?: string; retryAfter?: number } =
          await response.json();

        if (!response.ok) {
          const apiError =
            data.error ||
            `Search request failed with status code ${response.status}.`;
          setErrorMessage(apiError);
          setStatus("error");
          setResults([]);
          return;
        }

        if (data.events && data.events.length > 0) {
          setResults(data.events);
          setSearchMetadata({
            queryText: data.searchQuery,
            total: data.totalResults,
            disclaimer:
              data.disclaimer ||
              "Google Search results are web discovery results, not verified event records.",
          });
          setStatus("success");
        } else {
          setResults([]);
          setSearchMetadata({
            queryText: data.searchQuery,
            total: 0,
            disclaimer: data.disclaimer || "",
          });
          setStatus("empty");
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.name === "AbortError") {
          return;
        }
        if (currentRequestId === latestRequestIdRef.current) {
          setErrorMessage(
            "Network error while connecting to Event Discovery Service. Please try again."
          );
          setStatus("error");
          setResults([]);
        }
      }
    },
    []
  );

  useEffect(() => {
    const hasInitialSearch = Boolean(
      initialValues?.query || initialValues?.location || initialValues?.category
    );

    let timer: NodeJS.Timeout | undefined;
    if (hasInitialSearch) {
      timer = setTimeout(() => {
        performSearch({
          query: initialValues?.query || "",
          location: initialValues?.location || "",
          category: initialValues?.category || "",
          date: initialValues?.date || "",
        });
      }, 0);
    }

    return () => {
      if (timer) clearTimeout(timer);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [initialValues, performSearch]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch({ query, location, category, date });
  };

  const handleApplyExample = (example: ExampleQuery) => {
    setQuery(example.query);
    setLocation(example.location);
    setCategory(example.category);
    setDate(example.date);
    setValidationError(null);
    performSearch({
      query: example.query,
      location: example.location,
      category: example.category,
      date: example.date,
    });
  };

  const handleCityQuickPick = (cityName: string) => {
    setLocation(cityName);
    setValidationError(null);
    performSearch({
      query,
      location: cityName,
      category,
      date,
    });
  };

  const handleReset = () => {
    setQuery("");
    setLocation("");
    setCategory("");
    setDate("");
    setResults([]);
    setStatus("idle");
    setSearchMetadata(null);
    setErrorMessage(null);
    setValidationError(null);
    setSelectedCategoryFilter("All");
  };

  return (
    <div className="space-y-10 animate-fade-in">
      {/* Editorial Page Header */}
      <header className="space-y-3 pb-6 border-b border-[#E8E5DF]">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EEEAFE] border border-[#DDD6FE] text-[#5146E5] text-xs font-semibold uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5" />
          Live Web Intelligence Engine
        </div>
        <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-[#171923]">
          Discover Live Tech Events & Hackathons
        </h1>
        <p className="text-[#686D78] text-base sm:text-lg max-w-2xl leading-relaxed">
          Search real-time tech conferences, hackathons, and developer meetups across India with transparent relevance ranking.
        </p>
      </header>

      {/* Main Search Panel */}
      <section
        aria-labelledby="search-section-heading"
        className="bg-white border border-[#E8E5DF] rounded-2xl p-6 sm:p-8 shadow-[0_2px_12px_rgba(23,25,35,0.04)] space-y-6"
      >
        <h2 id="search-section-heading" className="sr-only">
          Event Search Form
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. Keyword / Topic */}
            <div className="space-y-1.5">
              <label
                htmlFor={queryInputId}
                className="block text-xs font-semibold uppercase tracking-wider text-[#686D78]"
              >
                Keyword or Topic
              </label>
              <div className="relative">
                <Search className="w-4 h-4 text-[#686D78] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id={queryInputId}
                  type="text"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    if (validationError) setValidationError(null);
                  }}
                  placeholder="e.g. AI Meetups, Hackathons..."
                  className="w-full pl-10 pr-3.5 py-2.5 bg-[#FAF9F6] border border-[#E8E5DF] focus:border-[#5146E5] focus:bg-white rounded-xl text-sm text-[#171923] placeholder-[#9CA3AF] focus:ring-2 focus:ring-[#5146E5]/15 focus:outline-none transition-all"
                  disabled={status === "loading"}
                />
              </div>
            </div>

            {/* 2. City or Location */}
            <div className="space-y-1.5">
              <label
                htmlFor={locationInputId}
                className="block text-xs font-semibold uppercase tracking-wider text-[#686D78]"
              >
                City or Region
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-[#686D78] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id={locationInputId}
                  type="text"
                  value={location}
                  onChange={(e) => {
                    setLocation(e.target.value);
                    if (validationError) setValidationError(null);
                  }}
                  placeholder="e.g. Bengaluru, Delhi NCR, India..."
                  className="w-full pl-10 pr-3.5 py-2.5 bg-[#FAF9F6] border border-[#E8E5DF] focus:border-[#5146E5] focus:bg-white rounded-xl text-sm text-[#171923] placeholder-[#9CA3AF] focus:ring-2 focus:ring-[#5146E5]/15 focus:outline-none transition-all"
                  disabled={status === "loading"}
                />
              </div>
            </div>

            {/* 3. Category Dropdown */}
            <div className="space-y-1.5">
              <label
                htmlFor={categorySelectId}
                className="block text-xs font-semibold uppercase tracking-wider text-[#686D78]"
              >
                Category
              </label>
              <div className="relative">
                <SlidersHorizontal className="w-4 h-4 text-[#686D78] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <select
                  id={categorySelectId}
                  value={category}
                  onChange={(e) => {
                    setCategory(e.target.value);
                    if (validationError) setValidationError(null);
                  }}
                  className="w-full pl-10 pr-8 py-2.5 bg-[#FAF9F6] border border-[#E8E5DF] focus:border-[#5146E5] focus:bg-white rounded-xl text-sm text-[#171923] focus:ring-2 focus:ring-[#5146E5]/15 focus:outline-none transition-all appearance-none cursor-pointer"
                  disabled={status === "loading"}
                >
                  <option value="">Select Category (Optional)</option>
                  {POPULAR_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 4. Date Query */}
            <div className="space-y-1.5">
              <label
                htmlFor={dateInputId}
                className="block text-xs font-semibold uppercase tracking-wider text-[#686D78]"
              >
                Date or Timeframe
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-[#686D78] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id={dateInputId}
                  type="text"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  placeholder="e.g. October 2026, This Weekend..."
                  className="w-full pl-10 pr-3.5 py-2.5 bg-[#FAF9F6] border border-[#E8E5DF] focus:border-[#5146E5] focus:bg-white rounded-xl text-sm text-[#171923] placeholder-[#9CA3AF] focus:ring-2 focus:ring-[#5146E5]/15 focus:outline-none transition-all"
                  disabled={status === "loading"}
                />
              </div>
            </div>
          </div>

          {/* Validation Error Message */}
          {validationError && (
            <div
              role="alert"
              className="p-3 bg-[#FFFBEB] border border-[#FDE68A] rounded-xl text-[#92400E] text-xs flex items-center gap-2"
            >
              <AlertCircle className="w-4 h-4 shrink-0 text-[#D97706]" />
              <span>{validationError}</span>
            </div>
          )}

          {/* Action Buttons & Quick Pick */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-2">
              <button
                type="submit"
                disabled={status === "loading"}
                className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-[#5146E5] hover:bg-[#4338CA] text-white font-medium text-sm rounded-xl transition-all shadow-xs disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer focus:ring-2 focus:ring-[#5146E5]/20 focus:outline-none active:scale-[0.99]"
              >
                {status === "loading" ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Searching Live Events...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    Search Live Events
                  </>
                )}
              </button>

              {(query || location || category || date || status !== "idle") && (
                <button
                  type="button"
                  onClick={handleReset}
                  disabled={status === "loading"}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-white hover:bg-[#FAF9F6] border border-[#E8E5DF] hover:border-[#D5D1C8] text-[#686D78] hover:text-[#171923] rounded-xl text-sm transition-all cursor-pointer shadow-2xs"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reset
                </button>
              )}
            </div>

            {/* City Quick Pills */}
            <div className="hidden lg:flex items-center gap-1.5 text-xs text-[#686D78]">
              <span className="font-semibold text-[#171923] mr-1">Quick Cities:</span>
              {POPULAR_CITIES.slice(0, 6).map((city) => (
                <button
                  key={city}
                  type="button"
                  onClick={() => handleCityQuickPick(city)}
                  disabled={status === "loading"}
                  className={`px-2.5 py-1 rounded-lg border text-xs transition-colors cursor-pointer ${
                    location.toLowerCase() === city.toLowerCase()
                      ? "bg-[#EEEAFE] border-[#DDD6FE] text-[#5146E5] font-semibold"
                      : "bg-[#FAF9F6] border-[#E8E5DF] hover:border-[#D5D1C8] text-[#686D78] hover:text-[#171923]"
                  }`}
                >
                  {city}
                </button>
              ))}
            </div>
          </div>
        </form>

        {/* Example Queries Section */}
        <div className="border-t border-[#E8E5DF] pt-4 space-y-2">
          <div className="text-xs font-semibold text-[#686D78]">
            Popular Search Ideas:
          </div>
          <div className="flex flex-wrap gap-2">
            {EXAMPLE_QUERIES.map((example) => (
              <button
                key={example.label}
                type="button"
                onClick={() => handleApplyExample(example)}
                disabled={status === "loading"}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#FAF9F6] hover:bg-white border border-[#E8E5DF] hover:border-[#5146E5]/40 rounded-lg text-xs text-[#686D78] hover:text-[#5146E5] transition-all cursor-pointer shadow-2xs"
              >
                <span>{example.label}</span>
                <ArrowRight className="w-3 h-3 text-[#9CA3AF]" />
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Results / Status Area */}
      <section aria-labelledby="results-heading" className="space-y-6">
        {/* Results Header when active */}
        {searchMetadata && status === "success" && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white border border-[#E8E5DF] rounded-xl p-4 shadow-xs">
              <div>
                <h2
                  id="results-heading"
                  className="text-lg font-bold text-[#171923] flex items-center gap-2"
                >
                  <Compass className="w-5 h-5 text-[#5146E5]" />
                  Live Discovered Events ({filteredResults.length} of {searchMetadata.total})
                </h2>
                <p className="text-xs text-[#686D78] mt-0.5">
                  Web search query:{" "}
                  <span className="font-mono text-[#5146E5] bg-[#EEEAFE] px-1.5 py-0.5 rounded">
                    {searchMetadata.queryText}
                  </span>
                </p>
              </div>
              <div className="inline-flex items-center gap-1.5 text-xs text-[#059669] bg-[#ECFDF5] px-3 py-1 rounded-lg border border-[#A7F3D0] shrink-0 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Ranked by Relevance
              </div>
            </div>

            {/* Client-Side Category Filtering Bar */}
            {Object.keys(categoryCounts).length > 2 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
                <span className="font-semibold text-[#686D78] shrink-0 mr-1">
                  Category:
                </span>
                {Object.entries(categoryCounts).map(([catName, count]) => {
                  const isSelected = selectedCategoryFilter === catName;
                  return (
                    <button
                      key={catName}
                      type="button"
                      onClick={() => setSelectedCategoryFilter(catName)}
                      className={`px-3 py-1.5 rounded-xl border text-xs font-medium transition-all cursor-pointer shrink-0 ${
                        isSelected
                          ? "bg-[#5146E5] border-[#5146E5] text-white shadow-xs"
                          : "bg-white border-[#E8E5DF] text-[#686D78] hover:text-[#171923] hover:border-[#D5D1C8]"
                      }`}
                    >
                      {catName} ({count})
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Disclaimer Notice */}
        {(status === "success" || status === "empty") && (
          <div
            role="note"
            className="p-3.5 bg-white border border-[#E8E5DF] rounded-xl text-[#686D78] text-xs flex items-start gap-2.5 leading-relaxed shadow-2xs"
          >
            <AlertCircle className="w-4 h-4 text-[#5146E5] shrink-0 mt-0.5" />
            <div>
              <strong className="text-[#171923] font-semibold">Discovery Notice:</strong>{" "}
              {searchMetadata?.disclaimer ||
                "Google Search results are live web discovery results, not verified event records. Please verify dates, location, and ticket registration directly on the source website."}
            </div>
          </div>
        )}

        {/* 1. Loading State */}
        {status === "loading" && (
          <div
            aria-live="polite"
            className="p-12 text-center space-y-4 bg-white border border-[#E8E5DF] rounded-2xl shadow-xs"
          >
            <div className="inline-flex p-3 bg-[#EEEAFE] rounded-full text-[#5146E5]">
              <Loader2 className="w-7 h-7 animate-spin" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-[#171923]">
                Searching Live Web Events
              </h3>
              <p className="text-sm text-[#686D78] max-w-md mx-auto">
                Querying Google Search via SerpApi, deduplicating records, and analyzing relevance signals...
              </p>
            </div>
          </div>
        )}

        {/* 2. Error State */}
        {status === "error" && (
          <div
            role="alert"
            className="p-8 sm:p-10 text-center space-y-5 bg-[#FEF2F2] border border-[#FECACA] rounded-2xl max-w-2xl mx-auto shadow-xs"
          >
            <div className="inline-flex p-3 bg-[#FEE2E2] rounded-full text-[#DC2626]">
              <AlertCircle className="w-7 h-7" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-[#DC2626]">
                Search Discovery Notice
              </h3>
              <p className="text-sm text-[#171923] leading-relaxed max-w-lg mx-auto">
                {errorMessage ||
                  "An error occurred while fetching live events. Please check your query or try again."}
              </p>
              {errorMessage?.includes("not currently configured") && (
                <div className="mt-3 p-3.5 bg-white/90 border border-[#FECACA] rounded-xl text-xs text-[#991B1B] text-left space-y-1.5 shadow-2xs">
                  <p className="font-semibold text-[#7F1D1D] flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-[#DC2626]" />
                    <span>Production Setup Required:</span>
                  </p>
                  <p className="text-[#686D78]">
                    Add <code className="bg-[#FEE2E2] px-1.5 py-0.5 rounded text-[#991B1B] font-mono text-[11px]">SERPAPI_API_KEY</code> to your deployment environment variables (e.g. Vercel Dashboard &gt; <strong>Project Settings &gt; Environment Variables</strong>) and redeploy.
                  </p>
                </div>
              )}
            </div>
            <div className="pt-2 flex items-center justify-center gap-3 flex-wrap">
              <button
                type="button"
                onClick={() =>
                  performSearch({ query, location, category, date })
                }
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#DC2626] hover:bg-[#B91C1C] text-white rounded-xl text-sm font-medium transition-all cursor-pointer shadow-xs"
              >
                <RotateCcw className="w-4 h-4" />
                Retry Search
              </button>
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-[#FAF9F6] border border-[#E8E5DF] text-[#171923] rounded-xl text-sm font-medium transition-all shadow-xs"
              >
                Browse Hosted Events
              </Link>
            </div>
          </div>
        )}

        {/* 3. Empty State */}
        {status === "empty" && (
          <div
            aria-live="polite"
            className="p-12 text-center space-y-4 bg-white border border-[#E8E5DF] rounded-2xl max-w-lg mx-auto shadow-xs"
          >
            <div className="inline-flex p-3 bg-[#FAF9F6] border border-[#E8E5DF] rounded-full text-[#686D78]">
              <Compass className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-[#171923]">
                No Matching Events Found
              </h3>
              <p className="text-sm text-[#686D78]">
                We couldn&apos;t find any live public events matching your exact criteria. Try broadening your location, removing category filters, or selecting one of our suggested queries above.
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                handleApplyExample({
                  label: "Hackathons in India",
                  query: "Hackathons",
                  location: "India",
                  category: "Hackathons",
                  date: "",
                })
              }
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#5146E5] hover:bg-[#4338CA] text-white text-xs font-semibold rounded-xl transition-all cursor-pointer shadow-xs"
            >
              Try &quot;Hackathons in India&quot;
            </button>
          </div>
        )}

        {/* 4. Idle / Welcoming State */}
        {status === "idle" && (
          <div className="p-10 sm:p-14 text-center space-y-6 bg-white border border-dashed border-[#E8E5DF] rounded-2xl">
            <div className="inline-flex p-4 bg-[#EEEAFE] rounded-2xl text-[#5146E5]">
              <Compass className="w-8 h-8" />
            </div>
            <div className="space-y-2 max-w-xl mx-auto">
              <h3 className="text-xl font-bold text-[#171923]">
                Ready to Scout Upcoming Tech Events
              </h3>
              <p className="text-[#686D78] text-sm leading-relaxed">
                Use the search form above or click one of our popular queries to find AI summits, hackathons, and developer gatherings across Bengaluru, Delhi NCR, and all of India.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-3 pt-2">
              {EXAMPLE_QUERIES.map((example) => (
                <button
                  key={example.label}
                  type="button"
                  onClick={() => handleApplyExample(example)}
                  className="px-4 py-2 bg-[#FAF9F6] hover:bg-white border border-[#E8E5DF] hover:border-[#5146E5]/40 rounded-xl text-xs font-medium text-[#171923] transition-all cursor-pointer shadow-2xs"
                >
                  {example.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 5. Results Grid */}
        {status === "success" && filteredResults.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredResults.map((event, idx) => {
              const draftEligibility = evaluateDraftEligibility(event);
              const cover = getEventCover(event.title, event.category, event.id);

              return (
                <article
                  key={event.id || `ev-${idx}`}
                  className="bg-white hover:border-[#D5D1C8] border border-[#E8E5DF] rounded-2xl overflow-hidden shadow-xs hover:shadow-[0_8px_30px_rgba(23,25,35,0.06)] flex flex-col justify-between transition-all duration-200 group"
                >
                  <div className="space-y-4">
                    {/* Event Cover Banner */}
                    <div className="relative aspect-[21/9] w-full overflow-hidden bg-[#FAF9F6]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={cover.url}
                        alt={cover.alt}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-102"
                        loading="lazy"
                      />
                      <div className="absolute top-3 left-3 flex items-center gap-2">
                        <span
                          className={`text-[10px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-md border shadow-2xs backdrop-blur-sm ${getCategoryBadgeClass(
                            event.category
                          )}`}
                        >
                          {event.category}
                        </span>
                      </div>
                      {event.displayedSource && (
                        <div className="absolute top-3 right-3">
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-white/95 text-[#171923] px-2.5 py-1 rounded-md border border-[#E8E5DF] shadow-2xs backdrop-blur-sm">
                            <Globe className="w-3 h-3 text-[#686D78] shrink-0" />
                            <span className="truncate max-w-[140px]">{event.displayedSource}</span>
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="p-5 pt-0 space-y-3">
                      {/* Title */}
                      <h3 className="text-lg font-bold text-[#171923] group-hover:text-[#5146E5] transition-colors line-clamp-2 leading-snug">
                        {event.title}
                      </h3>

                      {/* Snippet / Description */}
                      <p className="text-[#686D78] text-xs sm:text-sm leading-relaxed line-clamp-3">
                        {event.snippet}
                      </p>

                      {/* Metadata Chips: Verified Dates, Locations, and Transparent Signals */}
                      <div className="space-y-2 pt-1">
                        <div className="flex flex-wrap gap-2 text-xs">
                          {/* Date Indicator (Confirmed vs Not Confirmed) */}
                          {event.hasConfirmedDate ? (
                            <div
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#ECFDF5] border border-[#A7F3D0] text-[#059669] rounded-lg font-medium"
                              title="Date was explicitly confirmed from search result metadata"
                            >
                              <Calendar className="w-3.5 h-3.5 shrink-0" />
                              <span className="truncate max-w-[200px]">{event.dateDisplay}</span>
                            </div>
                          ) : (
                            <div
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#FAF9F6] border border-[#E8E5DF] text-[#686D78] rounded-lg"
                              title="No explicit date could be confirmed from search snippet"
                            >
                              <Clock className="w-3.5 h-3.5 text-[#9CA3AF] shrink-0" />
                              <span>Date not confirmed</span>
                            </div>
                          )}

                          {/* Location Indicator (Confirmed vs Unverified) */}
                          {event.hasConfirmedLocation ? (
                            <div
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#FAF9F6] border border-[#E8E5DF] text-[#171923] rounded-lg"
                              title="Location identified from event venue metadata"
                            >
                              <MapPin className="w-3.5 h-3.5 text-[#5146E5] shrink-0" />
                              <span className="truncate max-w-[200px]">{event.locationDisplay}</span>
                            </div>
                          ) : (
                            <div
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#FAF9F6] border border-[#E8E5DF] text-[#686D78] rounded-lg"
                              title="Venue location not confirmed"
                            >
                              <MapPin className="w-3.5 h-3.5 text-[#9CA3AF] shrink-0" />
                              <span>Location unverified</span>
                            </div>
                          )}
                        </div>

                        {/* Transparent Relevance Signals Pill */}
                        {event.relevanceSignals && event.relevanceSignals.length > 0 && (
                          <div className="flex items-center gap-1 text-[11px] text-[#5146E5] bg-[#EEEAFE] px-2.5 py-0.5 rounded-md border border-[#DDD6FE] w-fit font-medium">
                            <Sparkles className="w-3 h-3 text-[#5146E5] shrink-0" />
                            <span className="truncate max-w-[280px]">
                              {event.relevanceSignals.slice(0, 2).join(" • ")}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Footer Actions: Source Link & Host Draft Action */}
                  <div className="px-5 py-3.5 bg-[#FAF9F6] border-t border-[#E8E5DF] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
                    <div className="text-[11px] text-[#686D78] truncate max-w-[150px]">
                      {event.displayedSource || "Source website"}
                    </div>
                    <div className="flex items-center gap-2 shrink-0 flex-wrap">
                      <a
                        href={event.originalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-[#FAF9F6] border border-[#E8E5DF] hover:border-[#D5D1C8] text-xs font-semibold text-[#171923] rounded-lg transition-all shadow-2xs focus:ring-2 focus:ring-[#5146E5]/20 focus:outline-none"
                        title="Review external details on source website"
                      >
                        <span>View Source</span>
                        <ExternalLink className="w-3.5 h-3.5 text-[#686D78]" />
                      </a>

                      {draftEligibility.isEligible ? (
                        <button
                          type="button"
                          onClick={() => setDraftModalEvent(event)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#5146E5] hover:bg-[#4338CA] text-white text-xs font-semibold rounded-lg transition-all cursor-pointer shadow-xs focus:ring-2 focus:ring-[#5146E5]/20 focus:outline-none"
                          title="Use details from this search result to prepare an unverified event draft on EventScout"
                        >
                          <FilePlus2 className="w-3.5 h-3.5" />
                          <span>Prepare Host Draft</span>
                        </button>
                      ) : (
                        <span
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-[#FAF9F6] border border-[#E8E5DF] text-[#9CA3AF] text-xs rounded-lg cursor-not-allowed"
                          title={draftEligibility.reason || "Search result is too sparse to prepare a draft."}
                        >
                          <span>Incomplete for Draft</span>
                        </span>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {/* Empty Category Filter State */}
        {status === "success" &&
          filteredResults.length === 0 &&
          results.length > 0 && (
            <div className="p-8 text-center space-y-3 bg-white border border-[#E8E5DF] rounded-xl shadow-xs">
              <p className="text-sm text-[#686D78]">
                No results found under &quot;{selectedCategoryFilter}&quot;.
              </p>
              <button
                type="button"
                onClick={() => setSelectedCategoryFilter("All")}
                className="px-3.5 py-1.5 bg-[#5146E5] hover:bg-[#4338CA] text-white rounded-lg text-xs font-semibold shadow-xs"
              >
                Show All Categories ({results.length})
              </button>
            </div>
          )}
      </section>

      {/* Draft Preparation Modal */}
      {draftModalEvent && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="draft-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#171923]/50 backdrop-blur-xs animate-fade-in"
        >
          <div className="bg-white border border-[#E8E5DF] rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-[0_20px_50px_rgba(23,25,35,0.15)] relative">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-[#EEEAFE] rounded-xl text-[#5146E5]">
                  <FilePlus2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 id="draft-modal-title" className="text-base font-bold text-[#171923]">
                    Prepare Event Draft
                  </h3>
                  <p className="text-xs text-[#686D78]">
                    Transfer external discovery details to host review form
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDraftModalEvent(null)}
                className="text-[#686D78] hover:text-[#171923] p-1 rounded-lg hover:bg-[#FAF9F6] transition-colors cursor-pointer"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Warning Callout */}
            <div className="p-3.5 bg-[#FFFBEB] border border-[#FDE68A] rounded-xl text-xs text-[#92400E] space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-[#B45309]">
                <AlertTriangle className="w-4 h-4 text-[#D97706] shrink-0" />
                <span>Unverified External Data</span>
              </div>
              <p className="leading-relaxed">
                This search result is NOT verified. Preparing a draft allows an authenticated host to review, adjust, and complete all required details before publishing to EventScout.
              </p>
            </div>

            {/* Draft Details Preview */}
            <div className="bg-[#FAF9F6] border border-[#E8E5DF] rounded-xl p-3.5 space-y-2.5 text-xs">
              <div>
                <span className="text-[#686D78] font-semibold block text-[10px] uppercase">Title:</span>
                <p className="text-[#171923] font-medium">{draftModalEvent.title}</p>
              </div>

              <div className="flex items-center justify-between gap-2 border-t border-[#E8E5DF] pt-2">
                <span className="text-[#686D78] font-semibold text-[10px] uppercase">Date:</span>
                <span className={draftModalEvent.hasConfirmedDate ? "text-[#059669] font-medium" : "text-[#D97706] font-medium"}>
                  {draftModalEvent.hasConfirmedDate ? draftModalEvent.dateDisplay : "Unconfirmed (Host must enter date)"}
                </span>
              </div>

              <div className="flex items-center justify-between gap-2 border-t border-[#E8E5DF] pt-2">
                <span className="text-[#686D78] font-semibold text-[10px] uppercase">Location:</span>
                <span className={draftModalEvent.hasConfirmedLocation ? "text-[#171923]" : "text-[#D97706] font-medium"}>
                  {draftModalEvent.hasConfirmedLocation ? draftModalEvent.locationDisplay : "Unverified (Host must specify venue)"}
                </span>
              </div>

              <div className="flex items-center justify-between gap-2 border-t border-[#E8E5DF] pt-2">
                <span className="text-[#686D78] font-semibold text-[10px] uppercase">Source URL:</span>
                <a
                  href={draftModalEvent.originalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#5146E5] hover:text-[#4338CA] inline-flex items-center gap-1 truncate max-w-[200px]"
                >
                  <span className="truncate">{draftModalEvent.originalUrl}</span>
                  <ExternalLink className="w-3 h-3 shrink-0" />
                </a>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDraftModalEvent(null)}
                className="px-4 py-2 bg-white hover:bg-[#FAF9F6] border border-[#E8E5DF] hover:border-[#D5D1C8] text-[#171923] text-xs font-semibold rounded-xl transition-all cursor-pointer shadow-2xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const params = buildDraftUrlParams(draftModalEvent);
                  setDraftModalEvent(null);
                  router.push(`/events/new?${params}`);
                }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#5146E5] hover:bg-[#4338CA] text-white text-xs font-semibold rounded-xl transition-all cursor-pointer shadow-xs active:scale-[0.99]"
              >
                <span>Continue to Host Review Form</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
