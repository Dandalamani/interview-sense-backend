import bcrypt from "bcryptjs";
import pool from "../config/db.js";
import {
  generateAccessToken,
  generateRefreshToken,
  rotateRefreshToken,
  revokeAllTokens,
} from "../utils/jwt.js";

const SALT_ROUNDS = 12;

// Strip sensitive fields before sending user to frontend
const safeUser = (user) => ({
  id:        user.id,
  name:      user.name,
  email:     user.email,
  avatar:    user.avatar,
  createdAt: user.created_at,
});

// ── REGISTER ──────────────────────────────────────────────────────────────────
export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password)
      return res.status(400).json({ error: "Name, email and password are required" });

    if (password.length < 8)
      return res.status(400).json({ error: "Password must be at least 8 characters" });

    // Email already taken?
    const [existing] = await pool.query(
      "SELECT id FROM users WHERE email = $1", [email]
    );
    if (existing.length)
      return res.status(409).json({ error: "An account with this email already exists" });

    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);

    const [result] = await pool.query(
      "INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING *",
      [name, email, password_hash]
    );

    const [rows] = await pool.query("SELECT * FROM users WHERE id = $1", [result.insertId]);
    const user = rows[0];

    const accessToken  = generateAccessToken(user);
    const refreshToken = await generateRefreshToken(user.id);

    res.status(201).json({
      message: "Account created successfully",
      user: safeUser(user),
      accessToken,
      refreshToken,
    });
  } catch (err) {
    console.error("register error:", err);
    res.status(500).json({ error: "Server error during registration" });
  }
};

// ── LOGIN ─────────────────────────────────────────────────────────────────────
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ error: "Email and password are required" });

    const [result] = await pool.query(
      "SELECT * FROM users WHERE email = $1", [email]
    );

    // Use the same generic error for both "not found" and "wrong password"
    // so attackers can't enumerate which emails are registered
    if (!result.length)
      return res.status(401).json({ error: "Invalid email or password" });

    const user = result[0];
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match)
      return res.status(401).json({ error: "Invalid email or password" });

    const accessToken  = generateAccessToken(user);
    const refreshToken = await generateRefreshToken(user.id);

    res.json({
      message: "Login successful",
      user: safeUser(user),
      accessToken,
      refreshToken,
    });
  } catch (err) {
    console.error("login error:", err);
    res.status(500).json({ error: "Server error during login" });
  }
};

// ── REFRESH TOKEN ─────────────────────────────────────────────────────────────
export const refresh = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken)
      return res.status(400).json({ error: "Refresh token required" });

    const result = await rotateRefreshToken(refreshToken);
    if (!result)
      return res.status(401).json({ error: "Session expired. Please log in again." });

    const [rows] = await pool.query("SELECT * FROM users WHERE id = $1", [result.userId]);
    if (!rows.length)
      return res.status(401).json({ error: "User not found" });

    res.json({
      accessToken:  generateAccessToken(rows[0]),
      refreshToken: result.newToken,
    });
  } catch (err) {
    console.error("refresh error:", err);
    res.status(500).json({ error: "Server error during token refresh" });
  }
};

// ── LOGOUT ────────────────────────────────────────────────────────────────────
export const logout = async (req, res) => {
  try {
    await revokeAllTokens(req.user.id);
    res.json({ message: "Logged out successfully" });
  } catch (err) {
    console.error("logout error:", err);
    res.status(500).json({ error: "Server error during logout" });
  }
};

// ── GET CURRENT USER ──────────────────────────────────────────────────────────
export const getMe = async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM users WHERE id = $1", [req.user.id]);
    if (!rows.length)
      return res.status(404).json({ error: "User not found" });
    res.json({ user: safeUser(rows[0]) });
  } catch (err) {
    console.error("getMe error:", err);
    res.status(500).json({ error: "Server error" });
  }
};