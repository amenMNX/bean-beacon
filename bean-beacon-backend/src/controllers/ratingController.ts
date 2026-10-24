import { Request, Response } from "express";
import { Rating } from "../models/Rating.js";
import { Cafe } from "../models/Cafe.js";

export const getCafeRatings = async (req: Request, res: Response) => {
  try {
    const { cafeId } = req.params;

    const ratings = await Rating.find({ cafeId }).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: ratings,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// GET /api/admin/reviews — admin only. Every review across every cafe,
// for the owner dashboard's "Reviews" and "Activity" tabs.
export const getAllRatings = async (_req: Request, res: Response) => {
  try {
    const ratings = await Rating.find().sort({ createdAt: -1 }).limit(500);
    res.json({ success: true, data: ratings });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const addRating = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: "Not authenticated" });
    }

    const { cafeId } = req.params;
    const { rating, review, authorName } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res
        .status(400)
        .json({ success: false, error: "Rating must be between 1 and 5" });
    }

    const cafe = await Cafe.findById(cafeId);
    if (!cafe) {
      return res.status(404).json({ success: false, error: "Cafe not found" });
    }

    // Check if user already rated this cafe (acts as the upsert the old
    // Supabase `.upsert(..., { onConflict: "cafe_id,user_id" })` call did)
    const existingRating = await Rating.findOne({
      userId: req.user.userId,
      cafeId,
    });

    let savedRating;
    if (existingRating) {
      existingRating.rating = rating;
      existingRating.review = review || "";
      if (authorName) existingRating.authorName = authorName;
      savedRating = await existingRating.save();
    } else {
      const newRating = new Rating({
        userId: req.user.userId,
        cafeId,
        rating,
        review: review || "",
        authorName: authorName || "",
      });

      savedRating = await newRating.save();
    }

    // Recalculate cafe average rating
    const allRatings = await Rating.find({ cafeId });
    const averageRating =
      allRatings.reduce((sum, r) => sum + r.rating, 0) / allRatings.length;

    await Cafe.updateOne(
      { _id: cafeId },
      {
        userRating: Math.round(averageRating * 10) / 10,
        reviewCount: allRatings.length,
      }
    );

    res.json({
      success: true,
      data: savedRating,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateRating = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: "Not authenticated" });
    }

    const { cafeId, ratingId } = req.params;
    const { rating, review } = req.body;

    const ratingDoc = await Rating.findById(ratingId);
    if (!ratingDoc) {
      return res.status(404).json({ success: false, error: "Rating not found" });
    }

    if (ratingDoc.userId !== req.user.userId) {
      return res.status(403).json({ success: false, error: "Unauthorized" });
    }

    if (rating) {
      ratingDoc.rating = rating;
    }
    if (review !== undefined) {
      ratingDoc.review = review;
    }

    await ratingDoc.save();

    const allRatings = await Rating.find({ cafeId });
    const averageRating =
      allRatings.reduce((sum, r) => sum + r.rating, 0) / allRatings.length;

    await Cafe.updateOne(
      { _id: cafeId },
      {
        userRating: Math.round(averageRating * 10) / 10,
        reviewCount: allRatings.length,
      }
    );

    res.json({
      success: true,
      data: ratingDoc,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const deleteRating = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: "Not authenticated" });
    }

    const { cafeId, ratingId } = req.params;

    const ratingDoc = await Rating.findById(ratingId);
    if (!ratingDoc) {
      return res.status(404).json({ success: false, error: "Rating not found" });
    }

    // Owner of the review, or an admin moderating it, may delete it.
    if (ratingDoc.userId !== req.user.userId && req.user.role !== "admin") {
      return res.status(403).json({ success: false, error: "Unauthorized" });
    }

    await Rating.deleteOne({ _id: ratingId });

    const allRatings = await Rating.find({ cafeId });
    const averageRating =
      allRatings.length > 0
        ? allRatings.reduce((sum, r) => sum + r.rating, 0) / allRatings.length
        : 0;

    await Cafe.updateOne(
      { _id: cafeId },
      {
        userRating: Math.round(averageRating * 10) / 10,
        reviewCount: allRatings.length,
      }
    );

    res.json({
      success: true,
      message: "Rating deleted",
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};
