import { Router } from "express";
import {
  getFavorites,
  addFavorite,
  removeFavorite,
  isFavorite,
} from "../controllers/favoriteController.js";
import { authMiddleware, optionalAuthMiddleware } from "../middleware/auth.js";

const router = Router();

router.get("/", authMiddleware, getFavorites);
router.post("/:cafeId", authMiddleware, addFavorite);
router.delete("/:cafeId", authMiddleware, removeFavorite);
router.get("/:cafeId/check", optionalAuthMiddleware, isFavorite);

export default router;
