/**
 * Error Message Sanitizer & Formatter
 * 
 * Translates raw, technical exceptions (MongoDB, NextAuth, Zod, network, system)
 * into clear, user-friendly sentences suitable for display everywhere in the application UI.
 */

export interface IssueLike {
  message?: string;
  path?: unknown;
  [key: string]: unknown;
}

export interface ErrorLike {
  message?: string;
  error?: string;
  issues?: IssueLike[];
  name?: string;
  [key: string]: unknown;
}

/**
 * Format an array of validation issues into clean, punctuated sentences.
 */
export function formatValidationErrors(issues: Array<IssueLike | { message?: string }>): string {
  if (!issues || issues.length === 0) {
    return "Please review the form fields and correct any invalid entries.";
  }

  const sentences = issues
    .map((issue) => {
      const msg = (issue.message || "").trim();
      if (!msg) return null;
      return getClearErrorMessage(msg);
    })
    .filter((s): s is string => Boolean(s));

  if (sentences.length === 0) {
    return "Please review the form fields and correct any invalid entries.";
  }

  // De-duplicate identical sentences
  const unique = Array.from(new Set(sentences));
  return unique.join(" ");
}

/**
 * Converts any error or raw error message into a clear, polite, human-readable sentence.
 *
 * @param error - The raw error string, Error object, NextAuth error, or unknown caught value.
 * @param fallback - Optional contextual fallback message if the error cannot be deciphered.
 * @returns A clear, grammatically complete sentence ending with punctuation.
 */
