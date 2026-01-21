import axios from "axios";

const checkManga = async (title) => {
    try {
        const url = `https://api.jikan.moe/v4/manga?q=${encodeURIComponent(title)}&limit=1&order_by=popularity&sort=asc`;
        console.log(`Fetching: ${url}`);
        const response = await axios.get(url);
        const manga = response.data.data[0];

        if (manga) {
            console.log(`\nTitle: ${manga.title}`);
            console.log(`Status: ${manga.status}`);
            console.log(`Chapters: ${manga.chapters}`); // Expecting null for ongoing
            console.log(`Volumes: ${manga.volumes}`);
        } else {
            console.log("No result found.");
        }
    } catch (err) {
        console.error("Error:", err.message);
    }
};

const run = async () => {
    await checkManga("One Piece");
    await checkManga("Jujutsu Kaisen");
    await checkManga("Vagabond"); // Finished/Hiatus, might have chapters
};

run();
