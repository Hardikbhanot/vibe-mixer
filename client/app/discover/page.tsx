"use client";

import { useEffect, useState } from 'react';
import { Header } from '@/components/Header';
import Link from 'next/link';

interface PublicPlaylist {
    id: string;
    name: string;
    description: string | null;
    coverImage: string | null;
    mood: string | null;
    isPublic: boolean;
    createdAt: string;
    user: {
        username: string;
        avatarUrl: string | null;
    };
    tracks: any[];
}

export default function DiscoverPage() {
    const [playlists, setPlaylists] = useState<PublicPlaylist[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchCommunity();
    }, []);

    const fetchCommunity = async () => {
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:4000';
            // Switched to public playlists endpoint
            const res = await fetch(`${apiUrl}/api/playlists/public`);
            if (res.ok) {
                const data = await res.json();
                setPlaylists(data.playlists);
            }
        } catch (error) {
            console.error('Failed to load community', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background-light dark:bg-background-dark flex flex-col font-display text-foreground">
            <Header />

            <main className="flex-1 max-w-6xl mx-auto w-full p-4 pb-20 space-y-8">

                {/* Hero Section */}
                <div className="text-center py-10 space-y-4">
                    <h1 className="text-4xl md:text-5xl font-black tracking-tight bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                        Community Vibes
                    </h1>
                    <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                        Explore mixes curated by the VibeMixer community. Listen, get inspired, and vibe along.
                    </p>
                </div>

                {/* Mixes Grid */}
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div key={i} className="h-64 rounded-3xl bg-surface-light dark:bg-surface-dark animate-pulse"></div>
                        ))}
                    </div>
                ) : playlists.length === 0 ? (
                    <div className="text-center py-20 bg-surface-light dark:bg-surface-dark rounded-3xl border border-dashed border-foreground/10">
                        <p className="text-muted-foreground">No public mixes yet. Be the first to share your vibe!</p>
                        <Link href="/profile">
                            <button className="mt-4 px-6 py-2 bg-primary/10 text-primary font-bold rounded-full hover:bg-primary/20 transition-colors">
                                Go to Profile
                            </button>
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {playlists.map((playlist) => (
                            // Link to the specific mix page
                            <Link key={playlist.id} href={`/mix/${playlist.id}`} className="block">
                                <div className="group relative bg-surface-light dark:bg-surface-dark rounded-3xl overflow-hidden hover:shadow-xl transition-all border border-foreground/5 hover:border-primary/20 flex flex-col h-full hover:-translate-y-1">

                                    {/* Cover Image with Play Overlay */}
                                    <div className="aspect-square relative overflow-hidden bg-black/5">
                                        <img
                                            src={playlist.coverImage || '/placeholder.png'}
                                            alt={playlist.name}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                        />
                                        {/* Creator Badge Top Left */}
                                        <Link href={`/u/${playlist.user.username}`} onClick={(e) => e.stopPropagation()}>
                                            <div className="absolute top-3 left-3 flex items-center gap-2 bg-black/60 backdrop-blur-md rounded-full pl-1 pr-3 py-1 cursor-pointer hover:bg-black/80 transition-colors z-10">
                                                <div className="w-6 h-6 rounded-full overflow-hidden bg-white/10">
                                                    {playlist.user.avatarUrl ? (
                                                        <img src={playlist.user.avatarUrl} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-white bg-primary">
                                                            {playlist.user.username[0]}
                                                        </div>
                                                    )}
                                                </div>
                                                <span className="text-xs font-bold text-white">@{playlist.user.username}</span>
                                            </div>
                                        </Link>

                                        {/* Play Button Visual Overlay */}
                                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                                            <span className="material-symbols-outlined text-white text-5xl drop-shadow-lg scale-90 group-hover:scale-100 transition-transform">play_circle</span>
                                        </div>
                                    </div>

                                    <div className="p-5 flex-1 flex flex-col">
                                        <div className="flex justify-between items-start mb-2">
                                            <h3 className="font-bold text-xl truncate pr-2">{playlist.name}</h3>
                                            <span className="text-[10px] text-muted-foreground border border-foreground/10 px-2 py-1 rounded-full whitespace-nowrap shrink-0">
                                                {new Date(playlist.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>

                                        <p className="text-sm text-muted-foreground line-clamp-2 mb-4 flex-1">
                                            {playlist.description || "No description provided."}
                                        </p>

                                        <div className="flex items-center justify-between pt-4 border-t border-foreground/5">
                                            <div className="flex gap-2">
                                                <span className="text-xs bg-primary/5 text-primary px-2 py-1 rounded-md font-medium">
                                                    {playlist.tracks.length} Tracks
                                                </span>
                                                {playlist.mood && (
                                                    <span className="text-xs bg-secondary/5 text-secondary px-2 py-1 rounded-md font-medium capitalize">
                                                        {playlist.mood}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}

            </main>
        </div>
    );
}
