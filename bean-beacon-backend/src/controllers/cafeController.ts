import { Request, Response } from "express";
import axios from "axios";
import { Cafe } from "../models/Cafe.js";
import { overpassService } from "../services/overpassService.js";
import { geocodingService } from "../services/geocodingService.js";


const haversineKm = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
) => {
  const earthRadiusKm = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

// Bean Beacon currently operates in Tunisia only.
const TUNISIA_BOUNDS = {
  south: 30.2,
  north: 37.6,
  west: 7.5,
  east: 11.6,
};

const GENERIC_CAFE_NAMES = new Set([
  "cafe",
  "café",
  "coffee",
  "coffee shop",
  "coffeehouse",
  "coffee house",
  "unnamed cafe",
  "unnamed café",
  "unnamed coffee shop",
]);

const hasUsableCafeName = (value: unknown) => {
  if (typeof value !== "string") return false;
  const name = value.trim();
  const normalized = name.toLocaleLowerCase().replace(/\s+/g, " ");

  return (
    name.length >= 3 &&
    /\p{L}/u.test(name) &&
    !GENERIC_CAFE_NAMES.has(normalized)
  );
};

const isInTunisia = (lat: number, lon: number) =>
  lat >= TUNISIA_BOUNDS.south &&
  lat <= TUNISIA_BOUNDS.north &&
  lon >= TUNISIA_BOUNDS.west &&
  lon <= TUNISIA_BOUNDS.east;

const isUsableTunisiaCafe = (cafe: { name?: unknown; location?: { coordinates?: number[] } }) => {
  const [lon, lat] = cafe.location?.coordinates ?? [];
  return (
    hasUsableCafeName(cafe.name) &&
    Number.isFinite(lat) &&
    Number.isFinite(lon) &&
    isInTunisia(lat, lon)
  );
};

const coordinatesFromGoogleMapsUrl = (value: unknown) => {
  if (typeof value !== "string" || !value.trim()) return undefined;

  const url = value.trim();
  const patterns = [
    /@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/,
    /!3d(-?\d+(?:\.\d+)?).*?!4d(-?\d+(?:\.\d+)?)/,
    /[?&](?:q|query)=(-?\d+(?:\.\d+)?)[,%20]+(-?\d+(?:\.\d+)?)/,
  ];

  for (const pattern of patterns) {
    const result = url.match(pattern);
    if (result) {
      const lat = Number(result[1]);
      const lng = Number(result[2]);
      if (Number.isFinite(lat) && Number.isFinite(lng)) return { lat, lng };
    }
  }

  return undefined;
};

const coordinatesFromGoogleMapsLink = async (value: unknown) => {
  const directCoordinates = coordinatesFromGoogleMapsUrl(value);
  if (directCoordinates || typeof value !== "string") return directCoordinates;

  const input = value.trim();
  if (!input) return undefined;

  try {
    const parsedUrl = new URL(input);
    const isGoogleMapsHost =
      parsedUrl.hostname === "maps.app.goo.gl" ||
      parsedUrl.hostname === "goo.gl" ||
      parsedUrl.hostname.endsWith("google.com");

    if (!isGoogleMapsHost) return undefined;

    const response = await axios.get(input, {
      maxRedirects: 5,
      timeout: 10000,
      headers: { "User-Agent": "BeanBeacon/1.0 (coffee discovery application)" },
    });

    const finalUrl =
      response.request?.res?.responseUrl ||
      response.request?.responseURL ||
      response.config.url;

    return coordinatesFromGoogleMapsUrl(finalUrl);
  } catch (error) {
    console.warn("Could not resolve Google Maps URL", error);
    return undefined;
  }
};

const verifyCoffeePlace = async (lat: number, lng: number) => {
  const nearbyPlaces = await overpassService.fetchCafes(lat, lng, 0.15);

  return nearbyPlaces.some(
    (place) => overpassService.getDistance(lat, lng, place.lat, place.lon) <= 0.15
  );
};


export const getCafesByLocation = async (req: Request, res: Response) => {
  try {
    const { latitude, longitude, radius = 20, type } = req.query;

    if (!latitude || !longitude) {
      return res
        .status(400)
        .json({ success: false, error: "Latitude and longitude are required" });
    }

    const lat = parseFloat(latitude as string);
    const lon = parseFloat(longitude as string);
    const requestedRadius = parseFloat(radius as string);
    const radiusNum = Number.isFinite(requestedRadius)
      ? Math.min(Math.max(requestedRadius, 1), 20)
      : 20;

    // First, try to get from database with nearby cafes
    let cafes = await Cafe.find({
      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [lon, lat],
          },
          $maxDistance: radiusNum * 1000, // Convert km to meters
        },
      },
    }).limit(100);
    cafes = cafes.filter(isUsableTunisiaCafe);

    // If not enough results, fetch from Overpass API
    if (cafes.length < 10) {
      const overpassCafes = await overpassService.fetchCafes(lat, lon, radiusNum);

      // Save new cafes to database
      for (const overpassCafe of overpassCafes) {
        if (
          !hasUsableCafeName(overpassCafe.tags.name) ||
          !isInTunisia(overpassCafe.lat, overpassCafe.lon)
        ) {
          continue;
        }

        const existingCafe = await Cafe.findOne({ osmId: overpassCafe.id });
        if (!existingCafe) {
          try {
            await Cafe.create({
              osmId: overpassCafe.id.toString(),
              name: overpassCafe.tags.name.trim(),
              location: {
                type: "Point",
                coordinates: [overpassCafe.lon, overpassCafe.lat],
              },
              address: overpassCafe.tags["addr:street"] || "Address not available",
              type: overpassCafe.tags.amenity === "cafe" ? "cafe" : "coffee_shop",
              wifi: overpassCafe.tags.wifi === "yes",
              powerOutlets: overpassCafe.tags["power_supply:socket"] === "yes",
              website: overpassCafe.tags.website,
              phone: overpassCafe.tags.phone,
              tags: [overpassCafe.tags.amenity || "cafe"],
            });
          } catch (error) {
            // Ignore duplicates or validation errors
          }
        }
      }

      // Fetch again from database
      cafes = await Cafe.find({
        location: {
          $near: {
            $geometry: {
              type: "Point",
              coordinates: [lon, lat],
            },
            $maxDistance: radiusNum * 1000,
          },
        },
      }).limit(100);
      cafes = cafes.filter(isUsableTunisiaCafe);
    }

    const data = cafes
      .map((cafe) => {
        const [cafeLon, cafeLat] = cafe.location.coordinates;
        return {
          cafe: cafe.toObject(),
          exactDistanceKm: haversineKm(lat, lon, cafeLat, cafeLon),
        };
      })
      .sort((a, b) => a.exactDistanceKm - b.exactDistanceKm)
      .map(({ cafe, exactDistanceKm }) => ({
        ...cafe,
        // Keep extra precision for stable ordering; the UI displays one decimal.
        distanceKm: Math.round(exactDistanceKm * 1000) / 1000,
      }));

    res.json({
      success: true,
      data,
    });
  } catch (error: any) {
    console.error("Error fetching cafes:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const searchCafes = async (req: Request, res: Response) => {
  try {
    const { query, latitude, longitude } = req.query;

    if (!query) {
      return res.status(400).json({ success: false, error: "Search query is required" });
    }

    let searchQuery: any = {
      $or: [
        { name: { $regex: query, $options: "i" } },
        { address: { $regex: query, $options: "i" } },
        { tags: { $regex: query, $options: "i" } },
      ],
    };

    // If location provided, sort by distance
    let cafes;
    if (latitude && longitude) {
      const lat = parseFloat(latitude as string);
      const lon = parseFloat(longitude as string);

      cafes = await Cafe.find({
        ...searchQuery,
        location: {
          $near: {
            $geometry: {
              type: "Point",
              coordinates: [lon, lat],
            },
          },
        },
      }).limit(50);
    } else {
      cafes = await Cafe.find(searchQuery).limit(50);
    }

    res.json({
      success: true,
      data: cafes,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getCafeById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const cafe = await Cafe.findById(id);
    if (!cafe) {
      return res.status(404).json({ success: false, error: "Cafe not found" });
    }

    res.json({
      success: true,
      data: cafe,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// --- New endpoints for the merged frontend (replaces direct Supabase table access) ---

// GET /api/cafes/all — flat list for the café finder + Manage/Dashboard pages.
// Mirrors the Supabase RLS policy "View approved, own, or all for admins":
//   - anonymous / regular users see status=approved cafes, plus their own (any status)
//   - admins see everything
export const listAllCafes = async (req: Request, res: Response) => {
  try {
    let filter: any = { status: "approved" };

    if (req.user?.role === "admin") {
      filter = {};
    } else if (req.user) {
      filter = {
        $or: [
          { status: "approved" },
          { createdBy: req.user.userId },
        ],
      };
    }

    const rawLat = req.query.lat;
    const rawLng = req.query.lng;

    const hasLocation = rawLat !== undefined || rawLng !== undefined;

    if (hasLocation && (rawLat === undefined || rawLng === undefined)) {
      return res.status(400).json({
        success: false,
        error: "Both lat and lng are required",
      });
    }

    const lat = rawLat !== undefined ? Number(rawLat) : undefined;
    const lng = rawLng !== undefined ? Number(rawLng) : undefined;

    if (
      hasLocation &&
      (lat === undefined ||
        lng === undefined ||
        !Number.isFinite(lat) ||
        !Number.isFinite(lng) ||
        Math.abs(lat) > 90 ||
        Math.abs(lng) > 180)
    ) {
      return res.status(400).json({
        success: false,
        error: "Invalid latitude or longitude",
      });
    }

    let cafes;

    if (hasLocation) {
      filter.location = {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [lng, lat],
          },
        },
      };

      cafes = (await Cafe.find(filter).limit(200)).filter(isUsableTunisiaCafe);

      const data = cafes.map((cafe) => {
        const [cafeLng, cafeLat] = cafe.location.coordinates;

        return {
          ...cafe.toObject(),
          distanceKm: Math.round(
            haversineKm(lat!, lng!, cafeLat, cafeLng) * 10
          ) / 10,
        };
      });

      return res.json({ success: true, data });
    }

    cafes = (await Cafe.find(filter)
      .sort({ createdAt: -1 })
      .limit(200)).filter(isUsableTunisiaCafe);

    res.json({ success: true, data: cafes });
  } catch (error: any) {
    console.error("Error listing cafes:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};
// POST /api/cafes — create a user-submitted cafe. Requires auth.
// Always starts as "pending" — only an admin can approve it (status from the
// request body is ignored on purpose, so a regular user can't self-approve).
export const createCafe = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: "Not authenticated" });
    }

    const {
      name,
      address,
      mapUrl,
      phone,
      hoursText,
      menuText,
      lat,
      lng,
      category,
      coffeeTypes,
      atmosphere,
      amenities,
    } = req.body;

    if (!name || (!address && !mapUrl)) {
      return res.status(400).json({ success: false, error: "Name and address or Google Maps URL are required" });
    }

    let coordinates: { lat: number; lng: number };
    const mapCoordinates = await coordinatesFromGoogleMapsLink(mapUrl);

    if (mapCoordinates) {
      coordinates = mapCoordinates;
    } else if (lat === undefined && lng === undefined) {
      try {
        const geocoded = await geocodingService.geocodeAddress(String(address ?? mapUrl));
        if (!geocoded) {
          return res.status(422).json({
            success: false,
            error: "Address could not be located. Please provide a more specific address.",
          });
        }
        coordinates = geocoded;
      } catch (error) {
        console.error("Error geocoding café address:", error);
        return res.status(502).json({
          success: false,
          error: "Address lookup is temporarily unavailable. Please try again.",
        });
      }
    } else {
      const latNum = Number(lat);
      const lngNum = Number(lng);
      const hasCoords =
        lat !== "" &&
        lng !== "" &&
        Number.isFinite(latNum) &&
        Number.isFinite(lngNum) &&
        Math.abs(latNum) <= 90 &&
        Math.abs(lngNum) <= 180;

      if (!hasCoords) {
        return res.status(400).json({
          success: false,
          error: "Provide both valid latitude and longitude, or leave both blank to locate the address.",
        });
      }
      coordinates = { lat: latNum, lng: lngNum };
    }

    if (!isInTunisia(coordinates.lat, coordinates.lng)) {
      return res.status(422).json({
        success: false,
        error: "The Google Maps location must be in Tunisia.",
      });
    }

    let isCoffeePlace = false;
    try {
      isCoffeePlace = await verifyCoffeePlace(coordinates.lat, coordinates.lng);
    } catch (error) {
      console.error("Coffee place verification failed:", error);
      return res.status(502).json({
        success: false,
        error: "Coffee place verification is temporarily unavailable. Please try again.",
      });
    }

    if (!isCoffeePlace) {
      return res.status(422).json({
        success: false,
        error: "This location could not be verified as a coffee shop. Please use a café location listed on OpenStreetMap.",
      });
    }

    const cafe = await Cafe.create({
      name: String(name).trim(),
      address: String(address || mapUrl).trim(),
      phone: phone ? String(phone).trim() : undefined,
      hoursText: hoursText ? String(hoursText).trim() : undefined,
      menuText: menuText ? String(menuText).trim() : undefined,
      category: category || "Café",
      coffeeTypes: Array.isArray(coffeeTypes) ? coffeeTypes : [],
      atmosphere: Array.isArray(atmosphere) ? atmosphere : [],
      amenities: Array.isArray(amenities) ? amenities : [],
      location: { type: "Point", coordinates: [coordinates.lng, coordinates.lat] },
      createdBy: req.user.userId,
      status: req.user.role === "admin" ? "approved" : "pending",
    });

    res.status(201).json({ success: true, data: cafe });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// POST /api/cafes/:id/photo — owner or admin. Sets the café's cover photo.
// The actual file handling (validation, saving to disk) happens in the
// uploadCafePhoto multer middleware that runs before this controller.
export const setCafePhoto = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: "Not authenticated" });
    }

    const { id } = req.params;
    const cafe = await Cafe.findById(id);
    if (!cafe) {
      return res.status(404).json({ success: false, error: "Cafe not found" });
    }

    if (cafe.createdBy !== req.user.userId && req.user.role !== "admin") {
      return res.status(403).json({ success: false, error: "You can only update your own cafes" });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, error: "No photo file provided" });
    }

    cafe.photoPath = `/uploads/cafes/${req.file.filename}`;
    await cafe.save();

    res.json({ success: true, data: cafe });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// PATCH /api/cafes/:id/status — admin only. Approve or reject a listing.
