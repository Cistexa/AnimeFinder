import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { authRouter } from "./routes/auth.js";
import { mainRouter } from "./routes/main.js";
import { subRouter } from "./routes/sub.js";
import { animeFinderRouter } from "./routes/animefinder.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({
  origin: (origin, callback) => {
    const allowedOrigins = [
      "http://localhost:5173",
      "http://localhost:3000",
    ];
    
    // Tüm Vercel domainleri izin ver (cinars-projects.vercel.app)
    if (!origin || origin.includes("vercel.app") || origin.includes("localhost")) {
      callback(null, true);
    } else {
      callback(null, false);
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use(express.json());

app.use("/api", authRouter);
app.use("/api/main", mainRouter);
app.use("/api/sub", subRouter);
app.use("/api/animefinder", animeFinderRouter);

app.get("/", (req, res) => {
  res.json({ status: "AnimeFinder API running" });
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});

