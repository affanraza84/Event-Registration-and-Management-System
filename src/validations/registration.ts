import { z } from "zod";

export const registrationSchema = z.object({
  eventId: z.string().min(1, "Event ID is required"),
  attendeeName: z.string().min(2, "Name must be at least 2 characters").trim(),
  attendeeEmail: z.string().email("Invalid email address").toLowerCase().trim(),
});

export type RegistrationInput = z.infer<typeof registrationSchema>;
