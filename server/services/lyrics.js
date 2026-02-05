import { getSong } from 'genius-lyrics-api';
import axios from 'axios';
import * as cheerio from 'cheerio';
import dotenv from 'dotenv';

dotenv.config();

const apiKey = process.env.GENIUS_ACCESS_TOKEN;

export const fetchLyrics = async (title, artist) => {
    if (!apiKey) {
        console.warn('[Lyrics] GENIUS_ACCESS_TOKEN is missing. Lyrics fetch skipped.');
        return null;
    }

    const options = {
        apiKey: apiKey,
        title: title,
        artist: artist,
        optimizeQuery: true
    };

    try {
        console.log(`[Lyrics] Search API for: "${title}" by ${artist}...`);

        // 1. Get Metadata (URL) from API
        // This usually passes because it's an API call, not a page scrape
        const song = await getSong(options);

        if (!song || !song.url) {
            console.log('[Lyrics] Song not found on Genius API.');
            return null;
        }

        console.log(`[Lyrics] Scraping URL via Custom Agent: ${song.url}`);

        // 2. Custom Scraper with Browser Headers (Bypass 403)
        // Genius blocks non-browser User-Agents, especially from cloud IPs
        const { data } = await axios.get(song.url, {
            headers: {
                // Mimic a real Chrome browser on Windows
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
                'Referer': 'https://genius.com/',
                'Upgrade-Insecure-Requests': '1'
            }
        });

        // 3. Parse HTML
        const $ = cheerio.load(data);
        let lyrics = '';

        // Strategy A: Modern Genius Layout (Lyrics split in data-containers)
        $('[data-lyrics-container="true"]').each((i, elem) => {
            // Replace <br> with newlines for cleaner text
            $(elem).find('br').replaceWith('\n');
            lyrics += $(elem).text() + '\n';
        });

        // Strategy B: Legacy Layouts
        if (!lyrics.trim()) {
            $('.lyrics').each((i, elem) => {
                lyrics += $(elem).text() + '\n';
            });
        }

        // Strategy C: Fallback to any large block of text if known classes missing
        // (Skipping for now to avoid garbage data)

        if (!lyrics.trim()) {
            console.warn('[Lyrics] URL fetched but parsing failed (structure changed?).');
            return null;
        }

        const cleanedLyrics = lyrics.trim();
        console.log(`[Lyrics] Success! Length: ${cleanedLyrics.length} chars.`);
        return cleanedLyrics;

    } catch (error) {
        if (error.response && error.response.status === 403) {
            console.error('[Lyrics] 403 Forbidden. The WAF blocked us. Trying to rotate headers next time might help.');
        } else {
            console.error('[Lyrics] Error fetching lyrics:', error.message);
        }
        return null; // Fail gracefully
    }
};
