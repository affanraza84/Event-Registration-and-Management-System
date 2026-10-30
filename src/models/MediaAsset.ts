import mongoose, { Schema, Document, Model } from "mongoose";
import { IMediaAsset } from "@/types";

export interface IMediaAssetDocument extends Omit<IMediaAsset, "id">, Document {
  _id: mongoose.Types.ObjectId;
}

const MediaAssetSchema = new Schema<IMediaAssetDocument>(
  {
    publicId: {
      type: String,
      required: [true, "Public ID is required"],
      unique: true,
      trim: true,
      index: true,
    },
    secureUrl: {
      type: String,
      required: [true, "Secure URL is required"],
      trim: true,
    },
    resourceType: {
      type: String,
      enum: ["image", "video"],
      default: "image",
      required: [true, "Resource type is required"],
    },
    assetType: {
      type: String,
      enum: ["poster", "banner", "gallery", "promo_video"],
      default: "gallery",
      required: [true, "Asset type is required"],
      index: true,
    },
    format: {
      type: String,
      required: [true, "Media format is required"],
      trim: true,
      lowercase: true,
    },
    eventId: {
      type: Schema.Types.ObjectId,
      ref: "Event",
      required: [true, "Event ID reference is required"],
      index: true,
    },
    uploadedBy: {
      type: Schema.Types.ObjectId,
      ref: "Host",
      required: [true, "Uploader ID reference is required"],
      index: true,
    },
    tags: {
      type: [String],
      default: [],
      index: true,
    },
    tagSource: {
      type: String,
      enum: ["cloudinary_ai", "context", "manual"],
      default: "context",
    },
    moderationStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "approved",
      required: [true, "Moderation status is required"],
      index: true,
    },
    processingStatus: {
      type: String,
      enum: ["uploading", "ready", "failed"],
      default: "ready",
      required: [true, "Processing status is required"],
    },
    moderationReason: {
      type: String,
      trim: true,
      default: undefined,
    },
    width: {
      type: Number,
      default: undefined,
    },
    height: {
      type: Number,
      default: undefined,
    },
    duration: {
      type: Number,
      default: undefined,
    },
    bytes: {
      type: Number,
      required: [true, "File size in bytes is required"],
      min: [0, "Bytes cannot be negative"],
    },
  },
  {
    timestamps: true,
  }
);

// Virtual 'id' mapping
MediaAssetSchema.virtual("id").get(function (this: IMediaAssetDocument) {
  return this._id.toHexString();
});

MediaAssetSchema.set("toJSON", { virtuals: true });
MediaAssetSchema.set("toObject", { virtuals: true });

// Compound index for fast queries: fetch approved media for an event
MediaAssetSchema.index({ eventId: 1, moderationStatus: 1 });
MediaAssetSchema.index({ eventId: 1, assetType: 1 });
MediaAssetSchema.index({ uploadedBy: 1, createdAt: -1 });

const MediaAsset: Model<IMediaAssetDocument> =
  mongoose.models.MediaAsset ||
  mongoose.model<IMediaAssetDocument>("MediaAsset", MediaAssetSchema);

export default MediaAsset;

