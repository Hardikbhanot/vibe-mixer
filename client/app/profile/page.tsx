"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/Header';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import Link from 'next/link';

// --- Types ---
interface SwipeRecord {
    id: string;
    songName: string;
    artistName: string;
    action: 'LIKE' | 'DISLIKE' | 'SUPERLIKE';
    created_at: string;
}

interface SavedPlaylist {
    id: number;
    name: string;
    description: string;
    coverImage: string;
    createdAt: string;
    tracks: any[];
}

export default function ProfilePage() {
    const { user, logout, loading: authLoading } = useAuth();
    const router = useRouter();
    
    // --- State ---
    const [history, setHistory] = useState<SwipeRecord[]>([]);
    const [playlists, setPlaylists] = useState<SavedPlaylist[]>([]);
    const [activeTab, setActiveTab] = useState<'playlists' | 'history'>('playlists');
    const [isLoading, setIsLoading] = useState(true);

    // --- Auth Check ---
    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/auth');
        }
    }, [user, authLoading, router]);

    // --- Data Fetching ---
    useEffect(() => {
        if (user) {
            Promise.all([fetchSwipes(), fetchPlaylists()]).finally(() => setIsLoading(false));
        }
    }, [user]);

    const fetchSwipes = async () => {
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:4000';
            const res = await fetch(`${apiUrl}/api/user/history`, { credentials: 'include' });
            if (res.ok) {
                const data = await res.json();
                setHistory(data.history);
            }
        } catch (error) {
            console.error('Failed to load swipes', error);
        }
    };

    const fetchPlaylists = async () => {
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:4000';
            const token = localStorage.getItem('token'); // Need JWT for this new route
            if (!token) return;

            const res = await fetch(`${apiUrl}/api/playlists`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setPlaylists(data);
            }
        } catch (error) {
            console.error('Failed to load playlists', error);
        }
    };

    // --- Actions ---
    const deleteSwipe = async (id: string) => {
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:4000';
            const res = await fetch(`${apiUrl}/api/user/history/${id}`, {
                method: 'DELETE',
                credentials: 'include'
            });
            if (res.ok) {
                setHistory(prev => prev.filter(item => item.id !== id));
                toast.success("Removed from history");
            }
        } catch (error) {
            toast.error("Failed to delete");
        }
    };

    const deletePlaylist = async (e: React.MouseEvent, id: number) => {
        e.stopPropagation();
        if(!confirm("Delete this mix forever?")) return;

        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:4000';
            const token = localStorage.getItem('token');
            await fetch(`${apiUrl}/api/playlists/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setPlaylists(prev => prev.filter(p => p.id !== id));
            toast.success("Mix deleted");
        } catch (err) {
            toast.error("Failed to delete mix");
        }
    };

    const loadPlaylist = (playlist: SavedPlaylist) => {
        const totalDuration = Math.round(playlist.tracks.reduce((acc: number, t: any) => acc + t.duration_ms, 0) / 60000);

        const playlistData = {
            playlist_name: playlist.name,
            playlist_description: playlist.description,
            cover_art_description: playlist.name,
            tracks: playlist.tracks,
            total_duration_mins: totalDuration,
            isGuest: false
        };

        localStorage.setItem('playlistData', JSON.stringify(playlistData));
        if (playlist.coverImage) localStorage.setItem('userImage', playlist.coverImage);
        
        router.push('/results');
    };

    if (authLoading || (!user && isLoading)) return <div className="min-h-screen flex items-center justify-center">Loading Profile...</div>;

    return (
        <div className="min-h-screen bg-background-light dark:bg-background-dark flex flex-col font-display text-foreground">
            <Header />

            <main className="flex-1 max-w-4xl mx-auto w-full p-4 space-y-8 pb-20">

                {/* --- Profile Header --- */}
                <div className="flex flex-col items-center gap-4 py-8">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-primary to-secondary p-[3px]">
                        <div className="w-full h-full rounded-full bg-surface-light dark:bg-surface-dark flex items-center justify-center overflow-hidden">
                            <span className="text-4xl font-bold uppercase select-none">{user?.email[0]}</span>
                        </div>
                    </div>
                    <div className="text-center">
                        <h2 className="text-2xl font-bold">{user?.email}</h2>
                        <p className="text-muted-foreground text-sm">Vibe Curator</p>
                    </div>
                    
                    {/* Stats Row */}
                    <div className="flex gap-6 mt-2">
                        <div className="text-center">
                            <div className="text-xl font-bold">{playlists.length}</div>
                            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Mixes</div>
                        </div>
                        <div className="w-[1px] h-8 bg-foreground/10"></div>
                        <div className="text-center">
                            <div className="text-xl font-bold">{history.length}</div>
                            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Swipes</div>
                        </div>
                    </div>

                    <button
                        onClick={() => { logout(); router.push('/'); }}
                        className="mt-2 text-xs font-bold text-red-500 hover:text-red-600 hover:bg-red-500/5 px-4 py-2 rounded-full transition-colors"
                    >
                        Sign Out
                    </button>
                </div>

                {/* --- Tab Navigation --- */}
                <div className="flex p-1 bg-surface-light dark:bg-surface-dark rounded-xl mx-auto max-w-sm">
                    <button
                        onClick={() => setActiveTab('playlists')}
                        className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
                            activeTab === 'playlists' 
                            ? 'bg-background-light dark:bg-background-dark shadow-sm text-primary' 
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        My Mixes
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
                            activeTab === 'history' 
                            ? 'bg-background-light dark:bg-background-dark shadow-sm text-primary' 
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        Swipe History
                    </button>
                </div>

                {/* --- Tab Content: PLAYLISTS --- */}
                {activeTab === 'playlists' && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                        {playlists.length === 0 ? (
                            <div className="text-center py-20 border-2 border-dashed border-foreground/10 rounded-2xl">
                                <p className="text-lg font-medium mb-4">No mixes saved yet.</p>
                                <Link href="/generate">
                                    <button className="px-6 py-2 bg-primary text-white rounded-full font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-transform">
                                        Create New Vibe
                                    </button>
                                </Link>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {playlists.map((playlist) => (
                                    <div 
                                        key={playlist.id} 
                                        onClick={() => loadPlaylist(playlist)}
                                        className="group relative bg-surface-light dark:bg-surface-dark rounded-2xl overflow-hidden cursor-pointer hover:shadow-xl transition-all border border-transparent hover:border-primary/20"
                                    >
                                        <div className="aspect-square relative overflow-hidden bg-black/5">
                                            <img 
                                                src={playlist.coverImage || '/placeholder.png'} 
                                                alt={playlist.name}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                            />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <span className="material-symbols-outlined text-white text-5xl drop-shadow-lg">play_circle</span>
                                            </div>
                                            {/* Date Badge */}
                                            <div className="absolute top-2 left-2 bg-black/40 backdrop-blur-md text-[10px] text-white px-2 py-1 rounded-full">
                                                {new Date(playlist.createdAt).toLocaleDateString()}
                                            </div>
                                        </div>

                                        <div className="p-4">
                                            <h3 className="font-bold text-base truncate pr-6">{playlist.name}</h3>
                                            <p className="text-xs text-muted-foreground line-clamp-2 mt-1 h-8 leading-relaxed">
                                                {playlist.description}
                                            </p>
                                        </div>

                                        <button 
                                            onClick={(e) => deletePlaylist(e, playlist.id)}
                                            className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center bg-black/50 hover:bg-red-500 rounded-full text-white opacity-0 group-hover:opacity-100 transition-all z-10"
                                        >
                                            <span className="material-symbols-outlined text-base">delete</span>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* --- Tab Content: SWIPE HISTORY --- */}
                {activeTab === 'history' && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 space-y-4">
                        {/* Quick Stats for Swipes */}
                        <div className="grid grid-cols-3 gap-3 mb-6">
                            <div className="bg-surface-light dark:bg-surface-dark p-3 rounded-xl text-center border border-green-500/10">
                                <div className="text-xl font-bold text-green-500">{history.filter(h => h.action === 'LIKE').length}</div>
                                <div className="text-[10px] uppercase text-muted-foreground">Likes</div>
                            </div>
                            <div className="bg-surface-light dark:bg-surface-dark p-3 rounded-xl text-center border border-blue-500/10">
                                <div className="text-xl font-bold text-blue-500">{history.filter(h => h.action === 'SUPERLIKE').length}</div>
                                <div className="text-[10px] uppercase text-muted-foreground">Superlikes</div>
                            </div>
                            <div className="bg-surface-light dark:bg-surface-dark p-3 rounded-xl text-center border border-red-500/10">
                                <div className="text-xl font-bold text-red-500">{history.filter(h => h.action === 'DISLIKE').length}</div>
                                <div className="text-[10px] uppercase text-muted-foreground">Dislikes</div>
                            </div>
                        </div>

                        {history.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground">
                                No swipe history found. Go to <Link href="/swipe" className="text-primary hover:underline">Swipe Mode</Link>!
                            </div>
                        ) : (
                            <div className="flex flex-col gap-2">
                                {history.map((item) => (
                                    <div key={item.id} className="group flex items-center justify-between p-3 bg-surface-light dark:bg-surface-dark rounded-xl hover:bg-primary/5 transition-colors border border-transparent hover:border-primary/10">
                                        <div className="flex flex-col overflow-hidden">
                                            <span className="font-bold text-sm truncate">{item.songName}</span>
                                            <span className="text-xs text-muted-foreground truncate">{item.artistName}</span>
                                        </div>
                                        <div className="flex items-center gap-3 shrink-0">
                                            <span className={`text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider ${
                                                item.action === 'LIKE' ? 'bg-green-500/10 text-green-500' :
                                                item.action === 'SUPERLIKE' ? 'bg-blue-500/10 text-blue-500' :
                                                'bg-red-500/10 text-red-500'
                                            }`}>
                                                {item.action}
                                            </span>
                                            <button
                                                onClick={() => deleteSwipe(item.id)}
                                                className="text-muted-foreground hover:text-red-500 transition-colors p-1"
                                                title="Remove"
                                            >
                                                <span className="material-symbols-outlined text-lg">close</span>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

            </main>
        </div>
    );
}