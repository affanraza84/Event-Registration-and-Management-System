"use server";

import { getServerSession } from "next-auth/next";
import bcrypt from "bcrypt";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import Event from "@/models/Event";
import Attendee from "@/models/Attendee";
import Registration from "@/models/Registration";
import { getUniqueSlug } from "@/utils/slug";
import { eventCreationSchema } from "@/validations/event";
import { registrationSchema } from "@/validations/registration";
import mongoose from "mongoose";

/**
 * Server Action for Host to create a new event.
 */
export async function createEventAction(data: unknown) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "host") {
      return { error: "Unauthorized: Only hosts can create events" };
    }

    const validated = eventCreationSchema.safeParse(data);
    if (!validated.success) {
      const errorMessage = validated.error.issues
        .map((err) => err.message)
        .join(", ");
      return { error: errorMessage };
    }

    const {
      title,
      description,
      date,
      time,
      location,
      capacity,
      registrationDeadline,
    } = validated.data;

    await connectToDatabase();

    const slug = await getUniqueSlug(title);

    const newEvent = await Event.create({
      title,
      slug,
      description,
      date: new Date(date),
      time,
      location,
      capacity,
      registrationDeadline: new Date(registrationDeadline),
      hostId: new mongoose.Types.ObjectId(session.user.id),
      attendeeCount: 0,
      isClosed: false,
    });

    return {
      success: true,
      event: {
        id: newEvent._id.toString(),
        slug: newEvent.slug,
        title: newEvent.title,
      },
    };
  } catch (error: any) {
    console.error("Create event error:", error);
    return {
      error: error.message || "An unexpected error occurred during event creation",
    };
  }
}

/**
 * Server Action for registering an attendee (creates account if needed).
 */
export async function registerForEventAction(data: {
  eventId: string;
  name: string;
  email: string;
  password?: string;
}) {
  try {
    await connectToDatabase();

    const event = await Event.findById(data.eventId);
    if (!event) {
      return { error: "Event not found" };
    }

    // 1. Check Registration Deadline
    const deadline = new Date(event.registrationDeadline);
    // Allow deadline up to end of the day (23:59:59)
    const deadlineEnd = new Date(deadline.getFullYear(), deadline.getMonth(), deadline.getDate(), 23, 59, 59);
    if (new Date() > deadlineEnd) {
      return { error: "Registration Closed: The deadline has passed" };
    }

    // 2. Check Capacity Limit
    if (event.attendeeCount >= event.capacity || event.isClosed) {
      return { error: "Registration Closed: Event is at full capacity" };
    }

    const session = await getServerSession(authOptions);
    const email = data.email.toLowerCase().trim();

    let attendee = null;

    // Check if Attendee account exists
    const existingAttendee = await Attendee.findOne({ email });

    if (existingAttendee) {
      attendee = existingAttendee;

      // If not logged in as this attendee, require password verification
      const isAlreadyLoggedIn =
        session?.user?.email?.toLowerCase() === email &&
        session?.user?.role === "attendee";

      if (!isAlreadyLoggedIn) {
        if (!data.password) {
          return {
            error: "An account already exists with this email. Please log in or provide your password.",
          };
        }
        const isPasswordValid = await bcrypt.compare(
          data.password,
          attendee.passwordHash
        );
        if (!isPasswordValid) {
          return { error: "Incorrect password for this email address" };
        }
      }
    } else {
      // Create new attendee account
      if (!data.password || data.password.length < 6) {
        return { error: "Password must be at least 6 characters for a new account" };
      }
      if (!data.name || data.name.trim().length < 2) {
        return { error: "Name must be at least 2 characters for a new account" };
      }

      const passwordHash = await bcrypt.hash(data.password, 12);
      attendee = await Attendee.create({
        name: data.name.trim(),
        email,
        passwordHash,
      });
    }

    // 3. Prevent duplicate registration
    const existingRegistration = await Registration.findOne({
      eventId: event._id,
      attendeeId: attendee._id,
    });

    if (existingRegistration) {
      return { error: "You are already registered for this event" };
    }

    // 4. Atomic capacity allocation (increment attendeeCount if less than capacity)
    const updatedEvent = await Event.findOneAndUpdate(
      {
        _id: event._id,
        attendeeCount: { $lt: event.capacity },
        isClosed: false,
      },
      {
        $inc: { attendeeCount: 1 },
      },
      { new: true }
    );

    if (!updatedEvent) {
      return { error: "Registration Closed: Event is at full capacity" };
    }

    // 5. Create registration record
    try {
      const newRegistration = await Registration.create({
        eventId: event._id,
        attendeeId: attendee._id,
        attendeeName: data.name || attendee.name,
        attendeeEmail: email,
        registeredAt: new Date(),
      });

      return {
        success: true,
        registration: {
          id: newRegistration._id.toString(),
          eventId: event._id.toString(),
          attendeeId: attendee._id.toString(),
        },
      };
    } catch (regError: any) {
      // Revert event count increment if registration record fails
      await Event.findByIdAndUpdate(event._id, { $inc: { attendeeCount: -1 } });
      if (regError.code === 11000) {
        return { error: "You are already registered for this event" };
      }
      throw regError;
    }
  } catch (error: any) {
    console.error("Register event error:", error);
    return {
      error: error.message || "An unexpected error occurred during registration",
    };
  }
}

/**
 * Server Action for cancelling a registration.
 */
export async function cancelRegistrationAction(registrationId: string) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return { error: "Unauthorized: You must be logged in to cancel a registration" };
    }

    await connectToDatabase();

    const registration = await Registration.findById(registrationId);
    if (!registration) {
      return { error: "Registration not found" };
    }

    const event = await Event.findById(registration.eventId);
    if (!event) {
      return { error: "Event not found" };
    }

    // Check if the current user is authorized:
    // Either they are the registered attendee, OR they are the host of the event.
    const isOwnerAttendee =
      session.user.role === "attendee" &&
      session.user.id === registration.attendeeId.toString();

    const isEventHost =
      session.user.role === "host" && session.user.id === event.hostId.toString();

    if (!isOwnerAttendee && !isEventHost) {
      return { error: "Unauthorized: You cannot cancel this registration" };
    }

    // Delete registration
    await Registration.findByIdAndDelete(registrationId);

    // Decrement attendee count on event, ensuring it doesn't go below 0
    await Event.findByIdAndUpdate(event._id, {
      $inc: { attendeeCount: -1 },
    });

    return { success: true };
  } catch (error: any) {
    console.error("Cancel registration error:", error);
    return {
      error: error.message || "An unexpected error occurred during cancellation",
    };
  }
}
