import { PrismaClient } from '@prisma/client';
import Groq from 'groq-sdk';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Allow local proxy certificates for external metadata APIs
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const prisma = new PrismaClient();
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Configuration
const BATCH_SIZE = 10; // 10 tracks per LLM call (avoids TPM rate limits)
const MODEL_NAME = 'openai/gpt-oss-20b';
const FALLBACK_MODEL = 'qwen/qwen3.8-27b';
const DELAY_BETWEEN_BATCHES_MS = 1500; // 1.5s between batches

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function cleanTitleForSearch(str) {
    if (!str) return '';
    return str
        .replace(/&amp;/g, '&')
        .replace(/&#39;/g, "'")
        .replace(/&quot;/g, '"')
        .replace(/\(Official.*?\)/gi, '')
        .replace(/\[Official.*?\]/gi, '')
        .replace(/\(Lyric.*?\)/gi, '')
        .replace(/\[Lyric.*?\]/gi, '')
        .replace(/\(Audio.*?\)/gi, '')
        .replace(/\[Audio.*?\]/gi, '')
        .replace(/\(Video.*?\)/gi, '')
        .replace(/\[Video.*?\]/gi, '')
        .replace(/feat\..*$/gi, '')
        .replace(/ft\..*$/gi, '')
        .trim();
}

/**
 * Fetch high-res album cover and preview URL from iTunes API (free, no auth needed)
 */
async function fetchTrackMetadata(rawTitle, rawArtist) {
    const cleanTitle = cleanTitleForSearch(rawTitle);
    const cleanArtist = cleanTitleForSearch(rawArtist);

    const trySearch = async (term) => {
        try {
            const res = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(term)}&entity=song&limit=1`, {
                headers: { 'User-Agent': 'VibeMixer/2.0' }
            });
            if (!res.ok) return null;
            const data = await res.json();
            if (data.resultCount > 0) {
                const item = data.results[0];
                const coverImage = (item.artworkUrl100 || '').replace('100x100bb', '600x600bb');
                return {
                    coverImage: coverImage || null,
                    previewUrl: item.previewUrl || null,
                    durationMs: item.trackTimeMillis || 210000
                };
            }
        } catch (e) {}
        return null;
    };

    // Try full query first, then clean title if needed
    let meta = await trySearch(`${cleanTitle} ${cleanArtist}`);
    if (!meta && cleanTitle.length > 2) {
        meta = await trySearch(cleanTitle);
    }
    return meta;
}

/**
 * Clean and parse JSON from LLM output
 */
function cleanJson(text) {
    if (!text) return null;
    try {
        let clean = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const firstOpen = clean.indexOf('{');
        const lastClose = clean.lastIndexOf('}');
        if (firstOpen !== -1 && lastClose !== -1) {
            clean = clean.substring(firstOpen, lastClose + 1);
        }
        return JSON.parse(clean);
    } catch (e) {
        console.error('JSON Parse Error:', e.message);
        return null;
    }
}

/**
 * Estimate audio features for a batch of 25 tracks in a single LLM prompt
 */
async function estimateBatchFeatures(tracks) {
    const trackListText = tracks.map((t, idx) => {
        const lyricSnippet = (t.lyrics || '').slice(0, 150).replace(/\s+/g, ' ');
        return `[${idx + 1}] ID: "${t.id}" | Title: "${t.title}" | Artist: "${t.artist}" | Snippet: "${lyricSnippet}"`;
    }).join('\n');

    const prompt = `Analyze the lyrics and musical style of these ${tracks.length} songs.
For each song, estimate audio features on a 0.0 to 1.0 scale, and tempo in BPM (60 to 190):
- valence: 0.0 (sad/depressed/dark) to 1.0 (happy/cheerful/euphoric)
- energy: 0.0 (calm/acoustic/quiet) to 1.0 (fast/loud/intense)
- danceability: 0.0 to 1.0
- tempo: BPM integer (e.g. 110, 128, 140)

Input Tracks:
${trackListText}

Output valid JSON with the format:
{
  "features": [
    { "id": "track_id", "valence": 0.75, "energy": 0.82, "danceability": 0.68, "tempo": 128 }
  ]
}`;

    const tryModel = async (model) => {
        return await groq.chat.completions.create({
            messages: [
                { role: 'system', content: 'You are an acoustic music analysis AI. Return valid JSON only.' },
                { role: 'user', content: prompt }
            ],
            model,
            temperature: 0.3,
            response_format: { type: 'json_object' }
        });
    };

    try {
        let completion;
        try {
            completion = await tryModel(MODEL_NAME);
        } catch (firstErr) {
            console.warn(`[Groq] ${MODEL_NAME} failed (${firstErr.status || firstErr.message}). Trying ${FALLBACK_MODEL}...`);
            completion = await tryModel(FALLBACK_MODEL);
        }

        const parsed = cleanJson(completion.choices[0]?.message?.content);
        return parsed?.features || [];
    } catch (err) {
        if (err.status === 429) {
            console.warn('[429] Rate limit hit. Backing off 10s...');
            await sleep(10000);
            return null;
        }
        console.error('Groq batch estimation error:', err.message);
        return null;
    }
}

/**
 * Process a single batch of tracks
 */
/**
 * Process a single batch of tracks
 */
async function processBatch(batchSize = BATCH_SIZE) {
    const tracks = await prisma.trackKnowledge.findMany({
        where: {
            OR: [
                { valence: null },
                { coverImage: null }
            ]
        },
        take: batchSize
    });

    if (tracks.length === 0) {
        console.log('✨ All tracks are enriched! No remaining un-enriched tracks.');
        return false;
    }

    console.log(`\n⚡ Processing batch of ${tracks.length} tracks...`);

    // 1. LLM Feature Estimation for tracks missing valence
    const tracksNeedingFeatures = tracks.filter(t => t.valence === null);
    let featureMap = new Map();

    if (tracksNeedingFeatures.length > 0) {
        const featuresList = await estimateBatchFeatures(tracksNeedingFeatures);
        if (featuresList && featuresList.length > 0) {
            for (const f of featuresList) {
                if (f.id && typeof f.valence === 'number') {
                    featureMap.set(f.id, f);
                }
            }
        }
    }

    // 2. Sequentially update database to respect connection pool limits
    let updatedCount = 0;
    for (const t of tracks) {
        let feat = featureMap.get(t.id);
        const finalValence = feat ? Math.max(0, Math.min(1, feat.valence)) : (t.valence ?? 0.5);
        const finalEnergy = feat ? Math.max(0, Math.min(1, feat.energy)) : (t.energy ?? 0.5);
        const finalDanceability = feat ? Math.max(0, Math.min(1, feat.danceability || 0.5)) : (t.danceability ?? 0.5);
        const finalTempo = feat ? Math.max(50, Math.min(220, feat.tempo || 120)) : (t.tempo ?? 120);

        // Fetch cover art & preview if not already present
        let meta = null;
        if (!t.coverImage) {
            meta = await fetchTrackMetadata(t.title, t.artist);
        }

        try {
            await prisma.trackKnowledge.update({
                where: { id: t.id },
                data: {
                    spotifyId: t.spotifyId || 'BATCH_ENRICHED',
                    valence: finalValence,
                    energy: finalEnergy,
                    danceability: finalDanceability,
                    tempo: finalTempo,
                    acousticness: t.acousticness ?? 0.5,
                    instrumentalness: t.instrumentalness ?? 0.0,
                    coverImage: t.coverImage || meta?.coverImage || null,
                    previewUrl: t.previewUrl || meta?.previewUrl || null,
                    durationMs: t.durationMs || meta?.durationMs || 210000
                }
            });
            updatedCount++;
        } catch (dbErr) {
            console.error(`Failed to update ${t.title}:`, dbErr.message);
        }
    }

    console.log(`✅ Batch complete: ${updatedCount}/${tracks.length} tracks enriched with audio features and cover art.`);
    return true;
}

/**
 * Main batch enrichment runner. Can be invoked directly or from scheduled cron jobs.
 */
export async function runBatchEnrichment({ maxBatches = 50, batchSize = BATCH_SIZE, delayMs = DELAY_BETWEEN_BATCHES_MS, disconnectOnFinish = false } = {}) {
    console.log(`🚀 Starting Audio Feature & Artwork Enrichment (${batchSize} tracks/batch, max ${maxBatches} batches)...`);
    
    // Count total remaining
    const totalRemaining = await prisma.trackKnowledge.count({
        where: {
            OR: [
                { valence: null },
                { coverImage: null }
            ]
        }
    });
    console.log(`📊 Total tracks needing audio features or artwork: ${totalRemaining}`);

    if (totalRemaining === 0) {
        console.log('✨ All tracks already fully enriched!');
        if (disconnectOnFinish) await prisma.$disconnect();
        return { totalRemaining: 0, batchesProcessed: 0 };
    }

    let hasMore = true;
    let iteration = 0;

    while (hasMore && iteration < maxBatches) {
        iteration++;
        try {
            hasMore = await processBatch(batchSize);
            if (hasMore) await sleep(delayMs);
        } catch (e) {
            console.error('Unhandled batch error:', e);
            await sleep(5000);
        }
    }

    console.log(`🎉 Enrichment run finished (${iteration} iterations).`);
    if (disconnectOnFinish) {
        await prisma.$disconnect();
    }
    return { totalRemaining, batchesProcessed: iteration };
}

// Auto-run if executed directly as a script (e.g. node scripts/enrichAudioFeaturesBatch.js)
const isDirectExecution = process.argv[1] && (
    fileURLToPath(import.meta.url) === process.argv[1] ||
    process.argv[1].endsWith('enrichAudioFeaturesBatch.js')
);

if (isDirectExecution) {
    const maxBatches = process.env.MAX_BATCHES ? parseInt(process.env.MAX_BATCHES) : 100;
    runBatchEnrichment({ maxBatches, disconnectOnFinish: true });
}
