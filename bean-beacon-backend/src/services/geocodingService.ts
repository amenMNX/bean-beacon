import axios from "axios";
import NodeCache from "node-cache";
import { config } from "../config/index.js";

const cache = new NodeCache({ stdTTL: 3600 });

interface NominatimResult {
  lat: string;
  lon: string;
}

export interface Coordinates {
  lat: number;
  lng: number;
}

export const geocodingService = {
  async geocodeAddress(address: string): Promise<Coordinates | null> {
    const normalizedAddress = address.trim();
    const cacheKey = normalizedAddress.toLowerCase();
    const cached = cache.get<Coordinates>(cacheKey);

    if (cached) {
      return cached;
    }

    const endpoint = new URL("/search", config.nominatimApiUrl);
    const response = await axios.get<NominatimResult[]>(endpoint.toString(), {
      params: {
        q: normalizedAddress,
        format: "jsonv2",
        limit: 1,
      },
      headers: {
        "User-Agent": config.nominatimUserAgent,
      },
      timeout: 10000,
    });

    const result = response.data[0];
    if (!result) {
      return null;
    }

    const coordinates = {
      lat: Number(result.lat),
      lng: Number(result.lon),
    };
    if (!Number.isFinite(coordinates.lat) || !Number.isFinite(coordinates.lng)) {
      throw new Error("Geocoding service returned invalid coordinates");
    }

    cache.set(cacheKey, coordinates);
    return coordinates;
  },
};
