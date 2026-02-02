import express from "express";
import axios from "axios";
import { authMiddleware } from "../middleware/auth.js";
import { supabase } from "../config/supabase.js";

export const mainRouter = express.Router();

mainRouter.get("/new-releases", authMiddleware, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("new_releases")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      return res.status(500).json({ error: "DB Error" });
    }

    res.json({ items: data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server Error" });
  }
});

mainRouter.get("/", authMiddleware, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    console.log(`[Main] Fetching page ${page}`);
    const query = `
      query ($page: Int, $perPage: Int) {
        anime: Page(page: $page, perPage: $perPage) {
          media(type: ANIME, sort: [SCORE_DESC, POPULARITY_DESC]) {
            id
            idMal
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
        manga: Page(page: $page, perPage: $perPage) {
          media(type: MANGA, sort: [SCORE_DESC, POPULARITY_DESC]) {
            id
            idMal
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
        variables: { page, perPage: 25 }, // 25 anime + 25 manga = 50 items
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    const animeList = data.data?.anime?.media || [];
    const mangaList = data.data?.manga?.media || [];

    const items = [
      ...animeList.map((a) => ({
        external_id: a.idMal || a.id, // Prefer MAL ID for Jikan compatibility
        title: a.title.english || a.title.romaji,
        type: "anime",
        description: a.description,
        image: a.coverImage?.large,
      })),
      ...mangaList.map((m) => ({
        external_id: m.idMal || m.id, // Prefer MAL ID
        title: m.title.english || m.title.romaji,
        type: "manga",
        description: m.description,
        image: m.coverImage?.large,
      })),
    ];

    res.json({ items });
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ error: "Failed to fetch anime/manga" });
  }
});


