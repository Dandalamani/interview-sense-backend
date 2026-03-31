import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import pool from "../config/db.js";

// ── Access token — short lived (15 min) ───────────────────────────────────────
export const generateAccessToken = (user) =>
  jwt.sign(
    { id: user.id, email: user.email, name: user.name },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRES || "15m" }
  );

// ── Refresh token — long lived (7 days), stored in DB ────────────────────────
export const generateRefreshToken = async (userId) => {
  const token = uuidv4();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await pool.execute(
    "INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES (?, ?, ?)",
    [userId, token, expiresAt]
  );
  return token;
};

// ── Verify access token ───────────────────────────────────────────────────────
export const verifyAccessToken = (token) => {
  try { return jwt.verify(token, process.env.JWT_ACCESS_SECRET); }
  catch { return null; }
};

// ── Rotate: invalidate old refresh token, issue new one ──────────────────────
export const rotateRefreshToken = async (oldToken) => {
  const [rows] = await pool.execute(
    "SELECT * FROM refresh_tokens WHERE token = ? AND expires_at > NOW()",
    [oldToken]
  );
  if (!rows.length) return null;
  const { user_id } = rows[0];
  await pool.execute("DELETE FROM refresh_tokens WHERE token = ?", [oldToken]);
  const newToken = await generateRefreshToken(user_id);
  return { userId: user_id, newToken };
};

// ── Revoke all tokens for a user (logout all devices) ────────────────────────
export const revokeAllTokens = async (userId) => {
  await pool.execute("DELETE FROM refresh_tokens WHERE user_id = ?", [userId]);
};