export const updateCafeStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["approved", "rejected", "pending"].includes(status)) {
      return res.status(400).json({ success: false, error: "Invalid status" });
    }

    const cafe = await Cafe.findByIdAndUpdate(id, { status }, { new: true });
    if (!cafe) {
      return res.status(404).json({ success: false, error: "Cafe not found" });
    }

    res.json({ success: true, data: cafe });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// PATCH /api/cafes/:id — admin editing for imported and manager cafés.
export const updateCafeDetails = async (req: Request, res: Response) => {
  try {
    const cafe = await Cafe.findById(req.params.id);
    if (!cafe) {
      return res.status(404).json({ success: false, error: "Cafe not found" });
    }

    if (!req.user || (req.user.role !== "admin" && cafe.createdBy !== req.user.userId)) {
      return res.status(403).json({ success: false, error: "You can only edit your own cafés" });
    }

    const { name, address, phone, hoursText, menuText, category, lat, lng } = req.body;

    if (name !== undefined) {
      if (typeof name !== "string" || !name.trim()) {
        return res.status(400).json({ success: false, error: "Cafe name is required" });
      }
      cafe.name = name.trim();
    }
    if (address !== undefined) cafe.address = String(address).trim();
    if (phone !== undefined) cafe.phone = phone ? String(phone).trim() : undefined;
    if (hoursText !== undefined) cafe.hoursText = hoursText ? String(hoursText).trim() : undefined;
    if (menuText !== undefined) cafe.menuText = menuText ? String(menuText).trim() : undefined;
    if (category !== undefined) cafe.category = category;

    if (lat !== undefined || lng !== undefined) {
      const nextLat = Number(lat ?? cafe.location.coordinates[1]);
      const nextLng = Number(lng ?? cafe.location.coordinates[0]);
      if (!Number.isFinite(nextLat) || !Number.isFinite(nextLng) || !isInTunisia(nextLat, nextLng)) {
        return res.status(422).json({
          success: false,
          error: "Coordinates must be valid and inside Tunisia",
        });
      }
      cafe.location = { type: "Point", coordinates: [nextLng, nextLat] };
    }

    await cafe.save();
    res.json({ success: true, data: cafe });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// DELETE /api/cafes/:id — owner or admin.
export const deleteCafe = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: "Not authenticated" });
    }

    const { id } = req.params;
    const cafe = await Cafe.findById(id);
    if (!cafe) {
      return res.status(404).json({ success: false, error: "Cafe not found" });
    }

    if (cafe.createdBy !== req.user.userId && req.user.role !== "admin") {
      return res.status(403).json({ success: false, error: "You can only delete your own cafes" });
    }

    await Cafe.deleteOne({ _id: id });
    res.json({ success: true, message: "Cafe deleted" });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};
