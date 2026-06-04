import mongoose, { Schema, Document, Model } from "mongoose";
import { IEvent } from "@/types";

export interface IEventDocument extends Omit<IEvent, "id">, Document {
  _id: mongoose.Types.ObjectId;
}

const EventSchema = new Schema<IEventDocument>(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
    },
    slug: {
      type: String,
      required: [true, "Slug is required"],
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    description: {
      type: String,
      required: [true, "Description is required"],
    },
    date: {
      type: Date,
      required: [true, "Date is required"],
    },
    time: {
      type: String,
      required: [true, "Time is required"],
    },
    location: {
      type: String,
      required: [true, "Location is required"],
    },
    capacity: {
      type: Number,
      required: [true, "Capacity is required"],
      min: [1, "Capacity must be at least 1"],
    },
    attendeeCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    registrationDeadline: {
      type: Date,
      required: [true, "Registration deadline is required"],
    },
    isClosed: {
      type: Boolean,
      default: false,
    },
    hostId: {
      type: Schema.Types.ObjectId,
      ref: "Host",
      required: [true, "Host ID is required"],
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Ensure virtual 'id' is defined
EventSchema.virtual("id").get(function (this: IEventDocument) {
  return this._id.toHexString();
});

EventSchema.set("toJSON", { virtuals: true });
EventSchema.set("toObject", { virtuals: true });

const Event: Model<IEventDocument> =
  mongoose.models.Event || mongoose.model<IEventDocument>("Event", EventSchema);

export default Event;
