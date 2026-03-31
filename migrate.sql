-- Run these ALTER statements on your existing database
-- (only needed if you already ran the original schema.sql)

USE interviewsense;

ALTER TABLE users
  ADD COLUMN dob      DATE         DEFAULT NULL,
  ADD COLUMN bio      TEXT         DEFAULT NULL,
  ADD COLUMN gender   VARCHAR(20)  DEFAULT NULL,
  ADD COLUMN linkedin VARCHAR(300) DEFAULT NULL;