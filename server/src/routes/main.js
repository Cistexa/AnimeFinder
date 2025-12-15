import express from "express";
import axios from "axios";
import { authMiddleware } from "../middleware/auth.js";

export const mainRouter = express.Router();

mainRouter.get("/", authMiddleware, async (req, res) => {
  try {
    const query = `
      query ($perPage: Int) {
        anime: Page(page: 1, perPage: $perPage) {
          media(type: ANIME, sort: [SCORE_DESC, POPULARITY_DESC]) {
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
        manga: Page(page: 1, perPage: $perPage) {
          media(type: MANGA, sort: [SCORE_DESC, POPULARITY_DESC]) {
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
        variables: { perPage: 25 },
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    const animeList = data.data.anime.media;
    const mangaList = data.data.manga.media;

    const items = [
      ...animeList.map((a) => ({
        external_id: a.id,
        title: a.title.english || a.title.romaji,
        type: "anime",
        description: a.description,
        image: a.coverImage?.large,
      })),
      ...mangaList.map((m) => ({
        external_id: m.id,
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


