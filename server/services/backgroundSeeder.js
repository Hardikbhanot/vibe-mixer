
import { PrismaClient } from '@prisma/client';
import SpotifyWebApi from 'spotify-web-api-node';
import { fetchLyrics } from './lyrics.js';
import { generateEmbedding } from './embedding.js';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

// Spotify Client Credentials Flow
const spotifyApi = new SpotifyWebApi({
    clientId: process.env.SPOTIFY_CLIENT_ID,
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET
});

const SLEEP_MS = 5000; // 5 seconds between songs to avoid rate limits
const BATCH_SIZE = 50;

// Search queries to find popular playlists dynamically
const PLAYLIST_QUERIES = [
    "Global Top 50",
    "Today's Top Hits",
    "RapCaviar",
    "Mega Hit Mix",
    "All Out 2010s",
    "All Out 2000s",
    "All Out 90s",
    "Rock Classics",
    "Viral Hits"
];

// User-defined Priority Playlists
const PRIORITY_PLAYLISTS = [
    "0Z5qNVqtgaERPHUwWheBoA", // User Request 1
    "0PmCH2ddY083ztn5rM7qiT"  // User Request 2
];

async function authenticateSpotify() {
    try {
        const data = await spotifyApi.clientCredentialsGrant();
        spotifyApi.setAccessToken(data.body['access_token']);
        console.log('[Seeder] Spotify Authenticated.');
    } catch (err) {
        console.error('[Seeder] Spotify Auth Failed:', err.message);
    }
}

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export async function startBackgroundSeeding() {
    if (process.env.DISABLE_SEEDER === 'true') {
        console.log('[Seeder] Background seeder disabled via env.');
        return;
    }

    console.log('[Seeder] Initializing background worker...');
    await authenticateSpotify();

    // Run in loop forever (or until done)
    processPlaylistQueue();
}

async function getDynamicPlaylists() {
    console.log('[Seeder] Aggregating sources (Priority + Top Lists)...');
    let allPlaylists = [...PRIORITY_PLAYLISTS]; // Start with user priorities

    // Then add dynamic ones
    try {
        const result = await spotifyApi.getPlaylistsForCategory('toplists', { limit: 10 });
        if (result.body.playlists && result.body.playlists.items) {
            const dynamicIds = result.body.playlists.items
                .filter(p => p !== null)
                .map(p => p.id);

            // Deduplicate IDs (in case priority matches top list)
            const uniqueDynamic = dynamicIds.filter(id => !allPlaylists.includes(id));
            allPlaylists = [...allPlaylists, ...uniqueDynamic];
            console.log(`[Seeder] Found ${uniqueDynamic.length} additional dynamic playlists.`);
        }
    } catch (err) {
        console.error('[Seeder] Category fetch failed:', err.message);
    }

    return allPlaylists;
}

async function processPlaylistQueue() {
    console.log('[Seeder] Starting processing queue...');

    // 1. Get total learned count
    const count = await prisma.trackKnowledge.count();
    console.log(`[Seeder] Current Knowledge Base: ${count} songs.`);

    if (count >= 10000) {
        console.log('[Seeder] Target of 10,000 songs reached. Pausing.');
        return;
    }

    // Dynamic fetch
    const sourcePlaylists = await getDynamicPlaylists();

    if (sourcePlaylists.length === 0) {
        console.error('[Seeder] No playlists found to seed from. Retrying later.');
        return;
    }

    for (const playlistId of sourcePlaylists) {
        try {
            console.log(`[Seeder] Fetching playlist: ${playlistId}`);
            let offset = 0;
            let hasMore = true;

            while (hasMore) {
                try {
                    const data = await spotifyApi.getPlaylistTracks(playlistId, { limit: BATCH_SIZE, offset });
                    const tracks = data.body.items;

                    if (tracks.length === 0) {
                        hasMore = false;
                        break;
                    }

                    for (const item of tracks) {
                        if (!item.track) continue;

                        const track = item.track;
                        const title = track.name;
                        const artist = track.artists[0]?.name || "Unknown";

                        // Check DB
                        const exists = await prisma.trackKnowledge.findUnique({
                            where: { title_artist: { title, artist } }
                        });

                        if (exists) {
                            // console.log(`[Seeder] Skipping known: ${title}`);
                        } else {
                            // New song! Learn it.
                            console.log(`[Seeder] 🧠 Learning: "${title}" by ${artist}...`);

                            try {
                                const lyrics = await fetchLyrics(title, artist);
                                if (lyrics) {
                                    const embedding = await generateEmbedding(lyrics);
                                    await prisma.$executeRaw`
                                         INSERT INTO "TrackKnowledge" (id, title, artist, lyrics, "lyricsEmbedding", "updatedAt")
                                         VALUES (gen_random_uuid(), ${title}, ${artist}, ${lyrics}, ${embedding}::vector, NOW())
                                     `;
                                    console.log(`[Seeder] ✅ Saved: "${title}"`);

                                    // Rate Limit Sleep
                                    await sleep(SLEEP_MS);
                                } else {
                                    console.log(`[Seeder] ❌ No lyrics found for "${title}"`);
                                }
                            } catch (err) {
                                console.error(`[Seeder] Error processing "${title}":`, err.message);
                                await sleep(2000); // Wait bit longer on error
                            }
                        }
                    }

                    offset += BATCH_SIZE;
                    console.log(`[Seeder] Playlist offset now: ${offset}`);
                    await authenticateSpotify(); // Refresh token
                } catch (playlistError) {
                    console.warn(`[Seeder] Error fetching page for ${playlistId}: ${playlistError.message}`);
                    hasMore = false; // Move to next playlist on error
                }
            }
        } catch (err) {
            console.error(`[Seeder] Failed to process playlist ${playlistId}:`, err.message);
        }
    }

    console.log('[Seeder] Cycle complete. Restarting in 1 hour...');
}
