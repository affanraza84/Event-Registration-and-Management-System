"use server";

import bcrypt from "bcrypt";
import { connectToDatabase } from "@/lib/db";
import Host from "@/models/Host";
import Attendee from "@/models/Attendee";
import { signupSchema } from "@/validations/auth";

export async function signUpAction(data: unknown) {
  try {
    const validated = signupSchema.safeParse(data);

    if (!validated.success) {
      const errorMessage = validated.error.issues
        .map((err) => err.message)
        .join(", ");
      return { error: errorMessage };
    }

    const { name, email, password, role } = validated.data;

    await connectToDatabase();

    if (role === "host") {
      const existingHost = await Host.findOne({ email });
      if (existingHost) {
        return { error: "An account with this email already exists" };
      }

      const passwordHash = await bcrypt.hash(password, 12);
      const newHost = await Host.create({
        name,
        email,
        passwordHash,
      });

      return {
        success: true,
        user: {
          id: newHost._id.toString(),
          name: newHost.name,
          email: newHost.email,
          role,
        },
      };
    } else {
      const existingAttendee = await Attendee.findOne({ email });
      if (existingAttendee) {
        return { error: "An account with this email already exists" };
      }

      const passwordHash = await bcrypt.hash(password, 12);
      const newAttendee = await Attendee.create({
        name,
        email,
        passwordHash,
      });

      return {
        success: true,
        user: {
          id: newAttendee._id.toString(),
          name: newAttendee.name,
          email: newAttendee.email,
          role,
        },
      };
    }
  } catch (error: unknown) {
    console.error("Signup error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unexpected error occurred during signup";
    return {
      error: errorMessage,
    };
  }
}
