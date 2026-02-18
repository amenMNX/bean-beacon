import mongoose, { Schema } from "mongoose";
import { RatingDocument } from "../types/index.js";

const ratingSchema = new Schema<RatingDocument>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    cafeId: {
      type: String,
      required: true,
      index: true,
    },
    rating: {
      type: Number,
      required: [true, "Please provide a rating"],
      min: 1,
      max: 5,
    },
    review: {
      type: String,
      maxlength: 1000,
    },
  },
  {
    timestamps: true,
  }
);

// One rating per user per cafe
ratingSchema.index({ userId: 1, cafeId: 1 }, { unique: true });

export const Rating = mongoose.model<RatingDocument>("Rating", ratingSchema);
