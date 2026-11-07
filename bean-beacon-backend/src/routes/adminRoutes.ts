import { Router } from "express";
import { getAllRatings } from "../controllers/ratingController.js";
import { createAdminUser, getAllUsers, updateAdminUser } from "../controllers/adminController.js";
import { updateCafeDetails } from "../controllers/cafeController.js";
import { authMiddleware, adminMiddleware } from "../middleware/auth.js";

const router = Router();

router.get("/reviews", authMiddleware, adminMiddleware, getAllRatings);
router.get("/users", authMiddleware, adminMiddleware, getAllUsers);
router.post("/users", authMiddleware, adminMiddleware, createAdminUser);
router.patch("/users/:id", authMiddleware, adminMiddleware, updateAdminUser);
router.patch("/cafes/:id", authMiddleware, adminMiddleware, updateCafeDetails);

export default router;
