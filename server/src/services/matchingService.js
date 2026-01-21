export const normalizeTitle = (title) => {
    return title.toLowerCase().trim().replace(/[^a-z0-9]/g, "");
};

/**
 * Checks if there is a new episode for an anime.
 * @param {Object} dbItem - item from database
 * @param {Object} jikanData - data from Jikan API
 * @returns {Object|null} - Update object if new content, or null
 */
export const checkAnimeUpdate = (dbItem, jikanData) => {
    const currentEpisodes = jikanData.episodes || 0; // Jikan might return null for unknown
    const isAiring = jikanData.status === "Currently Airing";

    // If we know the episode count increased
    if (currentEpisodes > dbItem.last_episode) {
        return {
            type: 'new_episode',
            newValue: currentEpisodes,
            title: jikanData.title,
            url: jikanData.url,
            image_url: jikanData.images?.jpg?.image_url,
            message: `New Episode Detected! (${currentEpisodes})`
        };
    }

    // Logic for Ongoing Anime (where episodes is null or we track it by schedule)
    // If it's in the schedule (passed as jikanData), it means it airs today.
    // We check if we already notified/checked this item RECENTLY (e.g. within last 18 hours).
    const lastChecked = dbItem.last_checked_at ? new Date(dbItem.last_checked_at) : new Date(0);
    const now = new Date();
    const hoursSinceCheck = (now - lastChecked) / (1000 * 60 * 60);

    // If it's airing today and we haven't checked/notified in > 18 hours
    if (isAiring && hoursSinceCheck > 18) {
        return {
            type: 'new_episode_schedule',
            newValue: dbItem.last_episode, // Keep same count if unknown
            title: jikanData.title,
            url: jikanData.url,
            image_url: jikanData.images?.jpg?.image_url,
            message: `New Episode Arriving Today!`
        };
    }

    return null;
};

/**
 * Checks if there is a new chapter for a manga.
 * @param {Object} dbItem - item from database
 * @param {Object} jikanData - data from Jikan API
 * @returns {Object|null} - Update object if new content, or null
 */
export const checkMangaUpdate = (dbItem, jikanData) => {
    const currentChapters = jikanData.chapters;
    const isPublishing = jikanData.status === "Publishing";
    const currentChap = parseFloat(currentChapters);
    const dbChap = parseFloat(dbItem.last_chapter || 0);

    console.log(`[Matching] ${dbItem.title}: API(${currentChap}) vs DB(${dbChap})`);

    // null chapters means "unknown" or "ongoing" in Jikan often. 
    // If it's a number and higher than before -> Update
    if (!isNaN(currentChap) && currentChap > dbChap) {
        return {
            type: 'new_chapter',
            newValue: currentChapters,
            title: jikanData.title,
            url: jikanData.url,
            image_url: jikanData.images?.jpg?.image_url,
            message: `New Chapter Released! (Chapter ${currentChapters})`
        };
    }

    // Let's assume if status changed from something else to Publishing?
    if (dbItem.status !== "Publishing" && isPublishing) {
        return {
            type: 'status_change',
            newValue: 0, // placeholder
            title: jikanData.title,
            url: jikanData.url,
            image_url: jikanData.images?.jpg?.image_url,
            message: `Manga is now Publishing!`
        };
    }

    return null;
};
