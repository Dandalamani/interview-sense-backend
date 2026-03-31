import pool from "../config/db.js";
import bcrypt from "bcryptjs";

const SALT_ROUNDS = 12;

// ── GET PROFILE ───────────────────────────────────────────────────────────────
export const getProfile = async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, name, email, avatar, dob, bio, gender, linkedin, created_at FROM users WHERE id = $1",
      [req.user.id]
    );
    if (!rows.length) return res.status(404).json({ error: "User not found" });
    res.json({ profile: rows[0] });
  } catch (err) {
    console.error("getProfile error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// ── UPDATE PROFILE ────────────────────────────────────────────────────────────
export const updateProfile = async (req, res) => {
  try {
    const { name, dob, bio, gender, linkedin } = req.body;

    if (!name?.trim()) return res.status(400).json({ error: "Name is required" });

    await pool.query(
      "UPDATE users SET name = $1, dob = $2, bio = $3, gender = $4, linkedin = $5, updated_at = NOW() WHERE id = $6",
      [name.trim(), dob || null, bio || null, gender || null, linkedin || null, req.user.id]
    );

    const [rows] = await pool.query(
      "SELECT id, name, email, avatar, dob, bio, gender, linkedin, created_at FROM users WHERE id = $1",
      [req.user.id]
    );

    res.json({ message: "Profile updated", profile: rows[0] });
  } catch (err) {
    console.error("updateProfile error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// ── CHANGE EMAIL ──────────────────────────────────────────────────────────────
export const changeEmail = async (req, res) => {
  try {
    const { newEmail, password } = req.body;
    if (!newEmail || !password) return res.status(400).json({ error: "Email and password are required" });

    // Verify password
    const [rows] = await pool.query("SELECT * FROM users WHERE id = $1", [req.user.id]);
    if (!rows.length) return res.status(404).json({ error: "User not found" });

    const match = await bcrypt.compare(password, rows[0].password_hash);
    if (!match) return res.status(401).json({ error: "Incorrect password" });

    // Check new email not already taken
    const [existing] = await pool.query("SELECT id FROM users WHERE email = $1 AND id != $2", [newEmail, req.user.id]);
    if (existing.length) return res.status(409).json({ error: "This email is already in use" });

    await pool.query("UPDATE users SET email = $1, updated_at = NOW() WHERE id = $2", [newEmail, req.user.id]);
    res.json({ message: "Email updated successfully" });
  } catch (err) {
    console.error("changeEmail error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// ── CHANGE PASSWORD ───────────────────────────────────────────────────────────
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return res.status(400).json({ error: "Both fields are required" });
    if (newPassword.length < 8) return res.status(400).json({ error: "New password must be at least 8 characters" });

    const [rows] = await pool.query("SELECT * FROM users WHERE id = $1", [req.user.id]);
    if (!rows.length) return res.status(404).json({ error: "User not found" });

    const match = await bcrypt.compare(currentPassword, rows[0].password_hash);
    if (!match) return res.status(401).json({ error: "Current password is incorrect" });

    const hash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await pool.query("UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2", [hash, req.user.id]);
    res.json({ message: "Password updated successfully" });
  } catch (err) {
    console.error("changePassword error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// ── GET SESSIONS ──────────────────────────────────────────────────────────────
export const getSessions = async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM interview_sessions WHERE user_id = $1 ORDER BY created_at DESC",
      [req.user.id]
    );
    res.json({ sessions: rows });
  } catch (err) {
    console.error("getSessions error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// ── SAVE SESSION ──────────────────────────────────────────────────────────────
export const saveSession = async (req, res) => {
  try {
    const { role, level, overall_score, tech_score, comm_score, conf_score, questions_count, weak_areas } = req.body;

    const [result] = await pool.query(
      "INSERT INTO interview_sessions (user_id, role, level, overall_score, tech_score, comm_score, conf_score, questions_count, weak_areas) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)",
      [req.user.id, role, level, overall_score, tech_score, comm_score, conf_score, questions_count, JSON.stringify(weak_areas || [])]
    );

    res.status(201).json({ message: "Session saved", id: result.insertId });
  } catch (err) {
    console.error("saveSession error:", err);
    res.status(500).json({ error: "Server error" });
  }
};