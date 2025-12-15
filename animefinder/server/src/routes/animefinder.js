import express from "express";
import axios from "axios";
import { authMiddleware } from "../middleware/auth.js";

export const animeFinderRouter = express.Router();

animeFinderRouter.get("/", authMiddleware, async (req, res) => {
  try {
    const page = Math.floor(Math.random() * 50) + 1;

    const query = `
      query ($page: Int, $perPage: Int) {
        Page(page: $page, perPage: $perPage) {
          media(type: ANIME, sort: [POPULARITY_DESC, SCORE_DESC]) {
            id
            title {
              romaji
              english
            }
            description(asHtml: false)
            coverImage {
              large
            }
            genres
          }
        }
      }
    `;

    const { data } = await axios.post(
      "https://graphql.anilist.co",
      {
        query,
        variables: { page, perPage: 10 },
      },
      {
        headers: { "Content-Type": "application/json" },
      }
    );

    const items =
      data.data.Page.media.map((a) => ({
        id: a.id,
        title: a.title.english || a.title.romaji,
        synopsis: a.description,
        image: a.coverImage?.large,
        genres: a.genres, // string[]
      })) ?? [];

    res.json({ items });
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ error: "Failed to fetch animefinder list" });
  }
});

animeFinderRouter.post("/result", authMiddleware, async (req, res) => {
  const { liked } = req.body;
  if (!Array.isArray(liked) || liked.length === 0) {
    return res.status(400).json({ error: "liked array required" });
  }

  try {
    const genreCount = {};

    for (const anime of liked) {
      (anime.genres || []).forEach((g) => {
        const key = typeof g === "string" ? g : g?.name;
        if (!key) return;
        genreCount[key] = (genreCount[key] || 0) + 1;
      });
    }

    const topGenres = Object.entries(genreCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([name]) => name);

    const query = `
      query ($perPage: Int, $genre_in: [String]) {
        Page(page: 1, perPage: $perPage) {
          media(type: ANIME, genre_in: $genre_in, sort: [SCORE_DESC, POPULARITY_DESC]) {
            id
            title {
              romaji
              english
            }
            description(asHtml: false)
            coverImage {
              large
            }
          }
        }
      }
    `;

    const { data } = await axios.post(
      "https://graphql.anilist.co",
      {
        query,
        variables: { perPage: 5, genre_in: topGenres },
      },
      {
        headers: { "Content-Type": "application/json" },
      }
    );

    const recommendations =
      data.data.Page.media.map((a) => ({
        id: a.id,
        title: a.title.english || a.title.romaji,
        synopsis: a.description,
        image: a.coverImage?.large,
      })) ?? [];

    res.json({ recommendations });
  } catch (err) {
    console.error(err.response?.data || err.message);
    res
      .status(500)
      .json({ error: "Failed to calculate recommendations", details: err.message });
  }
});


