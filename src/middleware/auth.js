import { verifyAccessToken } from "../utils/jwt.js";

export const requireAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer "))
    return res.status(401).json({ error: "No token provided" });

  const decoded = verifyAccessToken(authHeader.split(" ")[1]);
  if (!decoded)
    return res.status(401).json({ error: "Invalid or expired token" });

  req.user = decoded; // { id, email, name }
  next();
};