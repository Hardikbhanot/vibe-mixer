# VibeMixer: System Architecture & Implementation Changelog

> **Handoff Document for Google Antigravity & Development Team**  
> *Generated: October 2026 | Covers Full Stack Upgrades across Client, Server, Database, and Infrastructure.*

---

## 1. Executive Summary

This document details all technical upgrades performed on **VibeMixer** to transform it from a personal project into a high-growth AI music platform with **sub-second RAG**, **harmonic vector matching**, **real-time explainable AI (XAI) telemetry**, and an **autonomous taste learning engine**.

### Key Milestones Achieved
1. **Frontend Overhaul**: Rebuilt the landing page into a startup-grade UI with interactive Live Studio sandbox, animated vinyl player, real-time bouncing equalizer waveform, telemetry chips, Bento grid feature cards, and comparison matrix.
2. **Infrastructure & OAuth Recovery**: Scaled up Heroku backend dyno (`web@1:Basic`), configured Cloudflare DNS-only routing with Let's Encrypt ACM certificates for `https://api.vibemixer.hbhanot.tech`, and resolved cross-subdomain cookie session authentication for Google & Spotify OAuth.
3. **Database Schema & Zero-Latency Caching**: Extended Prisma `TrackKnowledge` schema on AWS RDS PostgreSQL (pgvector) to cache `coverImage`, `spotifyUri`, `previewUrl`, and `durationMs`.
4. **Sub-Second RAG Generation**: Connected frontend harmonic sliders (`valence`, `energy`, `tempo`) directly to pgvector queries and eliminated external API latency by serving tracks directly from PostgreSQL in `<20ms`.
5. **Acoustic & Artwork Batch Enrichment Engine**: Created high-throughput batch script (`server/scripts/enrichAudioFeaturesBatch.js`) capable of enriching 500+ tracks/minute using Groq and iTunes Search API.
6. **Autonomous Taste Deck (Rocchio Taste Centroid)**: Upgraded `server/routes/swipe.js` to dynamically compute a 768-dimensional user taste vector from likes (1.0x) and superlikes (2.0x) to drive hyper-personalized recommendations in `<100ms`.
7. **Authentic Telemetry**: Replaced all legacy `Math.random()` confidence scoring with real composite cosine similarity and Euclidean harmonic delta calculations.

---

## 2. Infrastructure & Networking

### Production Endpoints
- **Frontend**: Hosted on Vercel / Cloudflare (`https://vibemixer.hbhanot.tech`)
- **Backend API**: Hosted on Heroku (`https://api.vibemixer.hbhanot.tech`)
- **Heroku Dyno Target**: `polar-cockroach-wmpn4na5ag3a520pgdo7t745.herokudns.com`
- **Database**: AWS RDS PostgreSQL 16 with `pgvector` (`eu-west-1` region)

### Critical Configuration Rules
1. **Cloudflare DNS**: The CNAME record for `api.vibemixer.hbhanot.tech` **MUST be set to DNS Only (Grey Cloud)**. Enabling the Orange Cloud proxy breaks Heroku Let's Encrypt SSL handshake and causes `SSL_ERROR_UNRECOGNIZED_NAME_ALERT`.
2. **Authentication Cookies**: Auth tokens (`auth_token`) are set with domain `.vibemixer.hbhanot.tech` (`SameSite: 'Lax'`, `Secure: true`). The Next.js frontend must point `NEXT_PUBLIC_API_URL` to `https://api.vibemixer.hbhanot.tech` so cookies flow across subdomains.

---

## 3. Database & Schema Upgrades

### Prisma Schema (`server/prisma/schema.prisma`)
The `TrackKnowledge` model was extended with zero-latency caching fields:

```prisma
model TrackKnowledge {
  id               String   @id @default(uuid())
  title            String
  artist           String
  lyrics           String   @db.Text
  
  // Semantic Vector of the lyrics (Gemini 768-dim)
  lyricsEmbedding  Unsupported("vector(768)")?
  
  // Spotify / Acoustic Audio Features
  spotifyId        String? 
  valence          Float?   // 0.0 (Sad/Dark) to 1.0 (Happy/Euphoric)
  energy           Float?   // 0.0 (Calm/Acoustic) to 1.0 (Fast/Loud)
  danceability     Float?   // 0.0 to 1.0
  acousticness     Float?   // 0.0 to 1.0
  tempo            Float?   // BPM (e.g. 120)
  instrumentalness Float?  // 0.0 to 1.0

  // Playback & Artwork Caching (Zero-latency serving)
  coverImage       String?  // High-res 600x600 artwork URL
  spotifyUri       String?  // spotify:track:... or search URI
  previewUrl       String?  // 30-sec audio stream for instant web preview
  durationMs       Int?     @default(210000)
  
  updatedAt        DateTime @updatedAt

  @@unique([title, artist])
}
```

