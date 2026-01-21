
import { fetchMangaLatestChapter } from "./src/services/jikanService.js";
import { checkMangaUpdate } from "./src/services/matchingService.js";

// Mock DB Item based on screenshot
const mockDbItem = {
    id: 8, // from screenshot
    title: "Berserk",
    type: "manga",
    last_chapter: 180, // from screenshot
    status: "Publishing"
};

const run = async () => {
    console.log(`Checking update for: ${mockDbItem.title} (DB Last Ch: ${mockDbItem.last_chapter})`);

    // 1. Fetch from API (MangaDex via our wrapper)
    const apiData = await fetchMangaLatestChapter(mockDbItem.title);

    if (!apiData) {
        console.log("❌ API returned null data.");
        return;
    }

    console.log("✅ API Data:", apiData);

    // 2. Check Matching Logic
    const update = checkMangaUpdate(mockDbItem, apiData);

    if (update) {
        console.log("✅ Update Detected!", update);
    } else {
        console.log("❌ No update detected.");
        console.log(`Debug: ${apiData.chapters} > ${mockDbItem.last_chapter} is ${apiData.chapters > mockDbItem.last_chapter}`);
    }
};

run();
