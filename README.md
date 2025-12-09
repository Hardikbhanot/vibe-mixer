# VibeMixer 🎧

**Your Mood. Your Mix. Instantly.**

VibeMixer is a full-stack AI-powered application that orchestrates music discovery. It solves "playlist paralysis" by transforming natural language prompts into curated playlists, automatically syncing them to **Spotify** and **YouTube** in seconds.

## 🚀 Live Demo
https://vibemixer.hbhanot.tech/

## 💡 About The Project

Finding the right music for a specific niche scenario—like *"Late night coding session with lo-fi beats"* or *"High energy 90s gym workout"*—usually requires manual curation. 

VibeMixer automates this by:
1.  **Interpreting Intent:** Using **Google Gemini AI** to analyze the user's prompt for mood, genre, tempo, and specific artists.
2.  **Structured Data Extraction:** Converting abstract vibes into a strict JSON dataset of songs.
3.  **Parallel API Orchestration:** Searching **Spotify** and **YouTube** simultaneously to find valid track URIs.
4.  **Auto-Provisioning:** Creating the playlist directly in the user's library with custom AI-generated cover art.

## 🛠 Tech Stack

**Frontend:**
* **Next.js (App Router):** For server-side rendering and optimized routing.
* **React:** Component-based UI architecture.
* **Tailwind CSS:** Responsive, modern styling with dark mode support.

**Backend:**
* **Node.js & Express:** RESTful API handling auth flows and third-party integrations.
* **Prisma (PostgreSQL):** Robust ORM for managing user data, swipe history, and auth sessions.
* **Google Gemini 1.5 Flash:** Large Language Model (LLM) for high-speed, structured JSON generation.
* **Pollinations AI:** Real-time generation of playlist cover art.

**Integrations:**
* **Spotify Web API:** OAuth 2.0 authentication, track search, and playlist management.
* **YouTube Data API v3:** Video search and playlist creation.
* **OAuth 2.0:** Secure user authentication for both platforms.

## ✨ Key Features

* **🤖 AI-Driven Curation:** Understands complex, natural language prompts (e.g., "Songs for driving through Tokyo at night").
* **📍 Indian Vibe Map:** Interactive map to discover trending music across different Indian states instantly.
* **🔥 Swipe Mode:** Tinder-style "Like or Nope" interface to refine your music taste and train the recommendation engine.
* **🎵 Dual-Platform Sync:** Generates playlists on **Spotify** and **YouTube** from a single prompt.
* **⚡ Optimized Performance:** Uses parallel `Promise.all` execution for API searches, reducing generation time to <5 seconds.
* **🖼️ Dynamic Cover Art:** Automatically generates visual cover art that matches the acoustic "vibe" of the playlist.
* **🔐 Secure Authentication:** Implements Authorization Code Flow and Guest Mode for flexible access.

## ⚙️ Environment Variables

To run this project locally, you will need to add the following variables to your `.env` file in the `server` directory:

```env
PORT=4000
FRONTEND_URI=http://localhost:3000

# Google Gemini AI
GEMINI_API_KEY=your_gemini_key

# Spotify API
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
SPOTIFY_REDIRECT_URI=http://localhost:4000/auth/callback

# Google/YouTube API
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:4000/auth/google/callback
