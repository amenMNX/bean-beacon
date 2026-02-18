import { Router } from "express";
import {
  getCafesByLocation,
  searchCafes,
  getCafeById,
} from "../controllers/cafeController.js";
import { optionalAuthMiddleware } from "../middleware/auth.js";

const router = Router();

router.get("/", optionalAuthMiddleware, getCafesByLocation);
router.get("/search", optionalAuthMiddleware, searchCafes);
router.get("/:id", optionalAuthMiddleware, getCafeById);

export default router;
