import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import {
  getProfile, updateProfile,
  changeEmail, changePassword,
  getSessions, saveSession,
} from "../controllers/userController.js";

const router = Router();

// All routes require auth
router.get("/profile",           requireAuth, getProfile);
router.put("/profile",           requireAuth, updateProfile);
router.put("/change-email",      requireAuth, changeEmail);
router.put("/change-password",   requireAuth, changePassword);
router.get("/sessions",          requireAuth, getSessions);
router.post("/sessions",         requireAuth, saveSession);

export default router;