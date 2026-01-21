// test_notification_logic.js
import { checkAnimeUpdate, checkMangaUpdate } from "./src/services/matchingService.js";

console.log("--- Testing Matching Logic ---");

// Test 1: Anime - New Episode
const animeDB = { id: 1, title: 'One Piece', last_episode: 1000, type: 'anime' };
const animeJikan = { title: 'One Piece', episodes: 1001, status: 'Currently Airing', url: 'http://example.com' };
const animeUpdate = checkAnimeUpdate(animeDB, animeJikan);
console.log("Test 1 (New Ep):", animeUpdate ? "PASS" : "FAIL", animeUpdate);

// Test 2: Anime - Matches Last
const animeDB2 = { id: 1, title: 'One Piece', last_episode: 1001, type: 'anime' };
const animeUpdate2 = checkAnimeUpdate(animeDB2, animeJikan);
console.log("Test 2 (Old Ep):", animeUpdate2 === null ? "PASS" : "FAIL", animeUpdate2);

// Test 3: Manga - New Chapter
const mangaDB = { id: 2, title: 'Berserk', last_chapter: 370, type: 'manga', status: 'Publishing' };
const mangaJikan = { title: 'Berserk', chapters: 371, status: 'Publishing', url: 'http://example.com' };
const mangaUpdate = checkMangaUpdate(mangaDB, mangaJikan);
console.log("Test 3 (New Chap):", mangaUpdate ? "PASS" : "FAIL", mangaUpdate);

// Test 4: Manga - Status Change (if chapter count unknown)
const mangaDB3 = { id: 3, title: 'Unknown', last_chapter: 0, type: 'manga', status: 'On Hiatus' };
const mangaJikan3 = { title: 'Unknown', chapters: null, status: 'Publishing', url: 'http://example.com' };
const mangaUpdate3 = checkMangaUpdate(mangaDB3, mangaJikan3);
console.log("Test 4 (Status Change):", mangaUpdate3 ? "PASS" : "FAIL");

console.log("--- Done ---");
