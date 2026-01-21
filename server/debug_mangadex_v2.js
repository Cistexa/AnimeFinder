import axios from "axios";

const checkMangaDex = async (title) => {
    try {
        console.log(`Checking: ${title}`);
        const searchUrl = `https://api.mangadex.org/manga?title=${encodeURIComponent(title)}&limit=1`;
        const searchRes = await axios.get(searchUrl);
        const manga = searchRes.data.data[0];

        if (!manga) {
            console.log("No manga found");
            return;
        }

        console.log(`ID: ${manga.id}`);
        console.log(`Titles: ${JSON.stringify(manga.attributes.title)}`);

        // Get latest chapter in English
        const feedUrl = `https://api.mangadex.org/manga/${manga.id}/feed?limit=1&translatedLanguage[]=en&order[chapter]=desc`;
        const feedRes = await axios.get(feedUrl);
        const chapter = feedRes.data.data[0];

        if (chapter) {
            console.log(`Latest Chapter: ${chapter.attributes.chapter}`);
        } else {
            console.log("No chapters found in feed.");
        }

    } catch (err) {
        console.error("Error:", err.message);
    }
};

const run = async () => {
    await checkMangaDex("One Piece");
    await checkMangaDex("Jujutsu Kaisen");
};

run();
