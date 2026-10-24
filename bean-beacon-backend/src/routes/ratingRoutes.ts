import { Router } from "express";
import {
  getCafeRatings,
  addRating,
  updateRating,
  deleteRating,
} from "../controllers/ratingController.js";
import { authMiddleware, optionalAuthMiddleware } from "../middleware/auth.js";

const router = Router({ mergeParams: true });

router.get("/", optionalAuthMiddleware, getCafeRatings);
router.post("/", authMiddleware, addRating);
router.put("/:ratingId", authMiddleware, updateRating);
router.delete("/:ratingId", authMiddleware, deleteRating);

export default router;