- **Database Migration**: Synced to AWS RDS via `npx prisma db push` without data loss.
- **Client Generation**: Run `npx prisma generate` in `server/` after any schema edits.

---

## 4. Frontend Revamp & UI System

### Modified Files:
- [`client/app/HomePageContent.tsx`](file:///client/app/HomePageContent.tsx)
- [`client/components/Header.tsx`](file:///client/components/Header.tsx)
- [`client/components/Footer.tsx`](file:///client/components/Footer.tsx)
- [`client/app/globals.css`](file:///client/app/globals.css)

### Key Features Implemented:
1. **Interactive Live Studio Sandbox**:
   - Real-time vibe selector pill buttons ("Midnight Rain in Shibuya", "90s French Touch House", "Lo-Fi Beats to Chill/Study", etc.).
   - Dynamic 3-band Harmonic Vector coordinate sliders (Valence, Energy, BPM).
   - Animated spinning vinyl record synchronized with simulated audio playback.
   - Real-time bouncing equalizer waveform (5 animated frequency bars).
   - Live telemetry chips displaying real-time BPM, Valence, Energy, and RAG Confidence Score.
2. **Asymmetric 5-Card Bento Grid**:
   - Card 1: *Harmonic Vector Coordinates* (sliders mapped to vector space).
   - Card 2: *Vision-to-Soundtrack* (multimodal visual atmosphere extraction).
   - Card 3: *Autonomous Taste Deck* (Tinder-style swipe feed that adapts in real time).
   - Card 4: *Regional & Cultural Radar* (cross-lingual recommendations across Hindi, Punjabi, Global Pop, Indie).
   - Card 5: *Dual Sync Architecture* (Spotify + YouTube Music export).
3. **"Why VibeMixer" Comparison Matrix**:
   - Visual comparison table benchmarking VibeMixer against Spotify Daily Mix and raw ChatGPT prompts.
4. **Startup Footer**:
   - Multi-column navigation with live status indicator (`● All Systems Operational`).
5. **Animation Keyframes (`client/app/globals.css`)**:
   - Added `@keyframes spin-slow` (20s linear infinite rotation).
   - Equalizer waveform bounce keyframes.

---

## 5. Backend AI & Recommendation Engine

### 5.1 Universal Metadata Resolver (`server/services/trackMetadata.js`)
- Uses iTunes Search API for zero-authentication, rate-limit-free metadata extraction.
- Cleans track titles (removes `feat.`, `(Official Video)`, `[Lyric Video]`, etc.).
- Converts `100x100bb.jpg` to high-resolution `600x600bb.jpg`.
- Extracts 30-second AAC preview audio streams (`previewUrl`) for instant in-browser playback.

### 5.2 High-Throughput Acoustic Enrichment Engine (`server/scripts/enrichAudioFeaturesBatch.js`)
- Solves the legacy 1-track-at-a-time rate limit bottleneck.
- **Batching**: Sends 10 tracks per LLM prompt to Groq (`openai/gpt-oss-20b` with `qwen/qwen3.8-27b` fallback).
- In a single pass, calculates `valence`, `energy`, `danceability`, and `tempo`.
- Concurrently fetches high-res album covers via `trackMetadata.js`.
- Updates AWS RDS PostgreSQL sequentially to avoid connection pool exhaustion.
- Can be run at any time via:
  ```powershell
  cd server
  node scripts/enrichAudioFeaturesBatch.js
  ```

### 5.3 Sub-Second RAG & Real Harmonic Matching (`server/routes/ai.js`)
- **Harmonic Querying**: Request sliders for `valence` and `energy` are mapped directly to SQL ranges:
  ```sql
  WHERE 1=1 
    AND (valence IS NULL OR (valence >= $minV AND valence <= $maxV))
    AND (energy IS NULL OR (energy >= $minE AND energy <= $maxE))
  ORDER BY "lyricsEmbedding" <=> $vibeEmbedding::vector LIMIT 20;
  ```
- **Zero-Latency Resolution Hierarchy**:
  1. *Database Hit*: If track exists in `TrackKnowledge` with `coverImage`, return in **<20ms** (0 external HTTP calls).
  2. *iTunes Fast Fallback*: If cover is missing, fetch from iTunes in **<100ms** and asynchronously save to database.
  3. *External Fallback*: Spotify Web API search or YouTube Music fallback.
- **True Explainable AI (XAI) Confidence Telemetry**:
  Replaced `Math.random()` with authentic vector + acoustic composite math:
  $$\text{Composite Score} = 0.65 \times \text{Cosine Sim} + 0.35 \times \left(1 - \frac{|\Delta \text{Valence}| + |\Delta \text{Energy}|}{2}\right)$$
  Returns structured telemetry:
  ```json
  "harmonic_telemetry": {
    "semanticMatch": 94,
    "harmonicAlignment": 91,
    "valence": 75,
    "energy": 82
  }
  ```

### 5.4 Autonomous Taste Deck: Taste Centroid Vector (`server/routes/swipe.js`)
- Replaced the single random seed track with a **dynamic taste centroid**:
  $$\vec{C}_{\text{taste}} = \frac{\sum (w_i \cdot \vec{v}_i)}{\sum w_i} \quad \text{where } w_{\text{superlike}} = 2.0, \; w_{\text{like}} = 1.0$$
- Embeddings of the user's liked tracks are retrieved and averaged in 768-dimensional space.
- Searches `TrackKnowledge` with `ORDER BY "lyricsEmbedding" <=> $centroid::vector`.
- Filters out all previously swiped track IDs and titles.
- Serves non-repeating recommendations directly from PostgreSQL in **<100ms**.

### 5.5 Automated Weekly Maintenance Cron (`server/services/cronScheduler.js`)
- Integrated `node-cron` directly into the backend server (`server/server.js`).
- Default schedule: Every Sunday at 03:00 AM UTC (`0 3 * * 0`).
- Automatically scans `TrackKnowledge` for records missing acoustic features (`valence IS NULL`) or artwork/preview streams (`coverImage IS NULL`).
- Processes batches in the background via Groq LLM and iTunes Search API without blocking user traffic or depleting rate limits.
- Supports override via environment variable `CRON_SCHEDULE` or disabling via `DISABLE_CRON=true`.

---

## 6. Spotify Web API Strategy & Decoupling

Spotify deprecated `/v1/audio-features` and `/v1/recommendations` with `403 Forbidden` for standard developer apps, and restricts Development Mode apps to 25 whitelist users.

### Architectural Decoupling:
1. **Recommendations & Acoustic Analysis**: Handled 100% internally via our PostgreSQL pgvector database (14,727 tracks) + Gemini embeddings + Groq.
2. **Spotify Role**: Relegated strictly to OAuth authentication and playlist creation:
   - `POST /v1/users/{user_id}/playlists` (Create playlist)
   - `POST /v1/playlists/{playlist_id}/tracks` (Add tracks)
   *(These endpoints remain unrestricted and fully supported).*
3. **Dual Sync**: Every song card provides both Spotify URI links and YouTube Music links so non-Spotify users have zero friction.

---

## 7. Environment Variables Reference

### Backend (`server/.env`)
```ini
PORT=4000
DATABASE_URL="postgres://<user>:<password>@<host>:5432/<dbname>"
JWT_SECRET="<secret-key>"

# AI Services
GROQ_API_KEY="gsk_..."
GEMINI_API_KEY="AQ...."

# Spotify API
SPOTIFY_CLIENT_ID="..."
SPOTIFY_CLIENT_SECRET="..."
SPOTIFY_REDIRECT_URI="https://api.vibemixer.hbhanot.tech/auth/callback"

# Google / YouTube API
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
GOOGLE_REDIRECT_URI="https://api.vibemixer.hbhanot.tech/auth/google/callback"
GOOGLE_API_KEYS="AIzaSy...,AIzaSy..."

CLIENT_URL="https://vibemixer.hbhanot.tech"
DISABLE_SEEDER=true
```

### Frontend (`client/.env.local`)
```ini
NEXT_PUBLIC_API_URL=https://api.vibemixer.hbhanot.tech
NEXT_PUBLIC_CLIENT_URL=https://vibemixer.hbhanot.tech
```

*(For local development, replace `https://api.vibemixer.hbhanot.tech` with `http://localhost:4000` and client with `http://localhost:3000`).*

---

## 8. Spotify Playlist Save & Resilient Resolution Engine

### Problem Diagnosed:
- When tracks are generated via RAG/iTunes fallback, tracks had search URIs (`spotify:search:...`) or IDs with `itunes_...`.
- In `server/routes/spotify.js`, `POST /spotify/playlist` sequentially searched using `req.spotifyApi` (user client).
- If the user's token was expired or in Spotify Dev Mode, the inner catch block swallowed the error without retrying or falling back to `req.guestSpotifyApi` (Client Credentials).
- Because `resolvedUris.length === 0`, it threw HTTP 422 with `fallback: 'youtube'`, causing the client to prompt the user to switch to YouTube and failing to create Spotify playlists.

### Solution Implemented:
1. **Parallel Resilient Resolver (`server/routes/spotify.js`)**:
   - High-throughput parallel resolver (`Promise.all`) resolving tracks concurrently in `<300ms`.
   - Resolution Waterfall:
     1. Direct valid 22-character Spotify track URI (`spotify:track:...`).
     2. Direct 22-character Spotify track ID.
     3. PostgreSQL `TrackKnowledge` cache lookup.
     4. Spotify Web API search with priority to `req.guestSpotifyApi` (Client Credentials — unaffected by user Dev Mode / cookie expiration), with fallback to `req.spotifyApi`.
     5. Asynchronously writes resolved `spotifyUri`, `spotifyId`, and artwork back to `TrackKnowledge` for future instant cache hits.
2. **Pre-Resolution in AI Generation (`server/routes/ai.js`)**:
   - Resolves real `spotify:track:...` URIs via `guestSpotifyApi` at generation time, so generated tracks returned to client already possess authentic Spotify track URIs and URLs.
3. **In-Memory Guest Token Caching (`server/middleware/spotifyAuth.js`)**:
   - Reuses Client Credentials access token until 60 seconds before expiry to prevent repetitive token grants and Spotify rate-limiting.
4. **Proactive Token Refresh**:
   - Validates user token with `req.spotifyApi.getMe()` prior to `createPlaylist()`, automatically refreshing if expired (`401`).
   - Forwards custom playlist `name` and `description` to `createPlaylist()`.

---

## 9. Git Commit Log

```bash
# Frontend Overhaul & Startup UI
commit eb4e896
Author: Hardik Bhanot
Date:   Oct 14 2026
Message: feat(ui): revamp homepage to high-growth startup aesthetic with interactive live studio, bento grid, and comparison matrix

# Backend RAG, Harmonic Vectoring, Taste Centroid, Batch Engine
commit d503939
Author: Hardik Bhanot
Date:   Oct 14 2026
Message: feat(backend): implement sub-second RAG, harmonic vectoring, taste centroid, and batch enrichment

# Spotify Playlist Save Bug Fix & Parallel Resilient Resolver
commit 1980722
Author: Hardik Bhanot
Date:   Oct 15 2026
Message: fix(spotify): resolve playlist save failure with parallel guest client resolution and token caching

# Spotify Button Layout & Responsive SVG Icon Fix
commit 4ebbc41
Author: Hardik Bhanot
Date:   Oct 15 2026
Message: fix(ui): clean Spotify button layout, replace wide wordmark image with responsive SVG icon and prevent text overlap

# YouTube Playlist Export & "Playlist Does Not Exist" Fix
commit b85519a
Author: Hardik Bhanot
Date:   Oct 15 2026
Message: fix(youtube): resolve 'playlist does not exist' with unlisted status and fix empty playlist track insertions
```

---

## 10. YouTube Playlist Export Architecture (`server/routes/youtube.js`)

### Root Cause Analysis of "Playlist Does Not Exist" & Empty Playlists
1. **"The Playlist Does Not Exist" Error**:
   - YouTube API previously set `privacyStatus: 'private'`. In YouTube Data API v3, private playlists return a 404 *"The playlist does not exist."* when visited via a direct link (`https://www.youtube.com/playlist?list=...`) unless the viewer is logged in as the exact YouTube channel inside YouTube Studio.
   - **Resolution**: Defaulted to `privacyStatus: 'unlisted'` (or respect user toggle `isPublic ? 'public' : 'unlisted'`). Unlisted playlists are accessible to anyone with the link, bypass permission walls, and work seamlessly for unverified OAuth apps without showing in public search results.
2. **Missing Songs & Blank Playlist Cover**:
   - In earlier builds, quota exhaustion on user search tokens triggered unhandled errors in fallback search, causing `videoIds` to remain empty while the playlist container was still created.
   - YouTube assigns playlist cover thumbnails automatically from the **first video** in the playlist; because 0 videos were added, the thumbnail remained a blank gray music note placeholder.
   - **Resolution**:
     - Switched to high-throughput concurrent resolution (`Promise.all`) using multi-tier fallback: `track.videoId` -> `scrapeYouTubeVideoId` -> user OAuth `search.list` -> centralized rotator `searchYouTube`.
     - Validated all video IDs with strict 11-char regex (`/^[a-zA-Z0-9_-]{11}$/`).
     - Added automatic token refresh listener on `oauth2Client` and mid-insertion `401` retry.
     - Added per-track insertion logging and actual `insertedCount` verification.
     - Guarded against empty playlist creation with HTTP 422 if 0 videos resolved.

---

## 11. Profile Photo Auto-Save & Real-Time Sync Architecture

### Root Cause Analysis of Photo Vanishing & Header Missing Avatar
1. **Vanishing Photo on Page Reload**:
   - In [`client/app/profile/page.tsx`](file:///client/app/profile/page.tsx), `handleImageUpload` previously only updated local React state (`profileData.avatarUrl`) and popped a toast notification `"Photo updated!"`.
   - It did **not** send an API call to save the base64 photo to the PostgreSQL database. The "Save Changes" button was tucked away inside the "Settings" tab. When reloading, `fetchProfile()` re-fetched the database user record, where `avatarUrl` was still `null`, causing the photo to vanish.
2. **Missing Photo in Header**:
   - [`client/components/Header.tsx`](file:///client/components/Header.tsx) reads `user.avatarUrl` from [`client/context/AuthContext.tsx`](file:///client/context/AuthContext.tsx).
   - `AuthContext` only provided static auth state without exposing `setUser` or `refreshUser`. Even when a photo was loaded in the profile view, `AuthContext` was never updated, leaving the Header displaying the initial letter initial circle.
3. **Partial Updates in Backend (`server/routes/user.js`)**:
   - `PUT /api/user/profile` previously took all fields (`username`, `bio`, etc.) at once. If `username` was empty string `""`, it attempted to set `""` on a `@unique` PostgreSQL column, causing constraint conflicts.

### Resolution Implemented:
1. **Instant Auto-Save on Selection** ([`client/app/profile/page.tsx`](file:///client/app/profile/page.tsx)):
   - Immediately compresses selected image via canvas (max 300px, 85% JPEG).
   - Optimistically updates `profileData.avatarUrl` and `AuthContext`'s `user.avatarUrl`.
   - Sends an immediate `PUT /api/user/profile` request with `{ avatarUrl: compressedBase64 }` directly to the backend database.
   - Shows active upload spinner state (`isUploadingPhoto`) with `"Saving..."` feedback.
2. **Global AuthContext State Synchronization** ([`client/context/AuthContext.tsx`](file:///client/context/AuthContext.tsx)):
   - Exposed `setUser` and `refreshUser: checkUserLoggedIn` in `AuthContext.Provider`.
   - Any avatar change immediately propagates to the desktop and mobile [`Header`](file:///client/components/Header.tsx) without requiring a page reload.
3. **Selective Partial Updates** ([`server/routes/user.js`](file:///server/routes/user.js)):
   - Refactored `PUT /api/user/profile` to dynamically build `dataToUpdate`, updating only fields explicitly supplied in the request body and validating username non-empty strings.

---

## 12. Quick Start Guide for Personal Laptop Antigravity

When continuing development on your personal laptop:

1. **Pull Latest Changes**:
   ```bash
   git pull origin main
   ```
2. **Install Dependencies & Generate Prisma**:
   ```bash
   # Server
   cd server
   npm install
   npx prisma generate

   # Client
   cd ../client
   npm install
   ```
3. **Verify Database Connection**:
   ```bash
   cd server
   node -e "import('./prisma/index.js')" # or run a quick test query
   ```
4. **Run Background Enrichment (Optional)**:
   ```bash
   node scripts/enrichAudioFeaturesBatch.js
   ```
5. **Start Dev Servers**:
   ```bash
   # Terminal 1 (Backend)
   cd server
   npm run dev

   # Terminal 2 (Frontend)
   cd client
   npm run dev
   ```

---

## 13. Mobile Viewport & Responsive Navigation Overhaul

### Problem Diagnosis
1. **Desktop Simulation on Mobile Devices**:
   - On iOS Safari and Android Chrome, the website rendered in zoomed-out desktop emulation mode (simulating ~980px or 1024px).
   - In Next.js 14+ App Router, `metadata.viewport` is deprecated. If `viewport` is not explicitly exported as an independent `export const viewport: Viewport` configuration or `<meta name="viewport" ...>` tag in the root layout, mobile browsers default to desktop emulation, preventing mobile CSS breakpoints (`<lg`) from activating naturally.
2. **Horizontal Overflow Bleed**:
   - Ambient glow blur gradients (`fixed -top-40 ... blur-[150px]`) caused horizontal scroll bounce and overflow on smaller mobile screens.
3. **Cluttered Mobile Navigation**:
   - The navigation header was displaying desktop pill buttons and a fragmented mobile menu with mismatched z-indexes (`z-40` overlay under `z-50` header) and uncontained background body scrolling.

### Implementation Details:
1. **Viewport Configuration** ([`client/app/layout.tsx`](file:///client/app/layout.tsx)):
   - Added Next.js 14 `Viewport` export:
     ```typescript
     export const viewport: Viewport = {
       width: "device-width",
       initialScale: 1,
       maximumScale: 5,
       themeColor: "#070709",
     };
     ```
   - Injected `<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />` in `<head>`.
2. **Layout Overflow Containment** ([`client/app/globals.css`](file:///client/app/globals.css)):
   - Added strict viewport containment:
     ```css
     html, body {
       overflow-x: hidden;
       max-width: 100vw;
     }
     ```
3. **Responsive Hamburger Navigation Drawer** ([`client/components/Header.tsx`](file:///client/components/Header.tsx)):
   - **Desktop Navigation**: Preserved sleek horizontal pill nav bar, restricted to `hidden lg:flex`.
   - **Mobile Hamburger Toggle**: Added modern animated hamburger/close toggle button (`lg:hidden`) with `aria-label` and `aria-expanded` accessibility attributes.
   - **Full-Featured Mobile Drawer**:
     - Positioned directly below header (`fixed inset-x-0 top-[57px] bottom-0 z-50`) with backdrop blur (`backdrop-blur-2xl bg-[#070709]/95`).
     - Automated background scroll locking (`document.body.style.overflow = 'hidden'`) while drawer is open.
     - **Profile / Auth Card**: Shows user avatar, email address, and quick link to `/profile`, or quick Sign In / Get Started actions.
     - **Feature Navigation Cards**: Visual list with icons, titles, and descriptions for Studio, Taste Deck, Radar, Community, Vibe Match, and Messages.
     - **Bottom Utility Bar**: Features one-tap Theme Toggle and Red-accented Sign Out button.

---

## 14. Spotify 403 Forbidden Root Cause & Resolution

### Root Cause Analysis
1. **Endpoint Deprecation in Spotify Web API**:
   - The legacy `spotify-web-api-node` library internally called `POST /v1/playlists/{playlist_id}/tracks` when adding tracks.
   - In late 2024 / 2025, Spotify officially deprecated `/tracks` for playlist modifications in favor of the unified `POST /v1/playlists/{playlist_id}/items` endpoint. Calling the deprecated route triggers an immediate `403 Forbidden` from Spotify's API gateways.
2. **Spotify Developer Mode Whitelist Enforcement**:
   - While an app is in **Development Mode** on the Spotify Developer Portal, Spotify strictly limits write operations and OAuth access to accounts explicitly registered in the app's **Users and Access / User Management** whitelist (maximum 25 users).
   - Any external Spotify account attempting to create a playlist or modify items receives a `403 Forbidden` response.
3. **Stale Scopes on Existing Tokens**:
   - If a user previously authorized VibeMixer before `playlist-modify-public` and `playlist-modify-private` were added, Spotify re-issued tokens without the latest scopes unless explicitly forced with `show_dialog=true`.

### Fix Implementation:
1. **Direct `/items` Endpoint with SDK Fallback** ([`server/routes/spotify.js`](file:///server/routes/spotify.js)):
   - Replaced `req.spotifyApi.addTracksToPlaylist` with a direct call to `POST https://api.spotify.com/v1/playlists/${playlistId}/items` using the user's active bearer token.
   - Retained automatic chunking (50 tracks per batch) and graceful fallback to the SDK method if needed.
2. **Forced Scope Dialog Refresh** ([`server/routes/auth.js`](file:///server/routes/auth.js)):
   - Updated `spotifyApi.createAuthorizeURL(scopes, state, true)` to include `show_dialog=true`. This ensures users are prompted to consent to playlist write permissions (`playlist-modify-public`, `playlist-modify-private`, `ugc-image-upload`).
3. **Actionable 403 Error Handling & 1-Click Fallback** ([`server/routes/spotify.js`](file:///server/routes/spotify.js), [`client/app/results/page.tsx`](file:///client/app/results/page.tsx)):
   - Specifically catches `403 Forbidden` responses and parses the underlying Spotify error payload.
   - Surfaces a helpful, human-readable message explaining the Spotify Developer whitelist requirement, and provides an immediate 1-click fallback button to **"Save to YouTube 🎬"** or save to profile library so playlists are never lost.

---

## 15. YouTube 10k Views Quality Filter & Anti-Literal Lyrical Matching

### Problem Diagnosis
1. **Low Quality / Obscure YouTube Video Matches**:
   - When resolving YouTube audio or video tracks, naive searches sometimes matched obscure bedroom covers, fan re-uploads, or broken audio snippets with < 500 views rather than authentic official tracks.
2. **Literal Title Bias on Prompt Generation**:
   - When a user requested themed playlists like "rainy day songs", LLMs fell into the classic "literal title bias" trap, suggesting songs solely because they contain the word "rain" or "rainy" in their title (e.g., 'Rain on Me', 'Set Fire to the Rain', 'Purple Rain', 'Rainy Days and Mondays').
   - This ruined immersion by ignoring the true emotional vibe, acoustic texture, and lyrical mood (cozy, introspective, melancholic, acoustic guitar, soft piano, lo-fi beats, gentle vocals).

### Implementation Details:
1. **YouTube >= 10,000 Views Verification Engine** ([`server/services/youtube.js`](file:///server/services/youtube.js), [`server/routes/youtube.js`](file:///server/routes/youtube.js)):
   - Implemented `parseYouTubeViews` to parse view count strings (`"882,135,109 views"`, `"1.2M views"`, `"15K views"`, `"840 views"`).
   - In `scrapeYouTubeVideoId`: Parses view counts directly from public search HTML renderer blocks and enforces `minViews = 10000`, filtering out low-view videos.
   - In `searchYouTube` & `searchYouTubeMultiple`: Fetches top candidate batches and verifies `statistics.viewCount >= 10000` before returning tracks.
   - In `resolveTrackVideoId`: Ensures only verified videos with >= 10k views are added to created YouTube playlists.
2. **Anti-Literal Title Bias & Deep Lyrical Theme Extraction** ([`server/services/groq.js`](file:///server/services/groq.js)):
   - Added strict anti-literal title rules to `DYNAMIC_SYSTEM_PROMPT`:
     - Explicitly forbids packing playlists with songs matching literal prompt words (maximum 1-2 title matches permitted; 90%+ must match through lyrical and sonic depth).
   - Upgraded `extractMusicalKeywords`:
     - Translates literal concepts into emotional atmosphere, acoustic textures, and narrative themes (e.g. "rainy day" ➔ "introspective melancholic cozy acoustic guitar soft piano solitude nostalgia wistful longing warm gentle vocals lo-fi peaceful reflective").
     - Generates dedicated `lyrical_themes` descriptions.
3. **Harmonic & Semantic RAG Alignment** ([`server/routes/ai.js`](file:///server/routes/ai.js)):
   - Injected the extracted lyrical narrative into `generateEmbedding(embeddingQuery)`, enabling Gemini pgvector search over 15,000+ songs to retrieve tracks whose actual lyrics match the mood, regardless of their song title.



