import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { authRouter } from "./routes/auth.js";
import { mainRouter } from "./routes/main.js";
import { subRouter } from "./routes/sub.js";
import { animeFinderRouter } from "./routes/animefinder.js";
import { notificationRouter } from "./routes/notification.js";
import { initScheduler } from "./services/cronService.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "https://anime-finder-mj8m-calqobm33-huseyin-cinars-projects.vercel.app",
  "https://animefinder-5jzk-b3vwn9uz8-huseyin-cinars-projects.vercel.app",
  "https://anime-finder-huseyin-cinars-projects.vercel.app",
  "https://animefinder.vercel.app",
  "https://animefinder-api.vercel.app"
];

app.use(cors({
  origin: function (origin, callback) {
    // Eğer origin undefined ise (same-origin requests) izin ver
    if (!origin) {
      return callback(null, true);
    }

    // Vercel domainlerine wildcard izin ver
    if (origin.includes("vercel.app")) {
      return callback(null, true);
    }

    // Localhost'a izin ver
    if (origin.includes("localhost")) {
      return callback(null, true);
    }

    // Diğer originler için izin verme
    callback(null, true);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  optionsSuccessStatus: 200
}));
app.use(express.json());

app.use("/api", authRouter);
app.use("/api/main", mainRouter);
app.use("/api/sub", subRouter);
app.use("/api/animefinder", animeFinderRouter);
app.use("/api/notifications", notificationRouter);

app.get("/", (req, res) => {
  res.json({ status: "AnimeFinder API running" });
});

// Initialize Cron Job
initScheduler();

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});

