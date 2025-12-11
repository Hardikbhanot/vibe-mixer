"use client";

import { useEffect, useState } from 'react';
import { Header } from '@/components/Header';
import Link from 'next/link';

interface DiscoverUser {
    id: string;
    username: string;
    bio: string | null;
    topArtists: any;
    _count: {
        playlists: number;
    };
}

export default function DiscoverPage() {
    const [users, setUsers] = useState<DiscoverUser[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchCommunity();
    }, []);

    const fetchCommunity = async () => {
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:4000';
            const res = await fetch(`${apiUrl}/api/user/discover`);
            if (res.ok) {
                const data = await res.json();
                setUsers(data.users);
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
                        Discover the Vibe
                    </h1>
                    <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                        Explore the musical identities of the VibeMixer community. Connect with curators who match your energy.
                    </p>
                </div>

                {/* Users Grid */}
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div key={i} className="h-48 rounded-3xl bg-surface-light dark:bg-surface-dark animate-pulse"></div>
                        ))}
                    </div>
                ) : users.length === 0 ? (
                    <div className="text-center py-20 bg-surface-light dark:bg-surface-dark rounded-3xl border border-dashed border-foreground/10">
                        <p className="text-muted-foreground">No public profiles found yet. Be the first!</p>
                        <Link href="/profile">
                            <button className="mt-4 px-6 py-2 bg-primary/10 text-primary font-bold rounded-full hover:bg-primary/20 transition-colors">
                                Create Public Profile
                            </button>
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {users.map((user) => (
                            <Link key={user.id} href={`/u/${user.username}`}>
                                <div className="group relative p-6 rounded-3xl bg-surface-light dark:bg-surface-dark border border-foreground/5 hovering-card transition-all hover:border-primary/20 hover:shadow-xl hover:-translate-y-1">

                                    <div className="flex items-start gap-4">
                                        {/* Avatar */}
                                        <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-primary to-secondary p-[2px] shrink-0">
                                            <div className="w-full h-full rounded-full bg-background-light dark:bg-background-dark flex items-center justify-center font-bold text-xl uppercase">
                                                {user.username[0]}
                                            </div>
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-bold text-lg truncate">@{user.username}</h3>
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                                                <span className="material-symbols-outlined text-[14px]">queue_music</span>
                                                {user._count.playlists} Mixes
                                            </div>
                                        </div>
                                    </div>

                                    {/* Bio Snippet */}
                                    <p className="mt-4 text-sm text-muted-foreground line-clamp-2 min-h-[2.5em]">
                                        {user.bio || "No bio yet."}
                                    </p>

                                    {/* Top Artists (Cached) - Placeholder logic if field is null */}
                                    <div className="mt-4 pt-4 border-t border-foreground/5 flex items-center gap-2 overflow-hidden">
                                        <span className="text-[10px] uppercase font-bold text-muted-foreground shrink-0">Vibe:</span>
                                        <div className="flex gap-1">
                                            {/* Mock tags if no real data yet */}
                                            <span className="px-2 py-0.5 bg-foreground/5 rounded-md text-[10px]">Eclectic</span>
                                            <span className="px-2 py-0.5 bg-foreground/5 rounded-md text-[10px]">Chill</span>
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
