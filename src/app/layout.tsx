import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import SessionProvider from "@/components/SessionProvider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "EventScout — Live Event Discovery & Registration",
  description:
    "Curated discovery and seamless RSVP management for tech meetups, hackathons, conferences, and community gatherings across India.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#FAF9F6] text-[#171923] font-sans selection:bg-[#EEEAFE] selection:text-[#5146E5]">
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
