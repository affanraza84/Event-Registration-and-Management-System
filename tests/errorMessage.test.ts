import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { getClearErrorMessage, formatValidationErrors } from "../src/utils/errorMessage.ts";

describe("Error Message Sanitizer & Formatter", () => {
  it("translates NextAuth CredentialsSignin to a clear sentence", () => {
    const result = getClearErrorMessage("CredentialsSignin");
    assert.equal(
      result,
      "The email or password you entered is incorrect. Please verify your credentials and try again."
    );
  });

  it("translates NextAuth OAuth error codes to friendly sentence", () => {
    const result = getClearErrorMessage("OAuthSignin");
    assert.equal(
      result,
      "There was a problem signing you in with your account provider. Please try signing in again."
    );
  });

  it("translates MongoDB duplicate email error (E11000) to clear sentence", () => {
    const rawError =
      "MongoServerError: E11000 duplicate key error collection: ev_test.attendees index: email_1 dup key: { email: 'user@example.com' }";
    const result = getClearErrorMessage(rawError);
    assert.equal(
      result,
      "An account with this email address already exists. Please sign in instead."
    );
  });

  it("translates MongoDB duplicate slug error (E11000) to clear sentence", () => {
    const rawError =
      "E11000 duplicate key error collection: ev_test.events index: slug_1 dup key: { slug: 'tech-summit' }";
    const result = getClearErrorMessage(rawError);
    assert.equal(
      result,
      "An event with a similar title already exists. Please choose a different title."
    );
  });

  it("translates MongoDB duplicate registration to clear sentence", () => {
    const rawError =
      "E11000 duplicate key error index: eventId_1_attendeeId_1 dup key: { eventId: '123' }";
    const result = getClearErrorMessage(rawError);
    assert.equal(result, "You are already registered for this event.");
  });

  it("translates database connection errors to clear sentence", () => {
    const rawError = "Error: connect ECONNREFUSED 127.0.0.1:27017";
    const result = getClearErrorMessage(rawError);
    assert.equal(
      result,
      "Unable to connect to the database. Please check your internet connection and try again."
    );
  });

  it("translates missing MONGODB_URI error to clear sentence", () => {
    const rawError =
      "Error: MONGODB_URI is not defined in environment variables. Please configure MONGODB_URI in your deployment settings.";
    const result = getClearErrorMessage(rawError);
    assert.equal(
      result,
      "The database service is currently unavailable. Please contact the administrator."
    );
  });

  it("translates authorization errors to polite sentences", () => {
    assert.equal(
      getClearErrorMessage("Unauthorized: Only hosts can create events"),
      "Only registered host accounts can create new events."
    );
    assert.equal(
      getClearErrorMessage("Unauthorized: You do not own this event"),
      "You do not have permission to modify this event because you are not its host."
    );
    assert.equal(
      getClearErrorMessage("Unauthorized: You cannot cancel this registration"),
      "You do not have permission to cancel this registration."
    );
  });

  it("translates registration business logic errors to clear sentences", () => {
    assert.equal(
      getClearErrorMessage("Registration Closed: The deadline has passed"),
      "Registration for this event is closed because the deadline has passed."
    );
    assert.equal(
      getClearErrorMessage("Registration Closed: Event is at full capacity"),
      "Registration is closed because this event has reached full capacity."
    );
  });

  it("translates image upload errors to clear sentences", () => {
    assert.equal(
      getClearErrorMessage(
        "Cloudinary service is not configured. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in your environment variables."
      ),
      "Image upload service is currently unavailable. Please try again later."
    );
    assert.equal(
      getClearErrorMessage("File is too large (7.2MB). Maximum allowed size is 5MB."),
      "The selected image exceeds the 5MB size limit. Please choose a smaller image."
    );
    assert.equal(
      getClearErrorMessage("Unsupported format. Please select a JPEG, PNG, WebP, or GIF image."),
      "Unsupported image format. Please select a JPEG, PNG, WebP, or GIF image."
    );
  });

  it("sanitizes runtime JavaScript crashes without leaking call stack or code", () => {
    const crash = new Error("TypeError: Cannot read properties of undefined (reading 'title')\n    at Object.handler (/app/src/actions/events.ts:42:15)");
    const result = getClearErrorMessage(crash, "Failed to process your request. Please try again.");
    assert.equal(result, "Failed to process your request. Please try again.");
  });

  it("formats Zod issues list cleanly into proper sentences", () => {
    const issues = [
      { message: "Title must be at least 3 characters", path: ["title"] },
      { message: "Location must be at least 3 characters", path: ["location"] },
    ];
    const result = formatValidationErrors(issues);
    assert.equal(
      result,
      "Please provide an event title with at least 3 characters. Please provide a location with at least 3 characters."
    );
  });

  it("always capitalizes and ensures final punctuation", () => {
    assert.equal(getClearErrorMessage("event not found"), "The requested event could not be found. It may have been removed.");
    assert.equal(getClearErrorMessage("something went wrong"), "Something went wrong.");
  });
});

