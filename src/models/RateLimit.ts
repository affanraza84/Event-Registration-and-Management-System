import mongoose, { Schema, Document, Model } from "mongoose";

export interface IRateLimitDocument extends Document {
  key: string;
  count: number;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const RateLimitSchema = new Schema<IRateLimitDocument>(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    count: {
      type: Number,
      required: true,
      default: 1,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// TTL index to automatically purge expired rate limit records
RateLimitSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const RateLimit: Model<IRateLimitDocument> =
  mongoose.models.RateLimit ||
  mongoose.model<IRateLimitDocument>("RateLimit", RateLimitSchema);

export default RateLimit;
