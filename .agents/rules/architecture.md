---
trigger: always_on
description: Core architecture rules, database caching conventions, and AI pipeline standards for VibeMixer
---

# VibeMixer Core Architecture & Engineering Standards

For full system history and implementation details, see [SYSTEM_ARCHITECTURE_CHANGES.md](../../SYSTEM_ARCHITECTURE_CHANGES.md).

## 1. Database & Caching Conventions
- The primary track knowledge store is PostgreSQL table `TrackKnowledge` with pgvector (`lyricsEmbedding vector(768)`).
- Never make on-the-fly external network requests (Spotify / YouTube) for tracks that already exist in `TrackKnowledge` with a `coverImage`.
- Always check `TrackKnowledge.coverImage` first. If present, return immediately in `<20ms`.
- If missing, use `fetchTrackMetadata(title, artist)` from `services/trackMetadata.js` (iTunes Search API, free, no auth) to resolve high-resolution 600x600 artwork and 30s preview audio streams before falling back to Spotify/YouTube.

## 2. Harmonic Vectoring & RAG Standards
- Harmonic sliders on the frontend represent:
  - `valence`: 0.0 to 1.0 (Sad/Dark to Happy/Euphoric)
  - `energy`: 0.0 to 1.0 (Calm/Acoustic to Intense/Fast)
  - `tempo`: BPM (60 to 180)
- In `server/routes/ai.js`, harmonic queries MUST narrow pgvector search using target slider coordinates.
- **Explainable AI (XAI)**: Never use `Math.random()` for confidence scores. Always calculate composite cosine similarity plus Euclidean harmonic deviation:
  $$\text{Composite Score} = 0.65 \times \text{Cosine Sim} + 0.35 \times \left(1 - \frac{|\Delta V| + |\Delta E|}{2}\right)$$

## 3. Autonomous Taste Deck
- In `server/routes/swipe.js`, the discovery feed uses a weighted **Taste Centroid Vector** (Superlikes = 2x, Likes = 1x) calculated across the user's recent swipe history.
- Query `TrackKnowledge` with `ORDER BY "lyricsEmbedding" <=> $centroid::vector LIMIT 35` and deduplicate against `seenSet`.

## 4. Spotify Web API Strategy
- Never depend on Spotify's `/v1/audio-features` or `/v1/recommendations` endpoints (deprecated with 403s on standard developer apps).
- All acoustic intelligence and recommendations are computed in-house via PostgreSQL + Groq + Gemini.
- Use Spotify Web API strictly for OAuth login and playlist export (`POST /v1/users/{id}/playlists` and `POST /v1/playlists/{id}/tracks`).

## 5. Background Maintenance & Enrichment
- Automated weekly background enrichment runs via `server/services/cronScheduler.js` (Sundays at 03:00 UTC).
- Enriches tracks with Groq audio features and iTunes album art / 30s preview streams without degrading user request latency.

