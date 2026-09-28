# VibeMixer Optimization & RAG Expansion Plan

This document outlines strategic optimizations to dramatically improve playlist accuracy, reduce external API dependency (Spotify/YouTube quotas), and expand the use of the Gemini RAG (Retrieval-Augmented Generation) pipeline across the codebase.

---

## Phase 1: Expanding RAG Capabilities

Currently, RAG is only used during text-to-playlist generation. We can expand the vector database to power the entire app.

### 1. RAG-Powered "Vibe Swipe" Feed
*   **Current Issue:** The Swipe Feed relies on generic, hardcoded query categories (`hindi new`, `genre:pop`) and grabs the highest viewed YouTube/Spotify songs.
*   **The Optimization:** When the Swipe Feed is requested, generate an embedding of the user's **recent swipe history** and perform a vector search (`pgvector`) against the `TrackKnowledge` database. 
*   **Result:** Instead of generic pop hits, the Swipe Cards will serve highly personalized, obscure hidden gems that perfectly match the semantic "vibe" the user is currently looking for.

### 2. "Zero-Latency" Local RAG Search (Bypassing Quotas)
*   **Current Issue:** When Spotify blocks a search (403), the server makes a slow HTTP request to the YouTube API. The YouTube API has strict daily quotas.
*   **The Optimization:** Before reaching out to YouTube, we can query our local `TrackKnowledge` pgvector database (which already has 14,800+ tracks).
*   **Result:** If the LLM generates a song that we already know about, we pull the metadata instantly from our own database. This cuts generation time in half and saves massive amounts of YouTube API quota.

### 3. Cross-User Playlist Discovery
*   **Current Issue:** Users generate playlists in isolation. 
*   **The Optimization:** Build a RAG-based `similar_playlists` endpoint for the Discover page. When a user clicks on a playlist, we run a vector similarity search against all other public playlists to show a "Playlists with a Similar Vibe" section, fully powered by Gemini embeddings.

---

## Phase 2: Improving Search Precision

### 1. Two-Stage RAG Re-Ranking
*   **Current Issue:** RAG currently fetches the top 15 tracks based purely on lyrical/semantic similarity.
*   **The Optimization:** Fetch the top 50 tracks via vector search, and then apply a secondary programmatic filter in JavaScript (or advanced SQL) to score them based on exact `valence` (happiness) and `energy` constraints. 
*   **Result:** Guarantees that the LLM only receives songs that perfectly match the tempo and mood required.

### 2. Multi-threaded External Fetching
*   **Current Issue:** In `server/routes/ai.js`, `aiParams.suggested_tracks.map` processes external track searches (Spotify/YouTube) asynchronously, but doesn't handle connection pooling perfectly, risking rate-limits.
*   **The Optimization:** Implement a rate-limited concurrency queue (e.g., using `p-limit`) when hitting YouTube/Spotify APIs. 
*   **Result:** Prevents accidental DDOSing of our own YouTube rotator, ensuring higher reliability during heavy playlist generation.

### 3. Title Normalization Expansion
*   **Current Issue:** We recently fixed title normalization for RAG injections. However, the database might still contain thousands of legacy tracks with dirty titles (`(Official Video)`, `[Lyrics]`).
*   **The Optimization:** Write a one-off database migration script to scan the 14,800 tracks, strip out YouTube metadata syntax from the `title` column, and re-save them. 
*   **Result:** A massive, instantaneous bump in Knowledge Match percentages across the entire platform.

---

## Phase 3: Performance & Caching

### 1. Redis / In-Memory Embedding Cache
*   **Current Issue:** Every time a user types a prompt (e.g., "Sad rainy day"), we spend time and Gemini API tokens to generate an embedding.
*   **The Optimization:** Implement an LRU cache or Redis layer for standard prompts. If someone types a similar prompt, we instantly serve the cached vector.

### 2. Client-Side Image Resizing for Vision AI
*   **Current Issue:** The frontend sends raw images to the backend. As seen earlier, Groq's Vision API can reject them or they can be too large.
*   **The Optimization:** Compress and resize images on the frontend (using standard Canvas APIs) before uploading. 
*   **Result:** Faster upload speeds, zero Groq rejection errors, and lower bandwidth costs.
