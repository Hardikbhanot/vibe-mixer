"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import SwipeCards from '@/components/SwipeCards';
import Link from 'next/link';
import { Header } from '@/components/Header';

interface Track {
    id: string;
    name: string;
    artists: { name: string }[];
    album: {
        name: string;
        images: { url: string }[];
    };
    uri: string;
    external_urls?: { spotify: string };
}

interface PlaylistData {
    tracks: Track[];
}

export default function SwipePage() {
    const [tracks, setTracks] = useState<Track[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const fetchFeed = async () => {
            try {
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:4000';
                const res = await fetch(`${apiUrl}/api/swipe/feed`, {
                    credentials: 'include'
                });

                if (res.status === 401 || res.status === 403) {
                    // Redirect to auth if not logged in (since this page is now premium)
                    router.push('/auth?next=/swipe');
                    return;
                }

                if (!res.ok) throw new Error('Failed to load feed');

                const data = await res.json();
                if (data.tracks && data.tracks.length > 0) {
                    setTracks(data.tracks);
                } else {
                    // Fallback to localStorage if feed fails or is empty for some reason (e.g. offline dev)
                    const storedData = localStorage.getItem('playlistData');
                    if (storedData) {
                        const parsed = JSON.parse(storedData);
                        setTracks(parsed.tracks || []);
                    }
                }
            } catch (error) {
                console.error('Feed fetch error', error);
                // Fallback
                const storedData = localStorage.getItem('playlistData');
                if (storedData) {
                    const parsed = JSON.parse(storedData);
                    setTracks(parsed.tracks || []);
                }
            } finally {
                setLoading(false);
            }
        };

        fetchFeed();
    }, [router]);

    const handleEmpty = () => {
        // When all cards are swiped
        // We could show a specific "Refining..." UI here
        // For now, let's redirect to a "Refined Results" notification or back to results
        // Ideally, we'd trigger the /refine endpoint automatically here.
        router.push('/results?refining=true');
    };

    if (loading) return null;

    // ...

    return (
        <div className="min-h-screen bg-background-light dark:bg-background-dark flex flex-col relative overflow-hidden">
            <Header />

            <div className="flex-1 flex items-center justify-center flex-col p-4">
                <SwipeCards tracks={tracks} onEmpty={handleEmpty} />
            </div>


        </div>
    );
}
