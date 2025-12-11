"use client";

import { useEffect, useState } from 'react';
import { Header } from '@/components/Header';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';

interface Track {
    id: string;
    name: string;
    artist?: string;
    artists?: { name: string }[];
    album?: {
        name: string;
        images: { url: string }[];
    };
    image?: string;
    uri: string;
    duration_ms: number;
    external_urls?: { spotify: string };
}

interface PublicPlaylist {
    id: string;
    name: string;
    description: string | null;
    coverImage: string | null;
    mood: string | null;
    createdAt: string;
    user: {
        username: string;
        avatarUrl: string | null;
    };
    tracks: Track[];
}

export default function PublicMixPage() {
    const params = useParams();
    const [playlist, setPlaylist] = useState<PublicPlaylist | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (params.id) {
            fetchPlaylist(params.id as string);
        }
    }, [params.id]);

    const fetchPlaylist = async (id: string) => {
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:4000';
            const res = await fetch(`${apiUrl}/api/playlists/public/${id}`);

            if (!res.ok) {
                if (res.status === 404) throw new Error("Playlist not found");
                if (res.status === 403) throw new Error("This playlist is private");
                throw new Error("Failed to load playlist");
            }

            const data = await res.json();
            setPlaylist(data);
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Error loading vibe');
        } finally {
            setLoading(false);
        }
    };

    const handlePlayTrack = (track: Track) => {
        // Simple open in Spotify for now
        const url = track.external_urls?.spotify || `https://open.spotify.com/track/${track.id}`;
        window.open(url, '_blank');
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background-light dark:bg-background-dark flex flex-col font-display text-foreground">
                <Header />
                <div className="flex-1 flex items-center justify-center">
                    <div className="animate-pulse flex flex-col items-center gap-4">
                        <div className="w-48 h-48 bg-surface-light dark:bg-surface-dark rounded-xl"></div>
                        <div className="h-8 w-64 bg-surface-light dark:bg-surface-dark rounded-md"></div>
                    </div>
                </div>
            </div>
        );
    }

    if (error || !playlist) {
        return (
            <div className="min-h-screen bg-background-light dark:bg-background-dark flex flex-col font-display text-foreground">
                <Header />
                <div className="flex-1 flex flex-col items-center justify-center gap-4 p-4 text-center">
                    <span className="material-symbols-outlined text-6xl text-muted-foreground">broken_image</span>
                    <h1 className="text-2xl font-bold">{error || "Mix not found"}</h1>
                    <Link href="/discover">
                        <button className="px-6 py-2 bg-primary text-white rounded-full font-bold hover:opacity-90 transition-opacity">
                            Back to Discover
                        </button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background-light dark:bg-background-dark flex flex-col font-display text-foreground">
            <Header />

            <main className="flex-1 max-w-4xl mx-auto w-full p-4 pb-20">
                <Link href="/discover" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors">
                    <span className="material-symbols-outlined">arrow_back</span>
                    Back to Discover
                </Link>

                <div className="flex flex-col md:flex-row gap-8 items-start">
                    {/* Cover Art */}
                    <div className="w-full md:w-80 shrink-0">
                        <div className="aspect-square relative rounded-2xl overflow-hidden shadow-2xl bg-black/5">
                            <img
                                src={playlist.coverImage || '/placeholder.png'}
                                alt={playlist.name}
                                className="w-full h-full object-cover"
                            />
                        </div>

                        {/* Creator Card */}
                        <div className="mt-6 p-4 rounded-xl bg-surface-light dark:bg-surface-dark border border-foreground/5 flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full overflow-hidden bg-primary/10">
                                {playlist.user.avatarUrl ? (
                                    <img src={playlist.user.avatarUrl} alt={playlist.user.username} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center font-bold text-primary">
                                        {playlist.user.username[0]}
                                    </div>
                                )}
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground uppercase font-bold">Curated by</p>
                                <p className="font-bold text-lg">@{playlist.user.username}</p>
                            </div>
                        </div>
                    </div>

                    {/* Info & Tracks */}
                    <div className="flex-1 min-w-0 w-full">
                        <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-2 leading-tight">
                            {playlist.name}
                        </h1>
                        <div className="flex items-center gap-3 mb-6">
                            <span className="text-sm bg-primary/10 text-primary px-3 py-1 rounded-full font-medium">
                                {playlist.mood || 'Mix'}
                            </span>
                            <span className="text-sm text-muted-foreground">
                                {new Date(playlist.createdAt).toLocaleDateString()}
                            </span>
                        </div>

                        <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                            {playlist.description || "No description provided."}
                        </p>

                        <div className="space-y-2">
                            <h3 className="font-bold text-xl mb-4">Tracks ({playlist.tracks.length})</h3>
                            {playlist.tracks.map((track, index) => (
                                <div
                                    key={track.id || index}
                                    onClick={() => handlePlayTrack(track)}
                                    className="flex items-center gap-4 p-3 rounded-xl hover:bg-foreground/5 transition-colors cursor-pointer group"
                                >
                                    <span className="text-muted-foreground w-6 text-center font-medium text-sm">{index + 1}</span>
                                    <div className="w-12 h-12 rounded-md overflow-hidden bg-black/10 shrink-0 relative">
                                        <img
                                            src={track.image || track.album?.images?.[0]?.url || '/placeholder.png'}
                                            alt={track.name}
                                            className="w-full h-full object-cover"
                                        />
                                        <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <span className="material-symbols-outlined text-white">play_arrow</span>
                                        </div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold truncate group-hover:text-primary transition-colors">{track.name}</p>
                                        <p className="text-sm text-muted-foreground truncate">{track.artist || track.artists?.map(a => a.name).join(', ')}</p>
                                    </div>
                                    <div className="text-sm text-muted-foreground font-variant-numeric tabular-nums">
                                        {Math.floor(track.duration_ms / 60000)}:{((track.duration_ms % 60000) / 1000).toFixed(0).padStart(2, '0')}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
