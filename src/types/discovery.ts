/**
 * TypeScript types for SerpApi Live Event Discovery & Intelligence
 */

export type EventClassification =
  | "Meetups and networking"
  | "Hackathons and competitions"
  | "Conferences and workshops"
  | "Student and campus events"
  | "Unclassified";

export interface IDiscoveredEvent {
  id: string;
  title: string;
  snippet: string;
  originalUrl: string;
  normalizedUrl: string;
  displayedSource?: string;
  category: EventClassification;
  dateInfo?: string;
  hasConfirmedDate: boolean;
  dateDisplay: string; // e.g., explicit date string or "Date not confirmed"
  locationInfo?: string;
  hasConfirmedLocation: boolean;
  locationDisplay: string; // e.g., explicit location or "Location unverified"
  relevanceScore: number;
  relevanceSignals: string[];
  isExternal: true;
}

export interface DiscoverySearchParams {
  query?: string;
  location?: string;
  category?: string;
  date?: string;
  limit?: number;
}

export interface DiscoveryResponse {
  success: boolean;
  searchQuery: string;
  totalResults: number;
  events: IDiscoveredEvent[];
  disclaimer: string;
}
