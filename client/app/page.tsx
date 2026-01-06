import type { Metadata } from "next";
import HomePageContent from "./HomePageContent";

export const metadata: Metadata = {
    title: "VibeMixer - The Best Free AI Playlist Maker & Vibe Generator",
    description: "Looking for an AI playlist maker? VibeMixer creates perfect Spotify & YouTube playlists from your text prompts. describe your mood, vibe, or activity instantly.",
    keywords: [
        "playlist maker",
        "AI playlist generator",
        "Spotify playlist maker",
        "YouTube playlist generator",
        "music vibe matcher",
        "free playlist creator",
        "mood to music converter",
        "automatic playlist generator"
    ],
    openGraph: {
        title: "VibeMixer - Free AI Playlist Maker",
        description: "Generate custom playlists for Spotify and YouTube instantly with AI. The best free playlist maker for every mood.",
        images: ["/og-image.png"]
    }
};

export default function Home() {
    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'WebApplication',
        'name': 'VibeMixer',
        'url': 'https://vibemixer.hbhanot.tech',
        'description': 'AI-powered playlist generator that syncs with Spotify and YouTube.',
        'applicationCategory': 'MultimediaApplication',
        'operatingSystem': 'Any',
        'offers': {
            '@type': 'Offer',
            'price': '0',
            'priceCurrency': 'USD'
        },
        'featureList': [
            'AI Playlist Generation',
            'Spotify Sync',
            'YouTube Sync',
            'Music Discovery Feed',
            'Mood Analysis'
        ]
    };

    return <HomePageContent jsonLd={jsonLd} />;
}
