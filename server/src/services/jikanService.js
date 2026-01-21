import axios from "axios";
import nodemailer from "nodemailer";
import { supabase } from "../config/supabase.js";

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export async function fetchAnimeSchedule() {
    try {
        const days = [
            "sunday",
            "monday",
            "tuesday",
            "wednesday",
            "thursday",
            "friday",
            "saturday",
        ];
        const today = days[new Date().getDay()];
        console.log(`Fetching Jikan Anime Schedule for ${today}...`);

        const response = await axios.get(
            `https://api.jikan.moe/v4/schedules?filter=${today}`
        );
        return response.data.data || [];
    } catch (error) {
        console.error("Error fetching anime schedule:", error.message);
        return [];
    }
}


export async function fetchMangaLatestChapter(title) {
    try {
        await delay(500); // Rate limit compliance

        // 1. Search MangaDex (sorted by follows to get popular/main series)
        const searchUrl = `https://api.mangadex.org/manga?title=${encodeURIComponent(title)}&limit=5&order[followedCount]=desc`;
        try {
            var searchRes = await axios.get(searchUrl);
        } catch (e) {
            console.error(`[MangaDex] Search failed for ${title}: ${e.message}`);
            return null;
        }

        // Find best match (exact title) or fallback to first
        const candidates = searchRes.data.data;
        if (!candidates || candidates.length === 0) {
            console.log(`[MangaDex] No manga found for title: ${title}`);
            return null;
        }

        let manga = candidates.find(c => {
            const t = c.attributes.title.en || Object.values(c.attributes.title)[0];
            return t.toLowerCase() === title.toLowerCase();
        });

        if (!manga) {
            // Fallback: try to find one that starts with title
            manga = candidates.find(c => {
                const t = c.attributes.title.en || Object.values(c.attributes.title)[0];
                return t.toLowerCase().startsWith(title.toLowerCase());
            });
        }

        if (!manga) manga = candidates[0]; // Final fallback

        console.log(`[MangaDex] Selected: ${manga.attributes.title.en || Object.values(manga.attributes.title)[0]} (ID: ${manga.id})`);

        // 2. Get latest English or Turkish chapter
        const feedUrl = `https://api.mangadex.org/manga/${manga.id}/feed?limit=1&translatedLanguage[]=en&translatedLanguage[]=tr&order[chapter]=desc`;
        try {
            var feedRes = await axios.get(feedUrl);
        } catch (e) {
            console.error(`[MangaDex] Feed failed for ${title}: ${e.message}`);
            return null;
        }
        const chapter = feedRes.data.data[0];

        if (!chapter) return null;

        // Return a shape compatible with what matchingService expects (mocking Jikan structure loosely)
        return {
            title: manga.attributes.title.en || Object.values(manga.attributes.title)[0],
            chapters: parseFloat(chapter.attributes.chapter),
            status: manga.attributes.status === 'ongoing' ? 'Publishing' : 'Finished',
            url: `https://mangadex.org/title/${manga.id}`,
            images: { jpg: { image_url: `https://mangadex.org/covers/${manga.id}/${manga.relationships?.find(r => r.type === 'cover_art')?.id}.jpg` } }
            // Note: Cover art requires another call, so image might be broken or we can skip it for notifications
        };
    } catch (error) {
        console.error(`Error checking MangaDex for ${title}:`, error.message);
        return null; // Fallback or fail
    }
}

// Keeping original fetchMangaDetails for compatibility/fallback if needed
export async function fetchMangaDetails(title) {
    try {
        await delay(1000); // Rate limit compliance
        const response = await axios.get(
            `https://api.jikan.moe/v4/manga?q=${encodeURIComponent(
                title
            )}&limit=1&order_by=popularity&sort=asc`
        );
        const manga = response.data.data[0];

        if (!manga) return null;

        return {
            title: manga.title,
            mal_id: manga.mal_id,
            // ... (rest of the fields)

            url: manga.url,
            images: manga.images,
            status: manga.status,
            chapters: manga.chapters, // Total chapters if finished, or null if publishing
            volumes: manga.volumes,
        };
    } catch (error) {
        console.error(`Error checking manga ${title}:`, error.message);
        return null;
    }
}

// Deprecated: Logic moved to cronService and matchingService
// Keeping sendEmail helper for reuse if needed
export const sendEmailNotification = async (userEmail, htmlContent) => {
    try {
        if (!process.env.SMTP_USER) {
            console.log(`[Mock Email] To: ${userEmail}`);
            return;
        }
        await transporter.sendMail({
            from: `"AnimeFinder" <${process.env.SMTP_USER}>`,
            to: userEmail,
            subject: "Your Daily Anime & Manga Updates",
            html: htmlContent,
        });
        console.log(`Email sent to ${userEmail}`);
    } catch (err) {
        console.error(`Failed to send email to ${userEmail}:`, err);
    }
};
