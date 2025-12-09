"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/Header';
import { useAuth } from '@/context/AuthContext';

interface SwipeRecord {
    id: string;
    songName: string;
    artistName: string;
    action: 'LIKE' | 'DISLIKE' | 'SUPERLIKE';
    created_at: string;
}

export default function ProfilePage() {
    const { user, logout, loading: authLoading } = useAuth();
    const router = useRouter();
    const [history, setHistory] = useState<SwipeRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/auth');
        }
    }, [user, authLoading, router]);

    useEffect(() => {
        if (user) {
            fetchHistory();
        }
    }, [user]);

    const fetchHistory = async () => {
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:4000';
            const res = await fetch(`${apiUrl}/api/user/history`, { credentials: 'include' });
            if (res.ok) {
                const data = await res.json();
                setHistory(data.history);
            }
        } catch (error) {
            console.error('Failed to load history', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:4000';
            const res = await fetch(`${apiUrl}/api/user/history/${id}`, {
                method: 'DELETE',
                credentials: 'include'
            });

            if (res.ok) {
                setHistory(prev => prev.filter(item => item.id !== id));
            }
        } catch (error) {
            console.error('Failed to delete', error);
        }
    };

    if (authLoading || (!user && isLoading)) return null;

    return (
        <div className="min-h-screen bg-background-light dark:bg-background-dark flex flex-col font-display text-foreground">
            <Header />

            <main className="flex-1 max-w-2xl mx-auto w-full p-4 space-y-8">

                {/* Profile Header */}
                <div className="flex flex-col items-center gap-4 py-8">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-primary to-secondary p-[3px]">
                        <div className="w-full h-full rounded-full bg-surface-light dark:bg-surface-dark flex items-center justify-center">
                            <span className="text-4xl font-bold uppercase">{user?.email[0]}</span>
                        </div>
                    </div>
                    <div className="text-center">
                        <h2 className="text-2xl font-bold">{user?.email}</h2>
                        <p className="text-muted-foreground">Swipe Master</p>
                    </div>
                    <button
                        onClick={() => {
                            logout();
                            router.push('/');
                        }}
                        className="px-6 py-2 rounded-full border border-red-500/50 text-red-500 hover:bg-red-500/10 transition-colors text-sm font-bold"
                    >
                        Logout
                    </button>
                </div>

                {/* Statistics (Simple) */}
                <div className="grid grid-cols-3 gap-4">
                    <div className="bg-surface-light dark:bg-surface-dark p-4 rounded-2xl text-center">
                        <div className="text-2xl font-bold text-green-500">
                            {history.filter(h => h.action === 'LIKE').length}
                        </div>
                        <div className="text-xs text-muted-foreground uppercase tracking-wider">Likes</div>
                    </div>
                    <div className="bg-surface-light dark:bg-surface-dark p-4 rounded-2xl text-center">
                        <div className="text-2xl font-bold text-blue-500">
                            {history.filter(h => h.action === 'SUPERLIKE').length}
                        </div>
                        <div className="text-xs text-muted-foreground uppercase tracking-wider">Supers</div>
                    </div>
                    <div className="bg-surface-light dark:bg-surface-dark p-4 rounded-2xl text-center">
                        <div className="text-2xl font-bold text-red-500">
                            {history.filter(h => h.action === 'DISLIKE').length}
                        </div>
                        <div className="text-xs text-muted-foreground uppercase tracking-wider">Dislikes</div>
                    </div>
                </div>

                {/* History List */}
                <div className="space-y-4">
                    <h3 className="text-xl font-bold px-2">Swipe History</h3>
                    <div className="flex flex-col gap-2">
                        {history.map((item) => (
                            <div key={item.id} className="group flex items-center justify-between p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors">
                                <div className="flex flex-col">
                                    <span className="font-bold text-base">{item.songName}</span>
                                    <span className="text-sm text-muted-foreground">{item.artistName}</span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className={`text-xs font-bold px-2 py-1 rounded-md uppercase ${item.action === 'LIKE' ? 'bg-green-500/20 text-green-500' :
                                            item.action === 'SUPERLIKE' ? 'bg-blue-500/20 text-blue-500' :
                                                'bg-red-500/20 text-red-500'
                                        }`}>
                                        {item.action}
                                    </span>
                                    <button
                                        onClick={() => handleDelete(item.id)}
                                        className="opacity-0 group-hover:opacity-100 p-2 text-muted-foreground hover:text-red-500 transition-all"
                                        title="Remove from history"
                                    >
                                        <span className="material-symbols-outlined text-lg">delete</span>
                                    </button>
                                </div>
                            </div>
                        ))}
                        {history.length === 0 && (
                            <div className="text-center py-12 text-muted-foreground">
                                No swipes yet. Go start swiping!
                            </div>
                        )}
                    </div>
                </div>

            </main>
        </div>
    );
}
