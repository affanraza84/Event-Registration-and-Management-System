import mongoose, { Schema, Document, Model } from "mongoose";
import { IRegistration } from "@/types";

export interface IRegistrationDocument extends Omit<IRegistration, "id">, Document {
  _id: mongoose.Types.ObjectId;
}

const RegistrationSchema = new Schema<IRegistrationDocument>(
  {
    eventId: {
      type: Schema.Types.ObjectId,
      ref: "Event",
      required: [true, "Event ID is required"],
      index: true,
    },
    attendeeId: {
      type: Schema.Types.ObjectId,
      ref: "Attendee",
      required: [true, "Attendee ID is required"],
      index: true,
    },
    attendeeName: {
      type: String,
      required: [true, "Attendee Name is required"],
      trim: true,
    },
    attendeeEmail: {
      type: String,
      required: [true, "Attendee Email is required"],
      lowercase: true,
      trim: true,
    },
    registeredAt: {
      type: Date,
      default: Date.now,
    },
  }
);

// Compound unique index to prevent duplicate registration of an attendee for the same event
RegistrationSchema.index({ eventId: 1, attendeeId: 1 }, { unique: true });

// Ensure virtual 'id' is defined
RegistrationSchema.virtual("id").get(function (this: IRegistrationDocument) {
  return this._id.toHexString();
});

RegistrationSchema.set("toJSON", { virtuals: true });
RegistrationSchema.set("toObject", { virtuals: true });

const Registration: Model<IRegistrationDocument> =
  mongoose.models.Registration ||
  mongoose.model<IRegistrationDocument>("Registration", RegistrationSchema);

export default Registration;
