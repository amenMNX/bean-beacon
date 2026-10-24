import { Request, Response } from "express";
import { Favorite } from "../models/Favorite.js";
import { Cafe } from "../models/Cafe.js";

export const getFavorites = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: "Not authenticated" });
    }

    const favorites = await Favorite.find({ userId: req.user.userId });
    const cafeIds = favorites.map((f) => f.cafeId);

    const cafes = await Cafe.find({ _id: { $in: cafeIds } });

    res.json({
      success: true,
      data: cafes,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const addFavorite = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: "Not authenticated" });
    }

    const { cafeId } = req.params;

    const cafe = await Cafe.findById(cafeId);
    if (!cafe) {
      return res.status(404).json({ success: false, error: "Cafe not found" });
    }

    const existingFavorite = await Favorite.findOne({
      userId: req.user.userId,
      cafeId,
    });

    if (existingFavorite) {
      return res.status(400).json({ success: false, error: "Already in favorites" });
    }

    const favorite = new Favorite({
      userId: req.user.userId,
      cafeId,
    });

    await favorite.save();

    res.status(201).json({
      success: true,
      data: favorite,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const removeFavorite = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: "Not authenticated" });
    }

    const { cafeId } = req.params;

    const favorite = await Favorite.findOneAndDelete({
      userId: req.user.userId,
      cafeId,
    });

    if (!favorite) {
      return res.status(404).json({ success: false, error: "Favorite not found" });
    }

    res.json({
      success: true,
      message: "Removed from favorites",
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const isFavorite = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.json({ success: true, data: { isFavorite: false } });
    }

    const { cafeId } = req.params;

    const favorite = await Favorite.findOne({
      userId: req.user.userId,
      cafeId,
    });

    res.json({
      success: true,
      data: { isFavorite: !!favorite },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};
