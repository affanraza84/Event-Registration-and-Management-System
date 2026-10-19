# EventScout — Official Project Hub & Engineering Documentation

> **Live Application**: [https://event-registration-and-management-s-seven.vercel.app/](https://event-registration-and-management-s-seven.vercel.app/)  
> **Source Repository**: [https://github.com/affanraza84/Event-Registration-and-Management-System](https://github.com/affanraza84/Event-Registration-and-Management-System)  
> **Author**: Affan Raza  
> **Project Type**: Live Event Discovery, Asset Lifecycle & Registration Engine  

---

## 🌟 1. Executive Summary & Product Vision

### 1.1 The Core Problem
Community event organizers and developers face a fractured ecosystem:
1. **Directory Fragmentation**: Technical gatherings, hackathons, and conferences are scattered across dozens of unlinked platforms (Devfolio, Unstop, Meetup, Eventbrite, Lu.ma, MLH, LinkedIn, university portals). Users are forced to check multiple directories manually.
2. **The Verification & Hallucination Trap**: Standard web searches return expired listings, scraper spam, and unconfirmed dates. Typical AI search engines invent (hallucinate) event details.
3. **The Discovery vs. Management Disconnect**: Platforms that offer search do not offer host registration tools; platforms that offer registration tools do not provide live discovery.

### 1.2 The EventScout Solution
**EventScout** unifies live web discovery with native platform event hosting:
* **For Attendees**: Scout live Google Search results in real time powered by the official **SerpApi Google Search API**, inspect original external sources, filter by evidence-based categories, and register for platform events with guaranteed real-time capacity checks.
* **For Community Hosts**: Transform external search discoveries into verified event drafts with attribution, upload high-resolution poster artwork via **Cloudinary**, set atomic RSVP limits, track registrations in a real-time host workspace, and export clean, formula-injection-safe CSV rosters.

---

## 🏛️ 2. High-Level System Architecture

EventScout is built on modern web standards with strict separation of concerns, zero-trust server boundaries, and atomic database consistency:

```mermaid
flowchart TD
    subgraph Client ["Client Interface (Next.js 16 / React 19 / Tailwind CSS v4)"]
        UI_Discover["Live Discovery Engine (/discover)"]
        UI_Create["Host Event Studio (/events/new)"]
        UI_Date["Custom Editorial DatePicker"]
        UI_Upload["Cloudinary Asset Manager (ImageUpload.tsx)"]
        UI_Details["Public Event & RSVP Page (/events/:slug)"]
        UI_Dash["Host Intelligence Dashboard (/dashboard)"]
    end

    subgraph Server ["Next.js 16 App Router (Node.js Runtime)"]
        API_Discover["GET/POST /api/discover (SerpApi Pipeline)"]
        API_Upload["POST/DELETE /api/upload (Cloudinary Pipeline)"]
        API_Events["GET/POST /api/events & Server Actions"]
        API_Register["POST /api/events/:id/register"]
        API_Export["GET /api/events/:id/export (CSV Generator)"]
        RateLimiter["Distributed Rate Limiter (20 req/min/IP)"]
        MagicBytes["Magic-Byte Security Inspector"]
    end

    subgraph External ["External Services"]
        SerpApi["SerpApi Google Search API (search.json)"]
        Cloudinary["Cloudinary CDN (Asset Transformation & Storage)"]
    end

    subgraph Database ["MongoDB Atlas Database"]
        Col_Events[("events Collection")]
        Col_Users[("users Collection")]
        Col_Registrations[("registrations Collection")]
        Col_RateLimits[("ratelimits TTL Collection")]
    end

    %% Discovery Flow
    UI_Discover -->|Search Payload| API_Discover
    API_Discover --> RateLimiter
    RateLimiter --> Col_RateLimits
    API_Discover -->|Server-Side Secret Key| SerpApi
    SerpApi -->|Raw Google SERP JSON| API_Discover
    API_Discover -->|Deduplicated, Scored & Categorized Events| UI_Discover

    %% Poster Upload Flow
    UI_Upload -->|Multipart Form Data| API_Upload
    API_Upload --> MagicBytes
    API_Upload -->|Stream Upload| Cloudinary
    Cloudinary -->|Secure CDN URL + Public ID| API_Upload
    API_Upload --> UI_Upload

    %% Creation & Registration Flow
    UI_Create -->|Validated EventCreationInput| API_Events
    API_Events --> Col_Events
    UI_Details -->|RSVP Request| API_Register
    API_Register -->|Atomic $inc & Unique Compound Index| Col_Events
    API_Register --> Col_Registrations
    API_Dash --> Col_Registrations
    API_Export -->|Formula-Sanitized CSV Stream| UI_Dash
```

---

## ⚡ 3. Feature Modules & Deep-Dive Specifications

### 3.1 Live Event Discovery Engine (`/discover`)
* **Real-Time SerpApi Pipeline**: Formulates natural Google search queries based on topic, Indian tech hub (e.g. *Ranchi, Bengaluru, Delhi NCR, Mumbai, Hyderabad*), timeframe, and category.
* **Safe URL Normalization & Deduplication**: Strips tracking artifacts (`utm_*`, `fbclid`, `gclid`, `ref`, trailing slashes). Deduplicates records appearing simultaneously in Google Rich Carousels (`events_results`) and organic results (`organic_results`).
* **Deterministic Relevance Scoring**: Transparent, auditable scoring rubric on every card:
  * Title match (`+25 pts`), Description snippet match (`+10 pts`)
  * Location match (`+25 pts`), Category match (`+20 pts`)
  * Confirmed date present (`+15 pts`), Recognized domain bonus (`+10 pts`)
* **Evidence-Based Categorization**: Classifies events strictly when explicit keyword proof exists (`Hackathons and competitions`, `Meetups and networking`, `Conferences and workshops`, `Student and campus events`), falling back strictly to `"Unclassified"`.
* **Zero-Hallucination Policy**: If a date or venue cannot be verified in the search metadata, it displays clear amber indicators (`Date not confirmed`, `Location unverified`).

### 3.2 External Discovery to Host Draft Ingestion
* **Draft Evaluation**: Automatically checks external search results with `evaluateDraftEligibility`. If the source URL, title, or snippet is sparse, drafting is blocked.
* **Pre-filled Host Ingestion**: Clicking **"Use Details to Create Event"** transfers the title, description, and source link into `/events/new`.
* **Host Verification Guard**: Displays an amber draft alert requiring hosts to manually verify missing dates, venue address, and ticket capacity, enforced by a mandatory verification confirmation checkbox.

### 3.3 Cloudinary Asset & Event Poster Pipeline
* **Dedicated Server Route (`/api/upload`)**: Manages the complete lifecycle of event cover banners and profile images.
* **Security & Magic-Byte Validation**: Validates file size (max 5MB) and inspects binary headers to prevent file extension spoofing:
  * JPEG: `FF D8 FF`
  * PNG: `89 50 4E 47 0D 0A 1A 0A`
  * GIF: `47 49 46 38`
  * WebP: `52 49 46 46 ... 57 45 42 50`
* **Automated Transformations (`src/lib/cloudinaryUrl.ts`)**:
  * Auto format delivery: `f_auto` (serves AVIF/WebP depending on browser capability)
  * Auto quality optimization: `q_auto`
  * Responsive high-DPR scaling: `dpr_auto`
  * Custom focus crops: `c_fill, g_auto`
* **Automatic Garbage Collection**: When a host replaces or removes a poster, the previous asset is deleted from Cloudinary using `cloudinary.uploader.destroy(publicId)`.

### 3.4 Custom Editorial DatePicker (`DatePicker.tsx`)
* **Warm Ivory Design System**: Custom calendar popover styled in Warm Ivory (`#FAF9F6`), Deep Ink (`#171923`), and Refined Indigo (`#5146E5`).
* **Compact Proportions (~240px)**: Engineered to be ~40% more compact than standard date pickers to prevent viewport overflow.
* **Month/Year Fast Switcher**: Clicking the header toggles a 12-month grid with year stepper to jump across years without clicking 12 times.
* **Instant Selection UX**: Selecting any day immediately updates the form and closes the popover.
* **Boundary Guard**: Disables past dates on event creation and restricts RSVP deadlines to dates on or before the event date (`maxDate`).

### 3.5 Smart Time Parsing & Future Date Validation
* **Natural Language Time Parser (`parseStartTime`)**: Decouples date selection from empty time fields and parses human formats:
  * 12-hour with intervals: `"10:00 AM - 4:00 PM"`
  * 12-hour single: `"6:30 PM"`, `"10:00 AM"`
  * 24-hour military: `"14:30"`, `"10:00"`
* **Timezone-Immune Calendar Evaluation**: Dates are evaluated as local calendar tuples `[year, month, day]`, preventing UTC off-by-one errors.
* **Same-Day Evaluation**: Events scheduled for today verify that the start time hasn't passed, while future dates are accepted immediately.

### 3.6 Attendee RSVP & Concurrency Protection
* **Guest One-Step Registration**: Unauthenticated guests can register for an event, create an account, and log in in a single frictionless form submission.
* **Double-RSVP Prevention**: Enforced at the database layer through a compound unique index:
  ```ts
  registrationSchema.index({ eventId: 1, attendeeId: 1 }, { unique: true });
  ```
* **Atomic Capacity Allocation**: Prevents race conditions and overbooking using atomic MongoDB operators:
  ```ts
  const updatedEvent = await Event.findOneAndUpdate(
    { _id: eventId, isClosed: false, $expr: { $lt: ["$attendeeCount", "$capacity"] } },
    { $inc: { attendeeCount: 1 } },
    { new: true }
  );
  ```
* **RSVP Cancellation Slot Release**: Attendees can cancel RSVPs in `/my-events`, atomically decrementing `attendeeCount` and reopening slots.

### 3.7 Host Workspace & CSV Export (`/dashboard`)
* **Real-Time Data Table**: Powered by **TanStack Table v8** with multi-column sorting, pagination, and search across attendee names, emails, and tickets.
* **Event Capacity Progress Bars**: Visual capacity utilization badges and event status toggles (`Open` / `Closed`).
* **Formula-Injection-Safe CSV Export**: Protects against CSV spreadsheet injection (formula execution) by prepending `'` and escaping quotes on fields starting with `=`, `+`, `-`, or `@`.

---

## 🗄️ 4. Database Schema & Data Models

### 4.1 `Event` Schema (`src/models/Event.ts`)
| Field | Type | Required | Description |
|---|---|---|---|
| `title` | `String` | Yes | Event title (min 3 chars) |
| `slug` | `String` | Yes | Unique URL slug with auto-collision handling |
| `description` | `String` | Yes | Event agenda and details (min 10 chars) |
| `date` | `Date` | Yes | Event date |
| `time` | `String` | Yes | Event time (e.g. `10:00 AM - 4:00 PM`) |
| `location` | `String` | Yes | Venue address or "Online" |
| `capacity` | `Number` | Yes | Positive integer for attendee capacity |
| `attendeeCount` | `Number` | Default 0 | Current number of active RSVPs |
| `registrationDeadline` | `Date` | Yes | Registration closing date ($\le$ event date) |
| `hostId` | `ObjectId` | Yes | Reference to `User` model (role: `host`) |
| `sourceUrl` | `String` | Optional | Original attribution URL for drafted events |
| `imageUrl` | `String` | Optional | Optimized Cloudinary poster image URL |
| `imagePublicId` | `String` | Optional | Cloudinary asset ID for lifecycle management |
| `isClosed` | `Boolean` | Default false | Manual or automatic closure flag |

### 4.2 `Registration` Schema (`src/models/Registration.ts`)
| Field | Type | Constraints | Description |
|---|---|---|---|
| `eventId` | `ObjectId` | Required, Ref `Event` | Targeted event |
| `attendeeId` | `ObjectId` | Required, Ref `User` | Registering user |
| `registeredAt` | `Date` | Default `Date.now` | Timestamp of RSVP |
| **Index** | **Compound** | `{ eventId: 1, attendeeId: 1 }` | **Unique** (prevents double RSVPs) |

### 4.3 `User` Schema (`src/models/User.ts`)
| Field | Type | Constraints | Description |
|---|---|---|---|
| `name` | `String` | Required | User display name |
| `email` | `String` | Required, Unique, Lowercase | Account email address |
| `password` | `String` | Required | Hashed password (bcrypt, 12 rounds) |
| `role` | `String` | Enum: `attendee`, `host` | Platform authorization role |

---

## 📡 5. Complete API Specification

### `GET /api/discover`
* **Query Parameters**:
  * `query` (string, optional): Keyword or topic
  * `location` (string, optional): Target city or region
  * `category` (string, optional): Target category filter
  * `date` (string, optional): Timeframe or specific month
  * `limit` (number, optional, default 10, max 20)
* **Response `200 OK`**:
  ```json
  {
    "events": [
      {
        "id": "e8f1b2...",
        "title": "Bengaluru Open Source Summit 2026",
        "description": "Annual conference on distributed systems and cloud native tools.",
        "link": "https://devfolio.co/events/boss-2026",
        "category": "Conferences and workshops",
        "relevanceScore": 95,
        "relevanceSignals": ["Keyword match in title", "Location matched: Bengaluru"],
        "dateDisplay": "Oct 25, 2026",
        "hasConfirmedDate": true,
        "location": "Koramangala, Bengaluru",
        "hasConfirmedLocation": true
      }
    ],
    "searchMetadata": {
      "totalResults": 1,
      "disclaimer": "Google Search results are live web discovery results...",
      "queryFormatted": "upcoming conferences in Bengaluru October 2026"
    }
  }
  ```

### `POST /api/upload`
* **Authentication**: Required (Host role only).
* **Payload**: `multipart/form-data` with `file`, `type` (`event` | `profile`), and optional `previousPublicId`.
* **Response `200 OK`**:
  ```json
  {
    "publicId": "eventscout/events/poster_1729337000",
    "secureUrl": "https://res.cloudinary.com/dqekptwof/image/upload/v1729337000/eventscout/events/poster_1729337000.webp",
    "format": "webp",
    "width": 1280,
    "height": 720,
    "bytes": 284100
  }
  ```

### `DELETE /api/upload`
* **Payload**: `{ "publicId": "eventscout/events/poster_1729337000" }`
* **Response `200 OK`**: `{ "success": true }`

---

## 🔒 6. Security & Reliability Architecture

1. **Exclusivity of Private API Keys**: `SERPAPI_API_KEY` and `CLOUDINARY_API_SECRET` are strictly kept server-side. No API keys are prefixed with `NEXT_PUBLIC_` or bundled into browser assets.
2. **Distributed IP Rate Limiting**: The discovery search endpoint is rate-limited to **20 requests/minute per IP** using a MongoDB TTL collection (`RateLimit`), with automatic in-memory fallback.
3. **MIME & Magic-Byte File Inspection**: Uploaded assets must pass both MIME inspection and binary magic-byte header validation, blocking disguised executables.
4. **Rel & Target Hardening**: All external links generated from Google Search discovery enforce `target="_blank"` and `rel="noopener noreferrer"` to prevent tab-nabbing.
5. **Scheme Whitelisting**: `sourceUrl` inputs strictly permit `http://` and `https://` protocols, eliminating `javascript:` and `data:` XSS vectors.

---

## 🛠️ 7. Environment Variables Reference

| Variable | Description | Environment | Example Value |
|---|---|---|---|
| `MONGODB_URI` | Connection URI for MongoDB Atlas | Server | `mongodb+srv://user:pass@cluster0.mongodb.net/eventscout` |
| `NEXTAUTH_SECRET` | 32+ character random string for signing JWTs | Server | Generated via `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Canonical app URL | Server | `https://event-registration-and-management-s-seven.vercel.app/` |
| `SERPAPI_API_KEY` | Private SerpApi Google Search API Key | Server | `721f764132758047f6...` |
| `CLOUDINARY_CLOUD_NAME`| Cloudinary Cloud Identifier | Server/Client | `dqekptwof` |
| `CLOUDINARY_API_KEY` | Cloudinary API Key | Server | `329233867398437` |
| `CLOUDINARY_API_SECRET`| Cloudinary Private API Secret | Server | `9VTAx1J8-CMi...` |
| `CLOUDINARY_FOLDER` | Destination folder on Cloudinary | Server | `eventscout/events` |
| `MAX_IMAGE_FILE_SIZE_BYTES` | Max poster file upload size | Server | `5242880` (5MB) |

---

## 🧪 8. Quality Assurance & Verification Metrics

* **Automated Unit & Integration Tests**: **86 / 86 tests passing** across 29 test suites:
  * URL normalization, tracking parameter stripping, and protocol sanitization.
  * Deterministic relevance scoring and evidence-based categorization.
  * Draft eligibility evaluation and date extraction.
  * Cloudinary upload magic-byte verification and payload schemas.
  * Future date evaluation and 12-hour/24-hour time string parsing.
  * Concurrency, compound unique constraints, and CSV injection sanitization.
* **TypeScript & Linting**: 0 errors under TypeScript strict mode and ESLint 9.
* **Production Build**: Successfully compiled with Next.js 16.2.7 Turbopack in 2.2 seconds.
