/**
 * TypeScript types for SerpApi Live Event Discovery
 */

export interface IDiscoveredEvent {
  id: string;
  title: string;
  snippet: string;
  originalUrl: string;
  displayedSource?: string;
  dateInfo?: string;
  locationInfo?: string;
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
