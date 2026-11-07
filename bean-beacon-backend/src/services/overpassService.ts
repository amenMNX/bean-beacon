import axios from "axios";
import { OverpassCafe } from "../types/index.js";
import NodeCache from "node-cache";
import { config } from "../config/index.js";

const cache = new NodeCache({ stdTTL: 3600 }); // Cache for 1 hour

/**
 * Fetch cafes from Overpass API based on location
 * Uses OverpassQL query to find coffee shops and cafes
 */
export const overpassService = {
  async fetchCafes(latitude: number, longitude: number, radiusKm: number = 5) {
    const cacheKey = `cafes_${latitude}_${longitude}_${radiusKm}`;
    const cached = cache.get<OverpassCafe[]>(cacheKey);

    if (cached) {
      return cached;
    }

    try {
      // OverpassQL query for cafes and coffee shops
      const latDelta = radiusKm / 111;
      const lonDelta =
        radiusKm / (111 * Math.cos((latitude * Math.PI) / 180));

      const south = latitude - latDelta;
      const north = latitude + latDelta;
      const west = longitude - lonDelta;
      const east = longitude + lonDelta;

      const bbox = `${south},${west},${north},${east}`;

      const query = `
        [out:json][timeout:60];
        nwr["amenity"="cafe"]["name"](${bbox});
        out center 50;
      `;

      const response = await axios.post(config.overpassApiUrl, `data=${encodeURIComponent(query)}`, {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "application/json",
          "User-Agent": "BeanBeacon/1.0 (coffee discovery application)",
    },
        timeout: 90000,
      });

      const cafes: OverpassCafe[] = [];

      if (response.data.elements) {
        for (const element of response.data.elements) {
          const lat = element.lat || element.center?.lat;
          const lon = element.lon || element.center?.lon;

          if (lat && lon) {
            cafes.push({
              id: element.id,
              lat,
              lon,
              tags: element.tags || {},
            });
          }
        }
      }

      cache.set(cacheKey, cafes);
      return cafes;
    } catch (error) {
      console.error("Error fetching from Overpass API:", error);
      return [];
    }
  },

  /**
   * Get distance between two coordinates in km
   */
  getDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  },
};
