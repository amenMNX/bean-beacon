export interface AuthPayload {
  userId: string;
  email: string;
  iat?: number;
  exp?: number;
}

export interface UserDocument {
  _id: string;
  email: string;
  password: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CafeLocation {
  type: "Point";
  coordinates: [number, number]; // [longitude, latitude]
}

export interface CafeDocument {
  _id: string;
  osmId: string;
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
