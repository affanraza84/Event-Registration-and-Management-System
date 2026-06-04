import { z } from "zod";

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
  })
  .refine(
    (data) => {
      if (!data.date || !data.time) return false;
      const eventDateTime = new Date(`${data.date}T${data.time}`);
      return eventDateTime > new Date();
    },
    {
      message: "Event date and time must be in the future",
      path: ["date"],
    }
  )
  .refine(
    (data) => {
      if (!data.registrationDeadline) return false;
      // We check if the deadline date is in the future.
      // To prevent timezone issues during comparison, set time to end of day or compare dates.
      // E.g. deadline date (YYYY-MM-DD) vs current date
      const deadlineDate = new Date(`${data.registrationDeadline}T23:59:59`);
      return deadlineDate > new Date();
    },
    {
      message: "Registration deadline must be in the future",
      path: ["registrationDeadline"],
    }
  )
  .refine(
    (data) => {
      if (!data.date || !data.registrationDeadline) return false;
      const eventDate = new Date(data.date);
      const deadlineDate = new Date(data.registrationDeadline);
      return deadlineDate <= eventDate;
    },
    {
      message: "Registration deadline must be on or before the event date",
      path: ["registrationDeadline"],
    }
  );

export type EventCreationInput = z.infer<typeof eventCreationSchema>;
