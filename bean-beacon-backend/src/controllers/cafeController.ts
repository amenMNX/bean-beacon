import { Request, Response } from "express";
import { Cafe } from "../models/Cafe.js";
import { overpassService } from "../services/overpassService.js";

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
