import { Request, Response } from "express";
import {
  recommendCafes as getRecommendations,
  type RecommendableCafe,
} from "../services/recommendationService.js";

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === "string");

const isOptionalString = (value: unknown) => value === undefined || typeof value === "string";

const isRecommendableCafe = (value: unknown): value is RecommendableCafe => {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const shop = value as Record<string, unknown>;
  return (
    typeof shop.id === "string" &&
    shop.id.length > 0 &&
    shop.id.length <= 120 &&
    typeof shop.name === "string" &&
    shop.name.length > 0 &&
    shop.name.length <= 200 &&
    isOptionalString(shop.address) &&
    isOptionalString(shop.category) &&
    isOptionalString(shop.menu) &&
    (shop.rating === undefined ||
      (typeof shop.rating === "number" && Number.isFinite(shop.rating))) &&
    (shop.coffeeTypes === undefined || isStringArray(shop.coffeeTypes)) &&
    (shop.atmosphere === undefined || isStringArray(shop.atmosphere)) &&
    (shop.amenities === undefined || isStringArray(shop.amenities))
  );
};

export const recommendCafes = (req: Request, res: Response) => {
  const { drink = "", atmosphere = "", location = "", shops } = req.body ?? {};

  if (
    [drink, atmosphere, location].some(
      (value) => typeof value !== "string" || value.length > 120
    )
  ) {
    return res.status(400).json({
      success: false,
      error: "Preferences must be text no longer than 120 characters.",
    });
  }

  if (![drink, atmosphere, location].some((value: string) => value.trim())) {
    return res.status(400).json({
      success: false,
      error: "Tell us at least one preference.",
    });
  }

  if (!Array.isArray(shops) || shops.length === 0 || shops.length > 200) {
    return res.status(400).json({
      success: false,
      error: "Provide between 1 and 200 cafés to recommend.",
    });
  }

  const cafes: RecommendableCafe[] = (shops as unknown[]).filter(isRecommendableCafe);

  if (cafes.length !== shops.length) {
    return res.status(400).json({
      success: false,
      error: "Café details are invalid.",
    });
  }

  return res.json({
    success: true,
    data: {
      recommendations: getRecommendations(cafes, { drink, atmosphere, location }),
    },
  });
};
