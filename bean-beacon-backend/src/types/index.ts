export interface AuthPayload {
  userId: string;
  email: string;
  role: "user" | "admin";
  iat?: number;
  exp?: number;
}

export interface UserDocument {
  _id: string;
  email: string;
  password: string;
  name: string;
  role: "user" | "admin";
  createdAt: Date;
  updatedAt: Date;
}

export interface CafeLocation {
  type: "Point";
  coordinates: [number, number]; // [longitude, latitude]
}

export interface CafeDocument {
  _id: string;
  osmId?: string; // only set for cafes imported from OpenStreetMap
  name: string;
  location: CafeLocation;
  address: string;
  type: "coffee_shop" | "cafe" | "coworking";
  website?: string;
  phone?: string;
  openingHours?: {
    day: string;
    hours: string;
  }[];
  beans?: string[];
  wifi: boolean;
  powerOutlets: boolean;
  quietWorkspace: boolean;
  userRating: number;
  reviewCount: number;
  tags: string[];

  // --- fields for user-submitted cafés (from the merged Lovable frontend) ---
  createdBy?: string; // userId of the owner, unset for OSM-imported cafes
  category?: string; // "Café" | "Specialty" | "Roastery" | "Chain"
  hoursText?: string; // free-form opening hours, e.g. "Mon-Fri 7:00-18:00"
  menuText?: string; // free-form menu text
  photoPath?: string; // not used in MVP (no storage), kept for future use
  galleryPaths?: string[]; // not used in MVP, kept for future use
  coffeeTypes?: string[];
  atmosphere?: string[];
  amenities?: string[];
  status: "pending" | "approved" | "rejected"; // approval workflow

  createdAt: Date;
  updatedAt: Date;
}

export interface FavoriteDocument {
  _id: string;
  userId: string;
  cafeId: string;
  createdAt: Date;
}

export interface RatingDocument {
  _id: string;
  userId: string;
  cafeId: string;
  rating: number; // 1-5
  review: string;
  authorName?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface OverpassCafe {
  id: number;
  lat: number;
  lon: number;
  tags: Record<string, string>;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
