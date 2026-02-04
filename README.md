# 🎧 VibeMixer

**Your Mood. Your Mix. Instantly.**

[![Live Demo](https://img.shields.io/badge/🚀_Live_Demo-vibemixer.hbhanot.tech-blue?style=for-the-badge)](https://vibemixer.hbhanot.tech/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

---

## 💡 What is VibeMixer?

**VibeMixer** is a next-generation AI-powered music discovery platform that solves "playlist paralysis." Instead of manually curating songs, simply describe your vibe—or upload an image—and let our AI orchestrate the perfect mix.

Whether it's *"Cyberpunk coding at 2 AM"* or *"Sunset drive through Miami 1984"*, VibeMixer understands the nuance and instantly syncs your custom playlist to **Spotify** and **YouTube**.

Now available as a **Responsive Web App** and a **Native Mobile App** (iOS/Android).

---

## ✨ Key Features

### 🤖 AI-Powered Curation
*   **Text-to-Mix**: Uses **Google Gemini 1.5 Flash** to translate complex prompts into structured musical attributes (tempo, genre, key).
*   **Image-to-Vibe**: Upload a photo, and our vision models (**Groq / Llama 3.2 Vision**) analyze the scene to generate a matching soundtrack.
*   **Dynamic Cover Art**: Automatically generates aesthetic cover art for every playlist using **Pollinations AI**.

### 🌍 Immersive Discovery
*   **Indian Vibe Map**: An interactive D3.js map to explore trending music across different states of India.
*   **Community Feed**: Browse, like, and save mixes created by other users in the verified community.
*   **Swipe Mode**: A Tinder-style "Like or Pass" interface to refine your recommendations.

### 🎧 Seamless Playback
*   **Cross-Platform Sync**: One-click save to **Spotify** and **YouTube**.
*   **Deep Linking**: Open tracks directly in your favorite native apps from mobile.
*   **Smart Fallbacks**: If a song isn't on Spotify, we find the best match on YouTube automatically.

---

## 🛠️ Tech Stack

### ⚡ Client (Web)
*   **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
*   **UI Library**: [React 19](https://react.dev/)
*   **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
*   **Animation**: Framer Motion
*   **Visualization**: D3.js, React Simple Maps

### 📱 Mobile (iOS & Android)
*   **Framework**: [Expo 54](https://expo.dev/) (React Native 0.81)
*   **Routing**: Expo Router
*   **Auth**: Expo Secure Store
*   **Design**: Native styling with linear gradients and blur effects

### 🔙 Server (Backend)
*   **Runtime**: Node.js 20 & Express 5
*   **Database**: PostgreSQL (via [Prisma ORM](https://www.prisma.io/))
*   **AI Services**: 
    *   Google Gemini SDK (Text analysis)
    *   Groq SDK (Vision analysis)
*   **Integrations**: Spotify Web API, YouTube Data API v3

### 🏗️ Architecture: Real-Time RAG

VibeMixer implements a **Real-Time Retrieval-Augmented Generation (RAG)** engine to ensure recommendations are not just creative, but grounded and current.

1.  **Retrieval**:
    *   **User Context**: Fetches your top artists and listening history from the database to personalize the seed.
    *   **Market Freshness**: Queries the Spotify Search API for new releases (e.g., "Songs released in 2024-2025") matching the requested vibe.
2.  **Augmentation**:
    *   Injects this live context into the **Gemini 1.5 Flash / Groq** system prompt.
3.  **Generation**:
    *   The LLM generates a structured JSON playlist that blends your personal taste with the latest trending tracks, avoiding the "knowledge cutoff" limitation of standard models.

---

## 🚀 Getting Started

VibeMixer is a monorepo. Follow these steps to set it up locally.

### Prerequisites
*   Node.js v20+
*   npm or yarn
*   PostgreSQL Database
*   Expo Go app (for mobile testing)

### 1. Installation

Clone the repository and install dependencies for all workspaces:

```bash
git clone https://github.com/Hardikbhanot/vibe-mixer.git
cd vibe-mixer

# Install dependencies for each part
cd server && npm install
cd ../client && npm install
cd ../mobile && npm install
```

### 2. Environment Setup

Create a `.env` file in the `server` directory:

```env
PORT=4000
DATABASE_URL="postgresql://user:password@localhost:5432/vibemixer?schema=public"
JWT_SECRET="your_jwt_secret"

# AI Services
GEMINI_API_KEY="your_google_ai_key"
GROQ_API_KEY="your_groq_key"

# Spotify API
SPOTIFY_CLIENT_ID="your_spotify_id"
SPOTIFY_CLIENT_SECRET="your_spotify_secret"
SPOTIFY_REDIRECT_URI="http://localhost:4000/auth/callback"

# Google/YouTube API
GOOGLE_CLIENT_ID="your_google_client_id"
GOOGLE_CLIENT_SECRET="your_google_client_secret"
GOOGLE_REDIRECT_URI="http://localhost:4000/auth/google/callback"
```

Create a `.env.local` file in the `client` directory:

```env
NEXT_PUBLIC_API_URL="http://localhost:4000"
```

Create a `.env` file in the `mobile` directory (or use Expo secrets):

```env
EXPO_PUBLIC_API_URL="http://YOUR_LOCAL_IP_ADDRESS:4000"
# Note: For mobile, use your machine's LAN IP (e.g., 192.168.1.5), not localhost.
```

### 3. Running the Project

**Start the Backend:**
```bash
cd server
npx prisma generate
npx prisma db push
npm run dev
# Server runs on http://localhost:4000
```

**Start the Web Client:**
```bash
cd client
npm run dev
# Client runs on http://localhost:3000
```

**Start the Mobile App:**
```bash
cd mobile
npm run ios  # or npm run android
# Scan the QR code with Expo Go
```


---

## 🤝 Contributing

Capabilities are limitless! If you have ideas for new vibes or features:
1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

**Crafted with ❤️ by Hardik Bhanot**
