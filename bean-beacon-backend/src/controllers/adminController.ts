import { Request, Response } from "express";
import { User } from "../models/User.js";

export const getAllUsers = async (_req: Request, res: Response) => {
  try {
    const users = await User.find()
      .select("name email role createdAt")
      .sort({ createdAt: -1 })
      .limit(500)
      .lean();

    res.json({
      success: true,
      data: users.map((user) => ({
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      })),
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const createAdminUser = async (req: Request, res: Response) => {
  try {
    const { name, email, password, role = "user" } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, error: "Name, email, and password are required" });
    }
    if (!["user", "admin"].includes(role)) {
      return res.status(400).json({ success: false, error: "Invalid role" });
    }

    const user = await User.create({ name: String(name).trim(), email: String(email).trim().toLowerCase(), password, role });
    res.status(201).json({
      success: true,
      data: { id: user._id, name: user.name, email: user.email, role: user.role, createdAt: user.createdAt },
    });
  } catch (error: any) {
    res.status(error.code === 11000 ? 409 : 500).json({
      success: false,
      error: error.code === 11000 ? "Email already exists" : error.message,
    });
  }
};

export const updateAdminUser = async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.params.id).select("+password");
    if (!user) return res.status(404).json({ success: false, error: "User not found" });

    const { name, email, role, password } = req.body;
    if (name !== undefined) user.name = String(name).trim();
    if (email !== undefined) user.email = String(email).trim().toLowerCase();
    if (role !== undefined) {
      if (!["user", "admin"].includes(role)) {
        return res.status(400).json({ success: false, error: "Invalid role" });
      }
      user.role = role;
    }
    if (password) user.password = password;

    await user.save();
    res.json({
      success: true,
      data: { id: user._id, name: user.name, email: user.email, role: user.role, createdAt: user.createdAt },
    });
  } catch (error: any) {
    res.status(error.code === 11000 ? 409 : 500).json({
      success: false,
      error: error.code === 11000 ? "Email already exists" : error.message,
    });
  }
};
