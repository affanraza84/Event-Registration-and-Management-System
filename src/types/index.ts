import { Types } from "mongoose";

export interface IHost {
  _id: Types.ObjectId;
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  imageUrl?: string;
  imagePublicId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IAttendee {
  _id: Types.ObjectId;
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  imageUrl?: string;
  imagePublicId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IEvent {
  _id: Types.ObjectId;
  id: string;
  title: string;
  slug: string;
  description: string;
  date: Date;
  time: string;
  location: string;
  capacity: number;
  attendeeCount: number;
  registrationDeadline: Date;
  isClosed: boolean;
  hostId: Types.ObjectId;
  sourceUrl?: string;
  imageUrl?: string;
  imagePublicId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IRegistration {
  _id: Types.ObjectId;
  id: string;
  eventId: Types.ObjectId;
  attendeeId: Types.ObjectId;
  attendeeName: string;
  attendeeEmail: string;
  registeredAt: Date;
}

export type MediaResourceType = "image" | "video";
export type MediaAssetType = "poster" | "banner" | "gallery" | "promo_video";
export type ModerationStatus = "pending" | "approved" | "rejected";
export type ProcessingStatus = "uploading" | "ready" | "failed";

export interface IMediaAsset {
  _id: Types.ObjectId;
  id: string;
  publicId: string;
  secureUrl: string;
  resourceType: MediaResourceType;
  assetType: MediaAssetType;
  format: string;
  eventId: Types.ObjectId;
  uploadedBy: Types.ObjectId;
  tags: string[];
  tagSource?: "cloudinary_ai" | "context" | "manual";
  moderationStatus: ModerationStatus;
  processingStatus: ProcessingStatus;
  moderationReason?: string;
  width?: number;
  height?: number;
  duration?: number;
  bytes: number;
  createdAt: Date;
  updatedAt: Date;
}
