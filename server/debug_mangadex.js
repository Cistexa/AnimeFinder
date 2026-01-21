import axios from "axios";

const checkMangaDex = async (title) => {
    try {
        // 1. Search for manga
        const searchUrl = `https://api.mangadex.org/manga?title=${encodeURIComponent(title)}&limit=1`;
        const searchRes = await axios.get(searchUrl);
        const manga = searchRes.data.data[0];

        if (!manga) {
            console.log("No manga found");
            return;
        }

        console.log(`\nTitle: ${manga.attributes.title.en}`);
        console.log(`ID: ${manga.id}`);
        console.log(`Last Chapter (attr): ${manga.attributes.lastChapter}`); // Often just for finished ones?

        // 2. updates / feed
        // Get latest chapter in English
        const feedUrl = `https://api.mangadex.org/manga/${manga.id}/feed?limit=1&translatedLanguage[]=en&order[chapter]=desc`;
        const feedRes = await axios.get(feedUrl);
        const chapter = feedRes.data.data[0];

        if (chapter) {
            console.log(`Latest Chapter: ${chapter.attributes.chapter}`);
            console.log(`Published At: ${chapter.attributes.publishAt}`);
        } else {
            console.log("No chapters found in feed.");
        }

    } catch (err) {
        console.error("Error:", err.message);
    }
};

checkMangaDex("One Piece");
checkMangaDex("Jujutsu Kaisen");