export function getClearErrorMessage(
  error: unknown,
  fallback = "An unexpected error occurred. Please try again."
): string {
  if (error === null || error === undefined) {
    return ensureSentence(fallback);
  }

  let raw = "";

  // 1. Extract string from different error shapes
  if (typeof error === "string") {
    raw = error.trim();
  } else if (error instanceof Error) {
    raw = error.message.trim();
  } else if (typeof error === "object") {
    const errObj = error as ErrorLike;
    if (Array.isArray(errObj.issues) && errObj.issues.length > 0) {
      return formatValidationErrors(errObj.issues);
    }
    if (typeof errObj.error === "string" && errObj.error.trim()) {
      raw = errObj.error.trim();
    } else if (typeof errObj.message === "string" && errObj.message.trim()) {
      raw = errObj.message.trim();
    }
  }

  if (!raw) {
    return ensureSentence(fallback);
  }

  // 2. NextAuth specific error codes
  if (raw === "CredentialsSignin" || raw.includes("CredentialsSignin")) {
    return "The email or password you entered is incorrect. Please verify your credentials and try again.";
  }
  if (
    raw === "OAuthSignin" ||
    raw === "OAuthCallback" ||
    raw === "OAuthCreateAccount" ||
    raw === "EmailCreateAccount" ||
    raw === "Callback" ||
    raw === "OAuthAccountNotLinked"
  ) {
    return "There was a problem signing you in with your account provider. Please try signing in again.";
  }
  if (raw === "SessionRequired") {
    return "Your session has expired. Please sign in again to continue.";
  }

  // 3. MongoDB duplicate key errors (E11000)
  if (raw.includes("E11000") || /duplicate key/i.test(raw)) {
    if (/email/i.test(raw)) {
      return "An account with this email address already exists. Please sign in instead.";
    }
    if (/slug/i.test(raw)) {
      return "An event with a similar title already exists. Please choose a different title.";
    }
    if (/attendee|registration|eventId/i.test(raw)) {
      return "You are already registered for this event.";
    }
    return "A record with these details already exists. Please check your information and try again.";
  }

  // 4. Database connection & Mongoose driver errors
  if (/MONGODB_URI is not defined/i.test(raw)) {
    return "The database service is currently unavailable. Please contact the administrator.";
  }
  if (
    /ECONNREFUSED|MongooseServerSelectionError|MongoNetworkError|MongoTimeoutError|ServerSelectionTimeoutError|buffering timed out|Topology was destroyed/i.test(
      raw
    )
  ) {
    return "Unable to connect to the database. Please check your internet connection and try again.";
  }
  if (/Cast to ObjectId failed|BSONError/i.test(raw)) {
    return "The requested item could not be found or has an invalid reference.";
  }

  // 5. Authorization & Permissions
  if (/Only hosts can create events/i.test(raw)) {
    return "Only registered host accounts can create new events.";
  }
  if (/Only hosts can edit events/i.test(raw)) {
    return "Only registered host accounts can edit events.";
  }
  if (/Only hosts can close events/i.test(raw)) {
    return "Only registered host accounts can close events.";
  }
  if (/Only hosts can delete events/i.test(raw)) {
    return "Only registered host accounts can delete events.";
  }
  if (/Only hosts can view dashboard data/i.test(raw)) {
    return "The host dashboard is restricted to host accounts.";
  }
  if (/Only hosts can export/i.test(raw)) {
    return "Only event hosts can export registration attendee data.";
  }
  if (/Only hosts can upload event posters/i.test(raw)) {
    return "Only host accounts can upload event poster banners.";
  }
  if (/You do not own this event/i.test(raw)) {
    return "You do not have permission to modify this event because you are not its host.";
  }
  if (/You cannot cancel this registration/i.test(raw)) {
    return "You do not have permission to cancel this registration.";
  }
  if (/You must be logged in to cancel a registration/i.test(raw) || /You must be signed in/i.test(raw)) {
    return "Please sign in to manage your registration.";
  }
  if (/Cannot delete assets outside/i.test(raw)) {
    return "You do not have permission to delete this image.";
  }
  if (/^Unauthorized/i.test(raw) && !raw.includes(":")) {
    return "You do not have permission to perform this action. Please sign in.";
  }
  if (/^Forbidden/i.test(raw) && !raw.includes(":")) {
    return "You do not have permission to perform this action.";
  }

  // 6. Registration & Event Business Rules
  if (/Event not found|Event with slug .* not found/i.test(raw)) {
    return "The requested event could not be found. It may have been removed.";
  }
  if (/Registration not found/i.test(raw)) {
    return "The requested registration record could not be found.";
  }
  if (/The deadline has passed/i.test(raw)) {
    return "Registration for this event is closed because the deadline has passed.";
  }
  if (/Event is at full capacity/i.test(raw) || /fully booked/i.test(raw)) {
    return "Registration is closed because this event has reached full capacity.";
  }
  if (/already registered for this event/i.test(raw)) {
    return "You are already registered for this event.";
  }
  if (/already exists with this email\. Please log in/i.test(raw)) {
    return "An account already exists with this email address. Please sign in or enter your password to RSVP.";
  }
  if (/account with this email already exists/i.test(raw)) {
    return "An account with this email address already exists. Please sign in instead.";
  }
  if (/Incorrect password for this email address|Incorrect password/i.test(raw)) {
    return "The password you entered is incorrect. Please try again.";
  }
  if (/No account found with this email|no account found/i.test(raw)) {
    return "No account was found with this email address. Please check your spelling or sign up.";
  }
  if (/Password must be at least 6 characters/i.test(raw)) {
    return "Your password must be at least 6 characters long.";
  }
  if (/Name must be at least 2 characters/i.test(raw)) {
    return "Please enter your full name (at least 2 characters).";
  }
  if (/Email, password, and role are required/i.test(raw)) {
    return "Please provide your email, password, and account role to proceed.";
  }
  if (/Invalid role specified/i.test(raw)) {
    return "Please select a valid account role to proceed.";
  }

  // 7. Cloudinary & Image Upload Errors
  if (/Cloudinary service is not configured|CLOUDINARY_/i.test(raw)) {
    return "Image upload service is currently unavailable. Please try again later.";
  }
  if (/File is too large|Maximum allowed size/i.test(raw)) {
    return "The selected image exceeds the 5MB size limit. Please choose a smaller image.";
  }
  if (/Unsupported format/i.test(raw)) {
    return "Unsupported image format. Please select a JPEG, PNG, WebP, or GIF image.";
  }
  if (/No file was provided/i.test(raw)) {
    return "Please select an image file to upload.";
  }
  if (/Missing or invalid publicId/i.test(raw)) {
    return "Invalid image reference. Please try again.";
  }
  if (/Failed to upload image/i.test(raw)) {
    return "Unable to upload the image right now. Please check your connection and try again.";
  }

  // 8. Discovery & SerpApi Errors
  if (/Live event discovery service is not currently configured/i.test(raw)) {
    return "Live event discovery service is not currently configured on this server.";
  }
  if (/Discovery search request timed out/i.test(raw)) {
    return "The search request timed out. Please try a more specific search query or try again later.";
  }
  if (/Too many requests|discovery rate limit/i.test(raw)) {
    return "You have made too many search requests. Please wait a moment before trying again.";
  }
  if (/Invalid search parameters/i.test(raw)) {
    return "Invalid search parameters. Please provide a valid search query or location.";
  }
  if (/Malformed request/i.test(raw)) {
    return "Malformed request. Please provide valid search criteria.";
  }
  if (/SerpApi service error|Failed to retrieve search results/i.test(raw)) {
    return "We were unable to retrieve live event results at this time. Please try again later.";
  }

  // 9. Network & HTTP Client Errors
  if (/Failed to fetch|NetworkError|network error|fetch failed|Load failed/i.test(raw)) {
    return "Unable to connect to the server. Please check your internet connection and try again.";
  }
  if (/AbortError|user aborted/i.test(raw)) {
    return "The request was cancelled. Please try again.";
  }
  if (/Unexpected token <|JSON\.parse|is not valid JSON/i.test(raw)) {
    return "The server returned an unexpected response. Please refresh the page and try again.";
  }

  // 10. Zod & Validation phrase refinements
  if (/^Invalid email/i.test(raw)) {
    return "Please provide a valid email address.";
  }
  if (/^Password is required/i.test(raw)) {
    return "Please enter your password.";
  }
  if (/^Title must be at least 3 characters/i.test(raw)) {
    return "Please provide an event title with at least 3 characters.";
  }
  if (/^Description must be at least 10 characters/i.test(raw)) {
    return "Please provide an event description with at least 10 characters.";
  }
  if (/^Location must be at least 3 characters/i.test(raw)) {
    return "Please provide a location with at least 3 characters.";
  }
  if (/^Capacity must be a positive integer/i.test(raw)) {
    return "Event capacity must be at least 1 attendee.";
  }
  if (/^Date is required/i.test(raw)) {
    return "Please select an event date.";
  }
  if (/^Time is required/i.test(raw)) {
    return "Please specify the event time.";
  }
  if (/^Registration deadline is required/i.test(raw)) {
    return "Please specify the registration deadline.";
  }
  if (/Registration deadline must be in the future/i.test(raw)) {
    return "The registration deadline must be set in the future.";
  }
  if (/Registration deadline must be before or on the event date/i.test(raw)) {
    return "The registration deadline must be on or before the event date.";
  }
  if (/Event date and time must be in the future|Event date must be in the future/i.test(raw)) {
    return "Please select an event date and time that is in the future.";
  }
  if (/Source URL must be a valid URL/i.test(raw)) {
    return "The source link must be a valid web address.";
  }
  if (/Source URL must use http or https protocol/i.test(raw)) {
    return "The source link must start with http:// or https://.";
  }
  if (/Poster image must be a valid URL/i.test(raw)) {
    return "The poster image must be a valid web address.";
  }

  // 11. Handle comma/semicolon-separated validation lists
  if (raw.includes(", ") || raw.includes("; ")) {
    const delimiter = raw.includes("; ") ? "; " : ", ";
    const parts = raw.split(delimiter).map((p) => p.trim()).filter(Boolean);
    if (parts.length > 1) {
      const formattedParts = parts.map((part) => getClearErrorMessage(part));
      const uniqueParts = Array.from(new Set(formattedParts));
      return uniqueParts.join(" ");
    }
  }

  // 12. Strip technical prefixes like "Error: ", "API error: "
  let cleaned = raw.replace(/^(Error|TypeError|ReferenceError|SyntaxError|RangeError):\s*/i, "");
  cleaned = cleaned.replace(/^Unauthorized:\s*/i, "");
  cleaned = cleaned.replace(/^Forbidden:\s*/i, "");
  cleaned = cleaned.replace(/^API (GET|POST|DELETE|PUT) [^:]+ error:\s*/i, "");

  // 13. Detect if the message still looks like code, stack trace, or raw technical dump
  const looksLikeCodeOrTrace =
    cleaned.includes("\n    at ") ||
    cleaned.includes("at Object.") ||
    /(\.ts|\.js|\.tsx|\.jsx):\d+/i.test(cleaned) ||
    cleaned.includes("undefined (reading") ||
    cleaned.includes("null (reading") ||
    cleaned.includes("Cannot read propert") ||
    cleaned.includes("is not a function") ||
    cleaned.includes("[object Object]") ||
    cleaned.startsWith("{") ||
    cleaned.includes("MongoServerError");

  if (looksLikeCodeOrTrace) {
    return ensureSentence(fallback);
  }

  // 14. Clean capitalization & sentence termination
  return ensureSentence(cleaned);
}

/**
 * Ensures a string starts with a capital letter and ends with a period, question mark, or exclamation mark.
 */
function ensureSentence(str: string): string {
  const trimmed = str.trim();
  if (!trimmed) {
    return "An unexpected error occurred. Please try again.";
  }

  // Capitalize first letter
  let result = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);

  // If ends with colon or semicolon, trim it
  result = result.replace(/[:;,\s]+$/, "");

  // Ensure ends with terminal punctuation
  if (!/[.!?]$/.test(result)) {
    result += ".";
  }

  return result;
}
