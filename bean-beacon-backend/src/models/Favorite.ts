import mongoose, { Schema } from "mongoose";
import { FavoriteDocument } from "../types/index.js";

const favoriteSchema = new Schema<FavoriteDocument>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    cafeId: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// One favorite per user per cafe
favoriteSchema.index({ userId: 1, cafeId: 1 }, { unique: true });

export const Favorite = mongoose.model<FavoriteDocument>("Favorite", favoriteSchema);
