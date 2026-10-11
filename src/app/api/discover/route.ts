import { NextRequest, NextResponse } from "next/server";
import { discoverySearchSchema } from "@/validations/discovery";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import {
  searchLiveEvents,
  SerpApiConfigError,
  SerpApiTimeoutError,
  SerpApiError,
} from "@/lib/serpapi";

/**
 * Shared handler for both GET (URL query params) and POST (JSON body) requests.
 */
async function handleDiscoveryRequest(
  req: NextRequest,
  inputData: Record<string, unknown>
) {
  // 1. Enforce distributed multi-instance rate limiting (20 requests / minute / IP)
  const clientIp = getClientIp(req);
  const rateLimitResult = await checkRateLimit(`discovery:${clientIp}`, 20, 60);

  const rateLimitHeaders: Record<string, string> = {
    "X-RateLimit-Limit": String(rateLimitResult.limit),
    "X-RateLimit-Remaining": String(rateLimitResult.remaining),
    "X-RateLimit-Reset": String(rateLimitResult.resetSeconds),
  };

  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      {
        error: "Too many requests. You have reached the discovery rate limit. Please try again shortly.",
        retryAfter: rateLimitResult.resetSeconds,
      },
      {
        status: 429,
        headers: {
          ...rateLimitHeaders,
          "Retry-After": String(rateLimitResult.resetSeconds),
        },
      }
    );
  }

  // 2. Validate request parameters using Zod
  const validation = discoverySearchSchema.safeParse(inputData);
  if (!validation.success) {
    const errorDetails = validation.error.issues
      .map((issue) => issue.message)
      .join("; ");
    return NextResponse.json(
      { error: `Invalid search parameters: ${errorDetails}` },
      { status: 400, headers: rateLimitHeaders }
    );
  }

  const { query, location, category, date, limit } = validation.data;

  // 3. Call SerpApi Google Search API
  try {
    const results = await searchLiveEvents({
      query,
      location,
      category,
      date,
      limit,
    });

    return NextResponse.json(results, {
      status: 200,
      headers: {
        ...rateLimitHeaders,
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    });
  } catch (error) {
    if (error instanceof SerpApiConfigError) {
      return NextResponse.json(
        {
          error:
            "Live event discovery service is not currently configured on this server.",
        },
        { status: 503, headers: rateLimitHeaders }
      );
    }

    if (error instanceof SerpApiTimeoutError) {
      return NextResponse.json(
        {
          error:
            "Discovery search request timed out. Please try a more specific search or try again later.",
        },
        { status: 504, headers: rateLimitHeaders }
      );
    }

    if (error instanceof SerpApiError) {
      return NextResponse.json(
        {
          error: error.message || "Failed to retrieve search results from SerpApi.",
        },
        { status: 502, headers: rateLimitHeaders }
      );
    }

    console.error("Unexpected discovery endpoint error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred while searching for events." },
      { status: 500, headers: rateLimitHeaders }
    );
  }
}

/**
 * GET /api/discover
 * Accepts search parameters via query string (e.g. ?q=hackathons&location=Bengaluru&date=October%202026)
 */
export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;

  const rawData: Record<string, unknown> = {
    query: searchParams.get("query") || searchParams.get("q") || undefined,
    location: searchParams.get("location") || undefined,
    city: searchParams.get("city") || undefined,
    category: searchParams.get("category") || undefined,
    date: searchParams.get("date") || undefined,
    limit: searchParams.get("limit") || undefined,
  };

  return handleDiscoveryRequest(req, rawData);
}

/**
 * POST /api/discover
 * Accepts search parameters via JSON payload.
 */
export async function POST(req: NextRequest) {
  let body: Record<string, unknown> = {};

  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Malformed request: Body must be valid JSON." },
      { status: 400 }
    );
  }

  return handleDiscoveryRequest(req, body);
}
