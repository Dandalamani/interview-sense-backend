import { Router } from "express";
import rateLimit from "express-rate-limit";
import { requireAuth } from "../middleware/auth.js";
import { register, login, refresh, logout, getMe } from "../controllers/authController.js";

const router = Router();

// Strict limiter for login/register — prevents brute force
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: { error: "Too many attempts. Please wait 15 minutes and try again." },
});

// Looser limiter for token refresh
const refreshLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { error: "Too many refresh requests." },
});

router.post("/register", authLimiter,    register);
router.post("/login",    authLimiter,    login);
router.post("/refresh",  refreshLimiter, refresh);
router.post("/logout",   requireAuth,    logout);
router.get("/me",        requireAuth,    getMe);

export default router;