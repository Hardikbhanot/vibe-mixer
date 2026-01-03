"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import SwipeCards from '@/components/SwipeCards';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { toast } from 'sonner';

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
    const [error, setError] = useState(false);
    const router = useRouter();

    const fetchFeed = async () => {
        setLoading(true);
        setError(false);
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:4000';
            const res = await fetch(`${apiUrl}/api/swipe/feed`, {
                credentials: 'include'
            });

            if (res.status === 401 || res.status === 403) {
                router.push('/auth?next=/swipe');
                return;
            }

            if (!res.ok) throw new Error('Failed to load feed');

            const data = await res.json();
            if (data.tracks && data.tracks.length > 0) {
                setTracks(data.tracks);
            } else {
                // Try fallback
                const storedData = localStorage.getItem('playlistData');
                if (storedData) {
                    const parsed = JSON.parse(storedData);
                    setTracks(parsed.tracks || []);
                    if (!parsed.tracks?.length) setError(true);
                } else {
                    setError(true);
                }
            }
        } catch (error) {
            console.error('Feed fetch error', error);
            const storedData = localStorage.getItem('playlistData');
            if (storedData) {
                const parsed = JSON.parse(storedData);
                setTracks(parsed.tracks || []);
            } else {
                setError(true);
                toast.error("Unable to load new songs. Please check your connection.");
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFeed();
    }, [router]);

    const handleEmpty = () => {
        router.push('/results?refining=true');
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background-light dark:bg-background-dark flex flex-col relative overflow-hidden">
            <Header />

            <div className="flex-1 flex items-center justify-center flex-col p-4">
                {error && tracks.length === 0 ? (
                    <div className="text-center p-8 bg-white/5 rounded-2xl border border-white/10">
                        <p className="text-white mb-4">We couldn't find any vibes right now.</p>
                        <button
                            onClick={fetchFeed}
                            className="px-6 py-2 bg-primary text-black font-bold rounded-full hover:scale-105 transition-transform"
                        >
                            Try Again
                        </button>
                    </div>
                ) : (
                    <SwipeCards tracks={tracks} onEmpty={handleEmpty} />
                )}
            </div>
        </div>
    );
}
