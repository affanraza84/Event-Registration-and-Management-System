import { Types } from "mongoose";

export interface IHost {
  _id: Types.ObjectId;
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IAttendee {
  _id: Types.ObjectId;
  id: string;
  name: string;
  email: string;
  passwordHash: string;
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
