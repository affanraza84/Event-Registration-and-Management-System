import { z } from "zod";

/**
 * Safely parses human-entered event time strings like "10:00 AM", "10:00 AM - 4:00 PM",
 * "14:30", "6pm", etc. into { hours, minutes } in 24-hour format.
 */
export function parseStartTime(timeStr?: string): { hours: number; minutes: number } | null {
  if (!timeStr) return null;
  const match = timeStr.trim().match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
  if (!match) return null;
  let hours = parseInt(match[1], 10);
  const minutes = match[2] ? parseInt(match[2], 10) : 0;
  const meridian = match[3]?.toLowerCase();

  if (meridian === "pm" && hours < 12) hours += 12;
  if (meridian === "am" && hours === 12) hours = 0;

  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
  return { hours, minutes };
}

export const eventCreationSchema = z
  .object({
    title: z.string().min(3, "Title must be at least 3 characters").trim(),
    description: z
      .string()
      .min(10, "Description must be at least 10 characters")
      .trim(),
    date: z.string().min(1, "Date is required"),
    time: z.string().min(1, "Time is required"),
    location: z.string().min(3, "Location must be at least 3 characters").trim(),
    capacity: z.coerce
      .number()
      .int()
      .positive("Capacity must be a positive integer"),
    registrationDeadline: z.string().min(1, "Registration deadline is required"),
    sourceUrl: z
      .string()
      .trim()
      .url("Source URL must be a valid URL")
      .refine(
        (url) => !url || /^https?:\/\//i.test(url),
        "Source URL must use http or https protocol"
      )
      .optional()
      .or(z.literal("")),
    imageUrl: z
      .string()
      .trim()
      .url("Poster image must be a valid URL")
      .refine(
        (url) => !url || /^https?:\/\//i.test(url),
        "Poster image must use http or https protocol"
      )
      .optional()
      .or(z.literal("")),
    imagePublicId: z.string().trim().optional().or(z.literal("")),
  })
  .refine(
    (data) => {
      if (!data.date) return true;
      const [year, month, day] = data.date.split("-").map(Number);
      if (!year || !month || !day) return false;

      const now = new Date();
      const eventEndOfDay = new Date(year, month - 1, day, 23, 59, 59, 999);

      if (eventEndOfDay < now) {
        return false;
      }

      const isToday =
        now.getFullYear() === year &&
        now.getMonth() === month - 1 &&
        now.getDate() === day;

      if (isToday && data.time) {
        const parsedTime = parseStartTime(data.time);
        if (parsedTime) {
          const eventExactDateTime = new Date(
            year,
            month - 1,
            day,
            parsedTime.hours,
            parsedTime.minutes,
            0
          );
          return eventExactDateTime > now;
        }
      }

      return true;
    },
    {
      message: "Event date and time must be in the future",
      path: ["date"],
    }
  )
  .refine(
    (data) => {
      if (!data.registrationDeadline) return true;
      const [year, month, day] = data.registrationDeadline.split("-").map(Number);
      if (!year || !month || !day) return false;

      const deadlineEndOfDay = new Date(year, month - 1, day, 23, 59, 59, 999);
      return deadlineEndOfDay >= new Date();
    },
    {
      message: "Registration deadline must be in the future",
      path: ["registrationDeadline"],
    }
  )
  .refine(
    (data) => {
      if (!data.date || !data.registrationDeadline) return true;
      const [eventYear, eventMonth, eventDay] = data.date.split("-").map(Number);
      const [deadYear, deadMonth, deadDay] = data.registrationDeadline
        .split("-")
        .map(Number);
      if (
        !eventYear ||
        !eventMonth ||
        !eventDay ||
        !deadYear ||
        !deadMonth ||
        !deadDay
      ) {
        return true;
      }

      const eventDate = new Date(eventYear, eventMonth - 1, eventDay);
      const deadlineDate = new Date(deadYear, deadMonth - 1, deadDay);
      return deadlineDate <= eventDate;
    },
    {
      message: "Registration deadline must be on or before the event date",
      path: ["registrationDeadline"],
    }
  );

export type EventCreationInput = z.infer<typeof eventCreationSchema>;
