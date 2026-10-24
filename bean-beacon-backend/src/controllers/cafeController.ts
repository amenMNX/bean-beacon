import { Request, Response } from "express";
import { Cafe } from "../models/Cafe.js";
import { overpassService } from "../services/overpassService.js";
import { geocodingService } from "../services/geocodingService.js";

export const getCafesByLocation = async (req: Request, res: Response) => {
  try {
    const { latitude, longitude, radius = 5, type } = req.query;

    if (!latitude || !longitude) {
      return res
        .status(400)
        .json({ success: false, error: "Latitude and longitude are required" });
    }

    const lat = parseFloat(latitude as string);
    const lon = parseFloat(longitude as string);
    const radiusNum = parseFloat(radius as string) || 5;

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
    }).limit(50);

    // If not enough results, fetch from Overpass API
    if (cafes.length < 10) {
      const overpassCafes = await overpassService.fetchCafes(lat, lon, radiusNum);

      // Save new cafes to database
      for (const overpassCafe of overpassCafes) {
        const existingCafe = await Cafe.findOne({ osmId: overpassCafe.id });
        if (!existingCafe) {
          try {
            await Cafe.create({
              osmId: overpassCafe.id.toString(),
              name: overpassCafe.tags.name || "Unnamed Cafe",
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
      }).limit(50);
    }

    res.json({
      success: true,
      data: cafes,
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
      filter = {}; // admins see all statuses
    } else if (req.user) {
      filter = { $or: [{ status: "approved" }, { createdBy: req.user.userId }] };
    }

    const cafes = await Cafe.find(filter).sort({ createdAt: -1 }).limit(200);
    res.json({ success: true, data: cafes });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
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

    if (!name || !address) {
      return res.status(400).json({ success: false, error: "Name and address are required" });
    }

    let coordinates: { lat: number; lng: number };
    if (lat === undefined && lng === undefined) {
      try {
        const geocoded = await geocodingService.geocodeAddress(String(address));
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

    const cafe = await Cafe.create({
      name: String(name).trim(),
      address: String(address).trim(),
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
