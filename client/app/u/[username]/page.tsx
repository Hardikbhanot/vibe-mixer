"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Header } from '@/components/Header';
import Link from 'next/link';
import { toast } from 'sonner';

interface PublicUser {
    id: string;
    username: string;
    bio: string | null;
    isPublic: boolean;
    topArtists: any; // We'll refine this type
    topTracks: any;
    playlists: any[]; // Public playlists
}

export default function PublicProfilePage() {
    const params = useParams();
    const username = params.username as string;

    const [user, setUser] = useState<PublicUser | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (username) {
            fetchPublicProfile();
        }
    }, [username]);

    const fetchPublicProfile = async () => {
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:4000';
            const res = await fetch(`${apiUrl}/api/user/public/${username}`);

            if (res.ok) {
                const data = await res.json();
                setUser(data.user);
            } else {
                const errData = await res.json();
                setError(errData.error || 'Failed to load profile');
            }
        } catch (err) {
            setError('Network error');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background-light dark:bg-background-dark flex items-center justify-center font-display">
                <div className="animate-pulse flex flex-col items-center gap-4">
                    <div className="w-24 h-24 bg-foreground/10 rounded-full"></div>
                    <div className="h-6 w-32 bg-foreground/10 rounded"></div>
                </div>
            </div>
        );
    }

    if (error || !user) {
        return (
            <div className="min-h-screen bg-background-light dark:bg-background-dark flex flex-col font-display">
                <Header />
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-6">
                    <span className="material-symbols-outlined text-6xl text-muted-foreground">lock_person</span>
                    <h1 className="text-3xl font-bold">{error === 'This profile is private' ? 'This Vibe is Private 🔒' : 'User Not Found 👻'}</h1>
                    <p className="text-muted-foreground max-w-md">
                        {error === 'This profile is private'
                            ? "This user has chosen to keep their musical identity mysterious."
                            : "We couldn't find a vibe curator with that username."}
                    </p>
                    <Link href="/">
                        <button className="px-6 py-3 bg-primary text-white font-bold rounded-full hover:scale-105 transition-transform">
                            Return Home
                        </button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background-light dark:bg-background-dark flex flex-col font-display text-foreground">
            <Header />

            <main className="flex-1 max-w-5xl mx-auto w-full p-4 pb-20">

                {/* --- Profile Banner / Header --- */}
                <div className="relative mt-8 mb-12 p-8 rounded-3xl bg-surface-light dark:bg-surface-dark border border-foreground/5 overflow-hidden">
                    {/* Decorative Background Blur */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-secondary/10 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>

                    <div className="relative z-10 flex flex-col md:flex-row gap-8 items-center md:items-start text-center md:text-left">
                        {/* Avatar */}
                        <div className="w-32 h-32 shrink-0 rounded-full bg-gradient-to-tr from-primary to-secondary p-[4px] shadow-xl">
                            <div className="w-full h-full rounded-full bg-surface-light dark:bg-surface-dark flex items-center justify-center text-5xl font-bold uppercase text-foreground select-none">
                                {user.username[0]}
                            </div>
                        </div>

                        {/* Info */}
                        <div className="flex-1 space-y-4">
                            <div>
                                <h1 className="text-4xl font-black tracking-tight">@{user.username}</h1>
                                <div className="flex items-center justify-center md:justify-start gap-2 mt-1">
                                    <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider border border-primary/20">
                                        Vibe Curator
                                    </span>
                                    {/* Placeholder for future badges */}
                                </div>
                            </div>

                            <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl">
                                {user.bio || "Just vibing through life, one track at a time."}
                            </p>
                        </div>

                        {/* Quick Stats / Action */}
                        <div className="flex flex-col gap-3 min-w-[140px]">
                            <div className="p-4 rounded-2xl bg-background-light dark:bg-background-dark border border-foreground/5 text-center">
                                <span className="block text-2xl font-bold">{user.playlists?.length || 0}</span>
                                <span className="text-xs text-muted-foreground uppercase tracking-wider">Public Mixes</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- Content Grid --- */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Left Column: Top Vibes (Mocked for now until we have real stats) */}
                    <div className="space-y-6">
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary">equalizer</span>
                            Top Vibes
                        </h2>

                        <div className="p-6 rounded-3xl bg-surface-light dark:bg-surface-dark border border-foreground/5 space-y-4">
                            {/* Placeholder Vibe Tags */}
                            <div className="flex flex-wrap gap-2">
                                {['Chill', 'Late Night', 'Indie'].map(tag => (
                                    <span key={tag} className="px-4 py-2 rounded-xl bg-background-light dark:bg-background-dark border border-foreground/10 text-sm font-bold">
                                        #{tag}
                                    </span>
                                ))}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Based on recently created playlists.
                            </p>
                        </div>
                    </div>

                    {/* Right Column: Public Mixes */}
                    <div className="lg:col-span-2 space-y-6">
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <span className="material-symbols-outlined text-secondary">queue_music</span>
                            Public Mixes
                        </h2>

                        {(!user.playlists || user.playlists.length === 0) ? (
                            <div className="p-12 rounded-3xl bg-surface-light dark:bg-surface-dark border border-dashed border-foreground/10 text-center">
                                <p className="text-muted-foreground">This user hasn't published any mixes yet.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {user.playlists.map((playlist: any) => (
                                    <div key={playlist.id} className="group relative aspect-video rounded-2xl overflow-hidden cursor-pointer">
                                        <img
                                            src={playlist.coverImage || '/placeholder.png'}
                                            alt={playlist.name}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                        />
                                        <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors"></div>
                                        <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                                            <h3 className="text-white font-bold truncate">{playlist.name}</h3>
                                            <p className="text-white/70 text-xs line-clamp-1">{playlist.description}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                </div>
            </main>
        </div>
    );
}
