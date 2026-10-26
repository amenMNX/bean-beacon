import { Router } from "express";
import {
  getCafesByLocation,
  searchCafes,
  getCafeById,
  listAllCafes,
  createCafe,
  setCafePhoto,
  updateCafeStatus,
  deleteCafe,
} from "../controllers/cafeController.js";
import { recommendCafes } from "../controllers/recommendationController.js";
import { authMiddleware, optionalAuthMiddleware, adminMiddleware } from "../middleware/auth.js";
import { uploadCafePhoto } from "../middleware/upload.js";

const router = Router();

// New: flat list + create + status + delete, used by the merged frontend
router.post("/recommend", recommendCafes);
router.get("/all", optionalAuthMiddleware, listAllCafes);
router.post("/", authMiddleware, createCafe);
router.post("/:id/photo", authMiddleware, uploadCafePhoto, setCafePhoto);
router.patch("/:id/status", authMiddleware, adminMiddleware, updateCafeStatus);
router.delete("/:id", authMiddleware, deleteCafe);

// Existing: geo-radius discovery (OpenStreetMap-backed)
router.get("/", optionalAuthMiddleware, getCafesByLocation);
router.get("/search", optionalAuthMiddleware, searchCafes);
router.get("/:id", optionalAuthMiddleware, getCafeById);

export default router;
