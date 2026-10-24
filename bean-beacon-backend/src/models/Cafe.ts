import mongoose, { Schema } from "mongoose";
import { CafeDocument } from "../types/index.js";

const cafeSchema = new Schema<CafeDocument>(
  {
    osmId: {
      type: String,
      required: false,
      unique: true,
      sparse: true, // allows many docs with no osmId (user-submitted cafes)
    },
    name: {
      type: String,
      required: [true, "Please provide a cafe name"],
      index: true,
    },
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
        index: "2dsphere",
      },
    },
    address: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["coffee_shop", "cafe", "coworking"],
      default: "cafe",
    },
    website: String,
    phone: String,
    openingHours: [
      {
        day: String,
        hours: String,
      },
    ],
    beans: [String],
    wifi: {
      type: Boolean,
      default: false,
    },
    powerOutlets: {
      type: Boolean,
      default: false,
    },
    quietWorkspace: {
      type: Boolean,
      default: false,
    },
    userRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    reviewCount: {
      type: Number,
      default: 0,
    },
    tags: [String],

    // --- user-submitted café fields ---
    createdBy: {
      type: String,
      index: true,
    },
    category: {
      type: String,
      default: "Café",
    },
    hoursText: String,
    menuText: String,
    photoPath: String,
    galleryPaths: [String],
    coffeeTypes: [String],
    atmosphere: [String],
    amenities: [String],

    // cafes imported from OpenStreetMap are auto-approved (no owner to review them);
    // user-submitted cafes start pending and need an admin to approve them.
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "approved",
    },
  },
  {
    timestamps: true,
  }
);

export const Cafe = mongoose.model<CafeDocument>("Cafe", cafeSchema);
