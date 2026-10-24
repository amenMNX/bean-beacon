import { Router } from "express";
import { getAllRatings } from "../controllers/ratingController.js";
import { authMiddleware, adminMiddleware } from "../middleware/auth.js";

const router = Router();

router.get("/reviews", authMiddleware, adminMiddleware, getAllRatings);

export default router;
