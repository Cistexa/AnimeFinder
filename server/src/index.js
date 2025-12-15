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
  origin: [
    "http://localhost:5173",
    "https://anime-finder-lf32-azuttbr8h-huseyin-cinars-projects.vercel.app",
    "https://anime-finder-huseyin-cinars-projects.vercel.app", 
    "https://anime-finder.vercel.app" 
  ],
  credentials: true
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

