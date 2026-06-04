import mongoose, { Schema, Document, Model } from "mongoose";
import { IAttendee } from "@/types";

export interface IAttendeeDocument extends Omit<IAttendee, "id">, Document {
  _id: mongoose.Types.ObjectId;
}

const AttendeeSchema = new Schema<IAttendeeDocument>(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: {
      type: String,
      required: [true, "Password is required"],
    },
  },
  {
    timestamps: true,
  }
);

// Ensure virtual 'id' is defined
AttendeeSchema.virtual("id").get(function (this: IAttendeeDocument) {
  return this._id.toHexString();
});

AttendeeSchema.set("toJSON", { virtuals: true });
AttendeeSchema.set("toObject", { virtuals: true });

const Attendee: Model<IAttendeeDocument> =
  mongoose.models.Attendee ||
  mongoose.model<IAttendeeDocument>("Attendee", AttendeeSchema);

export default Attendee;
