import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/user.js";

const app  = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: ["https://interview-sense-frontend.vercel.app" , "http://localhost:5173"], methods: ["GET", "POST", "PUT", "DELETE"],credentials: true }));
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);

app.get("/health", (_, res) => res.json({ status: "ok", time: new Date() }));
app.use((_, res) => res.status(404).json({ error: "Route not found" }));

app.listen(PORT, () => console.log(`🚀 Backend running on ${PORT}`));