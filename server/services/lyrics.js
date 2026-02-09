import axios from 'axios';
import lyricsFinder from 'lyrics-finder';
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';

dotenv.config();

// Initialize Gemini 1.5 Flash (Stable)
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
const geminiModel = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite-001" });

import * as cheerio from 'cheerio';

// ... (Genius Logic)
async function getGeniusLyrics(title, artist) {
    if (!process.env.GENIUS_ACCESS_TOKEN) return null;

    try {
        console.log(`[Lyrics] 🎵 Tier 0: Searching Genius API for "${title}"...`);
        const query = `${title} ${artist}`.toLowerCase().replace(/ \- .*/, ''); // Clean title

        // 1. Search API
        const searchUrl = `https://api.genius.com/search?q=${encodeURIComponent(query)}`;
        const { data } = await axios.get(searchUrl, {
            headers: { 'Authorization': `Bearer ${process.env.GENIUS_ACCESS_TOKEN}` }
        });

        if (!data.response.hits || data.response.hits.length === 0) {
            console.log(`[Lyrics] ❌ Genius API found no matches.`);
            return null;
        }

        // 2. Get URL of first hit
        const hit = data.response.hits[0].result;
        const lyricsUrl = hit.url;
        console.log(`[Lyrics] 🔗 Found Genius URL: ${lyricsUrl}`);

        // 3. Scrape URL (Genius API doesn't return body text)
        const { data: html } = await axios.get(lyricsUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });

        // 4. Parse with Cheerio
        const $ = cheerio.load(html);

        // Genius uses dynamic class names, but usually `lyrics` or containers with `Lyrics__Container`
        let lyrics = '';

        // Old container
        $('.lyrics').each((i, elem) => {
            lyrics += $(elem).text() + '\n';
        });

        // New container (React based classes)
        $('div[class*="Lyrics__Container"]').each((i, elem) => {
            // Replace <br> with newlines for proper formatting
            $(elem).find('br').replaceWith('\n');
            lyrics += $(elem).text() + '\n';
        });

        lyrics = lyrics.trim();

        if (lyrics.length > 50) {
            console.log(`[Lyrics] ✅ Tier 0 Success! (Genius API + Scrape)`);
            return lyrics;
        } else {
            console.log(`[Lyrics] ⚠️ Genius scrape returned empty text.`);
            return null;
        }

    } catch (error) {
        console.error(`[Lyrics] Genius Tier failed: ${error.message}`);
        return null; // Fallback to other tiers
    }
}

export const fetchLyrics = async (title, artist) => {
    let lyrics = "";

    // --- TIER 0: GENIUS API (Official User Request) ---
    lyrics = await getGeniusLyrics(title, artist);
    if (lyrics) return lyrics;

    // --- TIER 1: Public API (Lyrist) ---
    try {
        console.log(`[Lyrics] 🌐 Tier 1: Checking Public API for "${title}"...`);
        const { data } = await axios.get(`https://lyrist.vercel.app/api/${encodeURIComponent(title)}/${encodeURIComponent(artist)}`);
        if (data && data.lyrics && data.lyrics.length > 50) {
            console.log(`[Lyrics] ✅ Tier 1 Success! (API)`);
            return data.lyrics;
        }
    } catch (e) { /* Ignore API errors */ }

    // --- TIER 2: Scraper (lyrics-finder) ---
    // This scrapes Google/MusixMatch/LyricFind (NodeJS equivalent of the user's suggestion)
    try {
        console.log(`[Lyrics] 🕵️ Tier 2: Scraping (Lyrics-Finder)...`);
        lyrics = await lyricsFinder(artist, title) || "";
        if (lyrics.length > 50) {
            console.log(`[Lyrics] ✅ Tier 2 Success! (Scraper)`);
            return lyrics;
        }
    } catch (e) {
        console.warn(`[Lyrics] Scraper failed: ${e.message}`);
    }

    // --- TIER 3: AI Fallback (Gemini) ---
    if (!process.env.GOOGLE_API_KEY) return null;

    try {
        console.log(`[Lyrics] 🧠 Tier 3: Asking Gemini 1.5 (AI Memory)...`);
        const prompt = `Return the lyrics for "${title}" by "${artist}". Return ONLY text, no markdown, no intro. If unrelated or instrumental, return "NOT_FOUND".`;

        const result = await geminiModel.generateContent(prompt);
        const text = result.response.text().trim();

        if (text === "NOT_FOUND" || text.includes("I cannot provide") || text.length < 50) {
            console.log(`[Lyrics] ❌ All Tiers Failed for "${title}".`);
            return null;
        }

        console.log(`[Lyrics] ✅ Tier 3 Success! (AI)`);
        return text;

    } catch (aiError) {
        console.error('[Lyrics] Gemini Error:', aiError.message);
        return null;
    }
};
