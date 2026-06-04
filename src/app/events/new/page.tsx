import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import CreateEventForm from "./CreateEventForm";

export const metadata = {
  title: "Create Event | Luma",
  description: "Host a new experience and manage registrations.",
};

export default async function NewEventPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login?callbackUrl=/events/new");
  }

  if (session.user.role !== "host") {
    redirect("/login?error=Only hosts can create events");
  }

  return <CreateEventForm />;
}
