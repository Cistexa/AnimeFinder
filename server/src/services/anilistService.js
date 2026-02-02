import axios from "axios";

/**
 * Anilist API Service
 * Replaces Jikan/MangaDex for more reliable schedule and update data.
 */

const GRAPHQL_URL = "https://graphql.anilist.co";

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Helper for sending GraphQL requests
const sendQuery = async (query, variables) => {
    try {
        const response = await axios.post(GRAPHQL_URL, {
            query,
            variables
        }, {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            }
        });
        return response.data.data;
    } catch (error) {
        console.error("Anilist API Error:", error.response?.data?.errors || error.message);
        throw error;
    }
};

/**
 * Fetches anime airing TODAY.
 * Uses Anilist AiringSchedule.
 */
export async function fetchAnilistAiringSchedule() {
    console.log("Fetching Anilist Anime Schedule for today...");

    // Get start/end of current day (in UTC or relevant timezone, Anilist uses unix timestamp)
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() / 1000;
    const endOfDay = startOfDay + 86400; // +24 hours

    const query = `
    query ($start: Int, $end: Int) {
      Page(page: 1, perPage: 50) {
        airingSchedules(airingAt_greater: $start, airingAt_lesser: $end, sort: TIME) {
          id
          episode
          airingAt
          media {
            id
            idMal
            title {
              romaji
              english
              native
            }
            siteUrl
            coverImage {
              large
            }
            format
          }
        }
      }
    }
    `;

    try {
        const data = await sendQuery(query, { start: startOfDay, end: endOfDay });
        const schedules = data.Page.airingSchedules;

        // Transform to match our app's expected structure
        return schedules.map(item => ({
            mal_id: item.media.idMal, // Keep MAL ID if possible for compat
            anilist_id: item.media.id,
            title: item.media.title.english || item.media.title.romaji || item.media.title.native,
            episode: item.episode,
            release_date: new Date(item.airingAt * 1000),
            url: item.media.siteUrl,
            image_url: item.media.coverImage.large,
            type: 'anime'
        }));

    } catch (e) {
        console.error("Failed to fetch Anilist schedule:", e.message);
        return [];
    }
}

/**
 * Fetches latest Manga chapter info by title.
 * Used for checking specific subscriptions.
 */
export async function fetchAnilistManga(title) {
    // Note: Anilist doesn't track "new scanlation release" as precisely as MangaDex.
    // It tracks "Latest Chapter Released" officially or generally.
    // If the user wants to avoid "old chapters as new", this is safer because Anilist
    // usually only updates 'chapters' count when a new one is out.

    await delay(300); // Rate limit

    const query = `
    query ($search: String) {
      Media(search: $search, type: MANGA, sort: SEARCH_MATCH) {
        id
        idMal
        title {
          romaji
          english
        }
        chapters
        volumes
        status
        siteUrl
        coverImage {
          large
        }
        updatedAt
      }
    }
    `;

    try {
        const data = await sendQuery(query, { search: title });
        const media = data.Media;

        if (!media) return null;

        const bestTitle = media.title.english || media.title.romaji;

        return {
            title: bestTitle,
            chapters: media.chapters, // This is the total chapters released
            status: media.status === 'RELEASING' ? 'Publishing' : 'Finished',
            url: media.siteUrl,
            image_url: media.coverImage.large,
            anilist_id: media.id,
            mal_id: media.idMal
        };

    } catch (e) {
        // 404 is common if not found
        // console.error(`Anilist Manga Check failed for ${title}`);
        return null;
    }
}
