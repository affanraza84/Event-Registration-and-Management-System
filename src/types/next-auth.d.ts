import { DefaultSession, DefaultUser } from "next-auth";
import { JWT as DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "host" | "attendee";
      name?: string | null;
      email?: string | null;
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    role: "host" | "attendee";
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id: string;
    role: "host" | "attendee";
  }
}
