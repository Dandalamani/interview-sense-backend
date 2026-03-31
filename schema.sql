-- ── DATABASE ──────────────────────────────────────────────────────────────────
CREATE DATABASE IF NOT EXISTS interviewsense;
USE interviewsense;

-- ── USERS ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(100)  NOT NULL,
  email         VARCHAR(150)  NOT NULL UNIQUE,
  password_hash VARCHAR(255)  NOT NULL,
  avatar        VARCHAR(500)  DEFAULT NULL,
  created_at    TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ── REFRESH TOKENS ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  user_id     INT          NOT NULL,
  token       VARCHAR(512) NOT NULL UNIQUE,
  expires_at  DATETIME     NOT NULL,
  created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ── INTERVIEW SESSIONS (track history per user) ───────────────────────────────
CREATE TABLE IF NOT EXISTS interview_sessions (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  user_id         INT          NOT NULL,
  role            VARCHAR(100) NOT NULL,
  level           VARCHAR(50)  NOT NULL,
  overall_score   INT          DEFAULT 0,
  tech_score      INT          DEFAULT 0,
  comm_score      INT          DEFAULT 0,
  conf_score      INT          DEFAULT 0,
  questions_count INT          DEFAULT 0,
  weak_areas      TEXT,
  created_at      TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ── INDEXES ───────────────────────────────────────────────────────────────────
CREATE INDEX idx_users_email   ON users(email);
CREATE INDEX idx_refresh_user  ON refresh_tokens(user_id);
CREATE INDEX idx_sessions_user ON interview_sessions(user_id);