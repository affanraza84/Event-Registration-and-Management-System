import mongoose, { Schema, Document, Model } from "mongoose";
import { IHost } from "@/types";

export interface IHostDocument extends Omit<IHost, "id">, Document {
  _id: mongoose.Types.ObjectId;
}

const HostSchema = new Schema<IHostDocument>(
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

// Ensure the virtual 'id' is defined
HostSchema.virtual("id").get(function (this: IHostDocument) {
  return this._id.toHexString();
});

HostSchema.set("toJSON", { virtuals: true });
HostSchema.set("toObject", { virtuals: true });

const Host: Model<IHostDocument> =
  mongoose.models.Host || mongoose.model<IHostDocument>("Host", HostSchema);

export default Host;
