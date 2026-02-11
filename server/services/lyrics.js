import axios from 'axios';
import lyricsFinder from 'lyrics-finder';
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';
import * as cheerio from 'cheerio';
import prisma from '../lib/prisma.js';
import { generateEmbedding } from './embedding.js';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
const geminiModel = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite-001" });

async function getGeniusLyrics(title, artist) {
    if (!process.env.GENIUS_ACCESS_TOKEN) return null;
    try {
        console.log(`[Lyrics] 🎵 Tier 0: Searching Genius API for "${title}"...`);
        const query = `${title} ${artist}`.toLowerCase().replace(/ \- .*/, '');
        const searchUrl = `https://api.genius.com/search?q=${encodeURIComponent(query)}`;
        const { data } = await axios.get(searchUrl, {
            headers: { 'Authorization': `Bearer ${process.env.GENIUS_ACCESS_TOKEN}` }
        });
        if (!data.response.hits || data.response.hits.length === 0) return null;
        const lyricsUrl = data.response.hits[0].result.url;
        const { data: html } = await axios.get(lyricsUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        const $ = cheerio.load(html);
        let lyrics = '';
        $('.lyrics').each((i, elem) => lyrics += $(elem).text() + '\n');
        $('div[class*="Lyrics__Container"]').each((i, elem) => {
            $(elem).find('br').replaceWith('\n');
            lyrics += $(elem).text() + '\n';
        });
        return lyrics.trim().length > 50 ? lyrics.trim() : null;
    } catch (error) {
        return null;
    }
}

export const fetchLyrics = async (title, artist) => {
    let lyrics = await getGeniusLyrics(title, artist);
    if (lyrics) return lyrics;

    try {
        console.log(`[Lyrics] 🌐 Tier 1: Public API for "${title}"...`);
        const { data } = await axios.get(`https://lyrist.vercel.app/api/${encodeURIComponent(title)}/${encodeURIComponent(artist)}`);
        if (data?.lyrics?.length > 50) return data.lyrics;
    } catch (e) { }

    try {
        console.log(`[Lyrics] 🕵️ Tier 2: Scraping for "${title}"...`);
        lyrics = await lyricsFinder(artist, title) || "";
        if (lyrics.length > 50) return lyrics;
    } catch (e) { }

    if (!process.env.GOOGLE_API_KEY) return null;
    try {
        console.log(`[Lyrics] 🧠 Tier 3: Gemini for "${title}"...`);
        const prompt = `Return lyrics for "${title}" by "${artist}". Text only.`;
        const result = await geminiModel.generateContent(prompt);
        const text = result.response.text().trim();
        return text.length > 50 ? text : null;
    } catch (e) {
        return null;
    }
};

export const learnTrack = async (title, artist, contextReason = null) => {
    try {
        const exists = await prisma.trackKnowledge.findFirst({
            where: {
                title: { equals: title, mode: 'insensitive' },
                artist: { equals: artist, mode: 'insensitive' }
            }
        });
        if (exists) return exists;

        console.log(`[Knowledge] 🧠 Learning: "${title}" by ${artist}`);
        let content = await fetchLyrics(title, artist);
        let source = 'lyrics';

        if (!content && contextReason) {
            console.log(`[Knowledge] ⚠️ Fallback to AI Context.`);
            content = `Song: ${title} by ${artist}. Vibe: ${contextReason}`;
            source = 'context';
        }

        if (!content) return null;

        const embedding = await generateEmbedding(content);
        await prisma.$executeRaw`
            INSERT INTO "TrackKnowledge" (id, title, artist, lyrics, "lyricsEmbedding", "updatedAt")
            VALUES (gen_random_uuid(), ${title}, ${artist}, ${content}, ${embedding}::vector, NOW())
        `;
        console.log(`[Knowledge] ✅ Saved via ${source}.`);
    } catch (err) {
        console.error(`[Knowledge] Error:`, err.message);
    }
};
