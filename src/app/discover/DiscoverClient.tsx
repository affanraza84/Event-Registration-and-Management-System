"use client";

import { useState, useRef, useEffect, useCallback, useId, useMemo } from "react";
import { useRouter } from "next/navigation";
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
} from "lucide-react";
import { IDiscoveredEvent, DiscoveryResponse } from "@/types/discovery";
import {
  evaluateDraftEligibility,
  buildDraftUrlParams,
} from "@/utils/draftHelper";

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
    label: "AI meetups in Ranchi",
    query: "AI meetups",
    location: "Ranchi",
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
    label: "Web development conferences in Bengaluru",
    query: "Web development conferences",
    location: "Bengaluru",
    category: "Web Development",
    date: "",
  },
  {
    label: "Student technology events in Jharkhand",
    query: "Student technology events",
    location: "Jharkhand",
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
  "Ranchi",
  "Bengaluru",
  "Delhi NCR",
  "Mumbai",
  "Hyderabad",
  "Pune",
  "Kolkata",
  "India",
];

function getCategoryBadgeClass(category: string): string {
  switch (category) {
    case "Hackathons and competitions":
      return "bg-emerald-950/70 text-emerald-300 border-emerald-800/60";
    case "Meetups and networking":
      return "bg-blue-950/70 text-blue-300 border-blue-800/60";
    case "Conferences and workshops":
      return "bg-purple-950/70 text-purple-300 border-purple-800/60";
    case "Student and campus events":
      return "bg-amber-950/70 text-amber-300 border-amber-800/60";
    default:
      return "bg-neutral-900/80 text-neutral-400 border-neutral-800";
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
      // Input Validation: Require at least one filter field
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

      // Cancel any ongoing search request to prevent stale UI updates
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

        // Discard response if a newer search request has been triggered
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
            disclaimer:
              data.disclaimer ||
              "Google Search results are web discovery results, not verified event records.",
          });
          setStatus("empty");
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.name === "AbortError") {
          // Request was intentionally aborted; do not show error
          return;
        }

        if (currentRequestId !== latestRequestIdRef.current) {
          return;
        }

        const msg =
          err instanceof Error
            ? err.message
            : "Network error: Unable to reach the live discovery server.";
        setErrorMessage(msg);
        setStatus("error");
        setResults([]);
      }
    },
    []
  );

  // Auto-search on initial load if URL parameters were provided
  useEffect(() => {
    const hasInitialSearch = Boolean(
      initialValues?.query || initialValues?.location || initialValues?.category
    );
    if (!hasInitialSearch) return;

    const timer = setTimeout(() => {
      performSearch({
        query: initialValues?.query || "",
        location: initialValues?.location || "",
        category: initialValues?.category || "",
        date: initialValues?.date || "",
      });
    }, 0);

    return () => {
      clearTimeout(timer);
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
    performSearch({
      query: example.query,
      location: example.location,
      category: example.category,
      date: example.date,
    });
  };

  const handleCityQuickPick = (cityName: string) => {
    setLocation(cityName);
    performSearch({ query, location: cityName, category, date });
  };

  const handleReset = () => {
    setQuery("");
    setLocation("");
    setCategory("");
    setDate("");
    setSelectedCategoryFilter("All");
    setValidationError(null);
    setErrorMessage(null);
    setResults([]);
    setSearchMetadata(null);
    setStatus("idle");
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  return (
    <div className="space-y-10">
      {/* Page Header */}
      <header className="space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-950/50 border border-purple-800/40 rounded-full text-purple-300 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5 text-purple-400" />
          SerpApi Live Discovery Engine
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-neutral-100">
          Discover Live Tech Events & Hackathons
        </h1>
        <p className="text-neutral-400 text-base sm:text-lg max-w-3xl leading-relaxed">
          Search real-time tech conferences, hackathons, and developer meetups across India.
          Results are queried live using SerpApi Google Search and ranked with transparent relevance signals.
        </p>
      </header>

      {/* Main Search Panel */}
      <section
        aria-labelledby="search-section-heading"
        className="bg-neutral-900/40 border border-neutral-800/80 rounded-2xl p-5 sm:p-7 shadow-2xl backdrop-blur-md space-y-6"
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
                className="block text-xs font-semibold uppercase tracking-wider text-neutral-400"
              >
                Keyword or Topic
              </label>
              <div className="relative">
                <Search className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id={queryInputId}
                  type="text"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    if (validationError) setValidationError(null);
                  }}
                  placeholder="e.g. AI Meetups, Hackathons..."
                  className="w-full pl-10 pr-3.5 py-2.5 bg-neutral-950/80 border border-neutral-800 focus:border-purple-500/80 rounded-xl text-sm text-neutral-100 placeholder:text-neutral-500 focus:ring-2 focus:ring-purple-500/20 focus:outline-none transition-all"
                  disabled={status === "loading"}
                />
              </div>
            </div>

            {/* 2. City or Location */}
            <div className="space-y-1.5">
              <label
                htmlFor={locationInputId}
                className="block text-xs font-semibold uppercase tracking-wider text-neutral-400"
              >
                City or Region
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id={locationInputId}
                  type="text"
                  value={location}
                  onChange={(e) => {
                    setLocation(e.target.value);
                    if (validationError) setValidationError(null);
                  }}
                  placeholder="e.g. Ranchi, Bengaluru, India..."
                  className="w-full pl-10 pr-3.5 py-2.5 bg-neutral-950/80 border border-neutral-800 focus:border-purple-500/80 rounded-xl text-sm text-neutral-100 placeholder:text-neutral-500 focus:ring-2 focus:ring-purple-500/20 focus:outline-none transition-all"
                  disabled={status === "loading"}
                />
              </div>
            </div>

            {/* 3. Category Dropdown */}
            <div className="space-y-1.5">
              <label
                htmlFor={categorySelectId}
                className="block text-xs font-semibold uppercase tracking-wider text-neutral-400"
              >
                Category
              </label>
              <div className="relative">
                <SlidersHorizontal className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <select
                  id={categorySelectId}
                  value={category}
                  onChange={(e) => {
                    setCategory(e.target.value);
                    if (validationError) setValidationError(null);
                  }}
                  className="w-full pl-10 pr-8 py-2.5 bg-neutral-950/80 border border-neutral-800 focus:border-purple-500/80 rounded-xl text-sm text-neutral-100 focus:ring-2 focus:ring-purple-500/20 focus:outline-none transition-all appearance-none cursor-pointer"
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
                className="block text-xs font-semibold uppercase tracking-wider text-neutral-400"
              >
                Date or Timeframe
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id={dateInputId}
                  type="text"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  placeholder="e.g. October 2026, This Weekend..."
                  className="w-full pl-10 pr-3.5 py-2.5 bg-neutral-950/80 border border-neutral-800 focus:border-purple-500/80 rounded-xl text-sm text-neutral-100 placeholder:text-neutral-500 focus:ring-2 focus:ring-purple-500/20 focus:outline-none transition-all"
                  disabled={status === "loading"}
                />
              </div>
            </div>
          </div>

          {/* Validation Error Message */}
          {validationError && (
            <div
              role="alert"
              className="p-3 bg-amber-950/30 border border-amber-800/50 rounded-xl text-amber-300 text-xs flex items-center gap-2"
            >
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
              <span>{validationError}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-2">
              <button
                type="submit"
                disabled={status === "loading"}
                className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-medium text-sm rounded-xl transition-all shadow-md shadow-purple-950/30 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer focus:ring-2 focus:ring-purple-500 focus:outline-none"
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
                  className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white rounded-xl text-sm transition-all cursor-pointer focus:ring-2 focus:ring-neutral-700 focus:outline-none"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reset
                </button>
              )}
            </div>

            {/* City Quick Pills */}
            <div className="hidden lg:flex items-center gap-1.5 text-xs text-neutral-400">
              <span className="font-semibold text-neutral-500 mr-1">Quick Cities:</span>
              {POPULAR_CITIES.slice(0, 5).map((city) => (
                <button
                  key={city}
                  type="button"
                  onClick={() => handleCityQuickPick(city)}
                  disabled={status === "loading"}
                  className={`px-2.5 py-1 rounded-lg border text-xs transition-colors cursor-pointer ${
                    location.toLowerCase() === city.toLowerCase()
                      ? "bg-purple-950/60 border-purple-800 text-purple-300"
                      : "bg-neutral-950/60 border-neutral-800 hover:border-neutral-700 text-neutral-300"
                  }`}
                >
                  {city}
                </button>
              ))}
            </div>
          </div>
        </form>

        {/* Example Queries Section */}
        <div className="border-t border-neutral-800/60 pt-4 space-y-2">
          <div className="text-xs font-semibold text-neutral-400">
            Suggested Search Queries:
          </div>
          <div className="flex flex-wrap gap-2">
            {EXAMPLE_QUERIES.map((example) => (
              <button
                key={example.label}
                type="button"
                onClick={() => handleApplyExample(example)}
                disabled={status === "loading"}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-neutral-950/60 hover:bg-neutral-900 border border-neutral-800 hover:border-purple-800/60 rounded-lg text-xs text-neutral-300 hover:text-purple-300 transition-all cursor-pointer focus:ring-1 focus:ring-purple-500 focus:outline-none"
              >
                <span>{example.label}</span>
                <ArrowRight className="w-3 h-3 text-neutral-500" />
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
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-neutral-900/30 border border-neutral-800/60 rounded-xl p-4">
              <div>
                <h2
                  id="results-heading"
                  className="text-lg font-bold text-neutral-100 flex items-center gap-2"
                >
                  <Compass className="w-5 h-5 text-purple-400" />
                  Live Discovered Events ({filteredResults.length} of {searchMetadata.total})
                </h2>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Google Search query:{" "}
                  <span className="font-mono text-purple-300 bg-purple-950/40 px-1.5 py-0.5 rounded">
                    {searchMetadata.queryText}
                  </span>
                </p>
              </div>
              <div className="inline-flex items-center gap-1.5 text-xs text-neutral-400 bg-neutral-900 px-3 py-1 rounded-lg border border-neutral-800 shrink-0">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Ranked by Relevance
              </div>
            </div>

            {/* Client-Side Category Filtering Bar */}
            {Object.keys(categoryCounts).length > 2 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
                <span className="font-semibold text-neutral-500 shrink-0 mr-1">
                  Filter Category:
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
                          ? "bg-purple-900/60 border-purple-500 text-purple-200 shadow-sm shadow-purple-950/50"
                          : "bg-neutral-900/60 border-neutral-800 text-neutral-400 hover:text-neutral-200 hover:border-neutral-700"
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
            className="p-3.5 bg-purple-950/20 border border-purple-900/40 rounded-xl text-neutral-300 text-xs flex items-start gap-2.5 leading-relaxed"
          >
            <AlertCircle className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-purple-300 font-semibold">Discovery Notice:</strong>{" "}
              {searchMetadata?.disclaimer ||
                "Google Search results are live web discovery results, not verified event records. Please verify dates, location, and ticket registration directly on the source website."}
            </div>
          </div>
        )}

        {/* 1. Loading State */}
        {status === "loading" && (
          <div
            aria-live="polite"
            className="p-12 text-center space-y-4 bg-neutral-900/20 border border-neutral-800/60 rounded-2xl"
          >
            <div className="inline-flex p-3 bg-purple-950/40 border border-purple-800/40 rounded-full text-purple-400">
              <Loader2 className="w-7 h-7 animate-spin" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-neutral-200">
                Searching Live Web Events
              </h3>
              <p className="text-sm text-neutral-400 max-w-md mx-auto">
                Querying Google Search via SerpApi, deduplicating records, and analyzing relevance signals...
              </p>
            </div>
          </div>
        )}

        {/* 2. Error State */}
        {status === "error" && (
          <div
            role="alert"
            className="p-8 sm:p-10 text-center space-y-4 bg-red-950/20 border border-red-900/50 rounded-2xl max-w-2xl mx-auto"
          >
            <div className="inline-flex p-3 bg-red-950/60 border border-red-800/60 rounded-full text-red-400">
              <AlertCircle className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-red-300">
                Search Discovery Error
              </h3>
              <p className="text-sm text-neutral-300 leading-relaxed">
                {errorMessage ||
                  "An error occurred while fetching live events. Please check your query or try again."}
              </p>
            </div>
            <div className="pt-2">
              <button
                type="button"
                onClick={() =>
                  performSearch({ query, location, category, date })
                }
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-900/60 hover:bg-red-800 text-white rounded-xl text-sm font-medium transition-all cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                Retry Search
              </button>
            </div>
          </div>
        )}

        {/* 3. Empty State */}
        {status === "empty" && (
          <div
            aria-live="polite"
            className="p-12 text-center space-y-4 bg-neutral-900/20 border border-neutral-800/60 rounded-2xl max-w-lg mx-auto"
          >
            <div className="inline-flex p-3 bg-neutral-900 border border-neutral-800 rounded-full text-neutral-500">
              <Compass className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-neutral-200">
                No Matching Events Found
              </h3>
              <p className="text-sm text-neutral-400">
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
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-purple-600/80 hover:bg-purple-600 text-white text-xs font-semibold rounded-xl transition-all cursor-pointer"
            >
              Try &quot;Hackathons in India&quot;
            </button>
          </div>
        )}

        {/* 4. Idle / Welcoming State */}
        {status === "idle" && (
          <div className="p-10 sm:p-14 text-center space-y-6 bg-neutral-900/10 border border-dashed border-neutral-800/80 rounded-2xl">
            <div className="inline-flex p-4 bg-purple-950/30 border border-purple-900/30 rounded-2xl text-purple-400">
              <Compass className="w-8 h-8" />
            </div>
            <div className="space-y-2 max-w-xl mx-auto">
              <h3 className="text-xl font-bold text-neutral-200">
                Ready to Scout Upcoming Tech Events
              </h3>
              <p className="text-neutral-400 text-sm leading-relaxed">
                Use the search form above or click one of our sample queries to find AI summits, hackathons, and developer gatherings across Ranchi, Bengaluru, and all of India.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-3 pt-2">
              {EXAMPLE_QUERIES.map((example) => (
                <button
                  key={example.label}
                  type="button"
                  onClick={() => handleApplyExample(example)}
                  className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 rounded-xl text-xs font-medium text-neutral-300 transition-all cursor-pointer"
                >
                  {example.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 5. Results Grid */}
        {status === "success" && filteredResults.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filteredResults.map((event, idx) => {
              const draftEligibility = evaluateDraftEligibility(event);
              return (
                <article
                  key={event.id || `ev-${idx}`}
                  className="bg-neutral-900/40 hover:bg-neutral-900/70 border border-neutral-800/80 hover:border-purple-800/50 rounded-2xl p-5 shadow-lg flex flex-col justify-between transition-all duration-200 space-y-4 group"
                >
                  <div className="space-y-3">
                    {/* Top Badges */}
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      {/* Evidence-Based Category Badge */}
                      <span
                        className={`text-[10px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-md border ${getCategoryBadgeClass(
                          event.category
                        )}`}
                      >
                        {event.category}
                      </span>

                      {/* Source / Domain Pill */}
                      {event.displayedSource && (
                        <span className="inline-flex items-center gap-1 text-[11px] text-neutral-400 truncate max-w-[180px]">
                          <Globe className="w-3 h-3 text-neutral-500 shrink-0" />
                          <span className="truncate">{event.displayedSource}</span>
                        </span>
                      )}
                    </div>

                    {/* Title */}
                    <h3 className="text-lg font-bold text-neutral-100 group-hover:text-purple-300 transition-colors line-clamp-2 leading-snug">
                      {event.title}
                    </h3>

                    {/* Snippet / Description */}
                    <p className="text-neutral-400 text-xs sm:text-sm leading-relaxed line-clamp-3">
                      {event.snippet}
                    </p>

                    {/* Metadata Chips: Verified Dates, Locations, and Transparent Signals */}
                    <div className="space-y-2 pt-1">
                      <div className="flex flex-wrap gap-2 text-xs">
                        {/* Date Indicator (Confirmed vs Not Confirmed) */}
                        {event.hasConfirmedDate ? (
                          <div
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-neutral-950 border border-emerald-900/50 text-emerald-300 rounded-lg"
                            title="Date was explicitly confirmed from search result metadata"
                          >
                            <Calendar className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            <span className="truncate max-w-[200px]">{event.dateDisplay}</span>
                          </div>
                        ) : (
                          <div
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-neutral-950/80 border border-neutral-800 text-neutral-400 rounded-lg"
                            title="No explicit date could be confirmed from search snippet"
                          >
                            <Clock className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                            <span>Date not confirmed</span>
                          </div>
                        )}

                        {/* Location Indicator (Confirmed vs Unverified) */}
                        {event.hasConfirmedLocation ? (
                          <div
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-neutral-950 border border-neutral-800 text-neutral-300 rounded-lg"
                            title="Location identified from event venue metadata"
                          >
                            <MapPin className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                            <span className="truncate max-w-[200px]">{event.locationDisplay}</span>
                          </div>
                        ) : (
                          <div
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-neutral-950/80 border border-neutral-800 text-neutral-400 rounded-lg"
                            title="Venue location not confirmed"
                          >
                            <MapPin className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                            <span>Location unverified</span>
                          </div>
                        )}
                      </div>

                      {/* Transparent Relevance Signals Pill */}
                      {event.relevanceSignals && event.relevanceSignals.length > 0 && (
                        <div className="flex items-center gap-1 text-[11px] text-purple-300/80 bg-purple-950/30 px-2 py-0.5 rounded-md border border-purple-900/30 w-fit">
                          <Sparkles className="w-3 h-3 text-purple-400 shrink-0" />
                          <span className="truncate max-w-[280px]">
                            {event.relevanceSignals.slice(0, 2).join(" • ")}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Footer Actions: Source Link & Host Draft Action */}
                  <div className="border-t border-neutral-800 pt-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
                    <div className="text-[11px] text-neutral-500 truncate max-w-[150px]">
                      {event.displayedSource || "Source link"}
                    </div>
                    <div className="flex items-center gap-2 shrink-0 flex-wrap">
                      <a
                        href={event.originalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 text-xs font-semibold text-neutral-300 hover:text-white rounded-lg transition-all focus:ring-2 focus:ring-purple-500 focus:outline-none"
                        title="Review external details on source website"
                      >
                        <span>View Source</span>
                        <ExternalLink className="w-3.5 h-3.5 text-neutral-400" />
                      </a>

                      {draftEligibility.isEligible ? (
                        <button
                          type="button"
                          onClick={() => setDraftModalEvent(event)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-950/70 hover:bg-purple-900 border border-purple-800/80 text-purple-200 hover:text-white text-xs font-semibold rounded-lg transition-all cursor-pointer focus:ring-2 focus:ring-purple-500 focus:outline-none shadow-sm shadow-purple-950/40"
                          title="Use details from this search result to prepare an unverified event draft on EventScout"
                        >
                          <FilePlus2 className="w-3.5 h-3.5 text-purple-400" />
                          <span>Use Details to Create Event</span>
                        </button>
                      ) : (
                        <span
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-neutral-950/80 border border-neutral-800 text-neutral-500 text-xs rounded-lg cursor-not-allowed"
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
            <div className="p-8 text-center space-y-3 bg-neutral-900/20 border border-neutral-800 rounded-xl">
              <p className="text-sm text-neutral-400">
                No results found under &quot;{selectedCategoryFilter}&quot;.
              </p>
              <button
                type="button"
                onClick={() => setSelectedCategoryFilter("All")}
                className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-lg text-xs font-semibold text-neutral-200"
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
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
        >
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl relative">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-purple-950/80 border border-purple-800/80 rounded-xl text-purple-400">
                  <FilePlus2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 id="draft-modal-title" className="text-base font-bold text-neutral-100">
                    Prepare Event Draft
                  </h3>
                  <p className="text-xs text-neutral-400">
                    Transfer external discovery details to host review form
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDraftModalEvent(null)}
                className="text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-neutral-800 transition-colors"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Warning Callout */}
            <div className="p-3.5 bg-amber-950/30 border border-amber-900/50 rounded-xl text-xs text-amber-200 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-amber-300">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Unverified External Data</span>
              </div>
              <p className="leading-relaxed text-amber-300/80">
                This search result is NOT verified. Preparing a draft allows an authenticated host to review, adjust, and complete all required details before publishing to EventScout.
              </p>
            </div>

            {/* Draft Details Preview */}
            <div className="bg-neutral-950/60 border border-neutral-800/80 rounded-xl p-3.5 space-y-2.5 text-xs">
              <div>
                <span className="text-neutral-500 font-semibold block text-[10px] uppercase">Title:</span>
                <p className="text-neutral-200 font-medium">{draftModalEvent.title}</p>
              </div>

              <div className="flex items-center justify-between gap-2 border-t border-neutral-800 pt-2">
                <span className="text-neutral-500 font-semibold text-[10px] uppercase">Date:</span>
                <span className={draftModalEvent.hasConfirmedDate ? "text-emerald-400 font-medium" : "text-amber-400 font-medium"}>
                  {draftModalEvent.hasConfirmedDate ? draftModalEvent.dateDisplay : "Unconfirmed (Host must enter date)"}
                </span>
              </div>

              <div className="flex items-center justify-between gap-2 border-t border-neutral-800 pt-2">
                <span className="text-neutral-500 font-semibold text-[10px] uppercase">Location:</span>
                <span className={draftModalEvent.hasConfirmedLocation ? "text-neutral-200" : "text-amber-400 font-medium"}>
                  {draftModalEvent.hasConfirmedLocation ? draftModalEvent.locationDisplay : "Unverified (Host must specify venue)"}
                </span>
              </div>

              <div className="flex items-center justify-between gap-2 border-t border-neutral-800 pt-2">
                <span className="text-neutral-500 font-semibold text-[10px] uppercase">Source URL:</span>
                <a
                  href={draftModalEvent.originalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-purple-400 hover:text-purple-300 inline-flex items-center gap-1 truncate max-w-[200px]"
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
                className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 text-xs font-semibold rounded-xl transition-all cursor-pointer"
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
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-semibold rounded-xl transition-all cursor-pointer shadow-lg shadow-purple-950/30"
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
