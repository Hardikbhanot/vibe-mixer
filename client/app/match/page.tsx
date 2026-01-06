"use client";

import { useEffect, useState } from 'react';
import { Header } from '@/components/Header';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { toast } from 'sonner';

interface MatchUser {
    id: string;
    username: string;
    avatarUrl: string;
    bio: string;
    vibeTags: string[];
}

interface MatchResult {
    user: MatchUser;
    score: number;
    sharedArtists: { name: string }[];
}

export default function MatchPage() {
    const { user, loading: authLoading } = useAuth();
    const [matches, setMatches] = useState<MatchResult[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user && !authLoading) {
            fetchMatches();
        }
    }, [user, authLoading]);

    const fetchMatches = async () => {
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:4000';
            const res = await fetch(`${apiUrl}/api/match`, { credentials: 'include' });
            if (res.ok) {
                const data = await res.json();
                setMatches(data.matches);
            } else {
                toast.error("Failed to load matches");
            }
        } catch (error) {
            console.error(error);
            toast.error("Network error");
        } finally {
            setLoading(false);
        }
    };

    if (authLoading) return null;

    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark">
                <div className="text-center">
                    <h2 className="text-2xl font-bold mb-4">Login to Find Your Vibe Twin</h2>
                    <Link href="/auth">
                        <button className="px-6 py-2 bg-primary text-white rounded-full">Login</button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background-light dark:bg-background-dark flex flex-col font-display text-foreground">
            <Header />

            <main className="flex-1 max-w-6xl mx-auto w-full p-4 pb-20 space-y-8">
                {/* Hero */}
                <div className="text-center py-10 space-y-4">
                    <h1 className="text-4xl md:text-6xl font-black tracking-tight bg-gradient-to-r from-pink-500 to-violet-500 bg-clip-text text-transparent animate-gradient">
                        Vibe Match
                    </h1>
                    <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                        We analyzed your music taste. Here are the people who vibe on your frequency. 🌊
                    </p>
                </div>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                    </div>
                ) : matches.length === 0 ? (
                    <div className="text-center py-20 bg-surface-light dark:bg-surface-dark rounded-3xl border border-dashed border-foreground/10">
                        <p className="text-xl font-bold mb-2">No matches found... yet.</p>
                        <p className="text-muted-foreground max-w-md mx-auto mb-6">
                            Try listening to more music on Spotify to update your profile, or wait for more users to join!
                        </p>
                        <Link href="/profile">
                            <button className="px-6 py-2 bg-primary/10 text-primary font-bold rounded-full hover:bg-primary/20 transition-colors">
                                Check Your Profile Settings
                            </button>
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {matches.map((match) => (
                            <Link key={match.user.id} href={`/u/${match.user.username}`} className="group block">
                                <div className="relative bg-surface-light dark:bg-surface-dark rounded-3xl overflow-hidden hover:shadow-xl transition-all border border-foreground/5 hover:border-primary/20 hover:-translate-y-1 h-full flex flex-col">

                                    {/* Match Score Badge */}
                                    <div className="absolute top-4 right-4 z-10 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
                                        <div className="flex items-center gap-1">
                                            <span className="text-sm font-black text-green-400">{match.score}%</span>
                                            <span className="text-[10px] font-medium text-white/80">MATCH</span>
                                        </div>
                                    </div>

                                    {/* Avatar Header */}
                                    <div className="h-32 bg-gradient-to-br from-primary/20 to-secondary/20 relative">
                                        <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-24 h-24 rounded-full p-1 bg-surface-light dark:bg-surface-dark">
                                            <div className="w-full h-full rounded-full overflow-hidden bg-gray-200">
                                                {match.user.avatarUrl ? (
                                                    <img src={match.user.avatarUrl} alt={match.user.username} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full bg-primary flex items-center justify-center text-white text-2xl font-bold">
                                                        {match.user.username[0]}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-12 p-6 text-center flex-1 flex flex-col">
                                        <h3 className="font-bold text-xl">@{match.user.username}</h3>
                                        <p className="text-sm text-muted-foreground line-clamp-2 mt-2 min-h-[2.5em]">
                                            {match.user.bio || "No bio yet."}
                                        </p>

                                        {match.user.vibeTags && match.user.vibeTags.length > 0 && (
                                            <div className="flex flex-wrap justify-center gap-2 mt-4">
                                                {match.user.vibeTags.slice(0, 3).map((tag, i) => (
                                                    <span key={i} className="text-[10px] uppercase font-bold px-2 py-1 bg-foreground/5 rounded-md">
                                                        {tag}
                                                    </span>
                                                ))}
                                            </div>
                                        )}

                                        <div className="mt-6 pt-4 border-t border-foreground/5">
                                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">
                                                You Both Like
                                            </p>
                                            <div className="flex flex-wrap justify-center gap-2">
                                                {match.sharedArtists.map((artist, i) => (
                                                    <span key={i} className="text-xs px-3 py-1.5 rounded-full bg-primary/10 text-primary font-medium">
                                                        {artist.name}
                                                    </span>
                                                ))}
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
