"use client";

import { useEffect, useState } from 'react';
import { Header } from '@/components/Header';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

export default function AdminDashboard() {
    const { user, loading: authLoading } = useAuth();
    const [metrics, setMetrics] = useState<any>(null);
    const [matchTest, setMatchTest] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user && !authLoading) {
            fetchStats();
        }
    }, [user, authLoading]);

    const fetchStats = async () => {
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:4000';

            // 1. Metrics
            const res = await fetch(`${apiUrl}/api/admin/metrics`, { credentials: 'include' });
            if (res.ok) {
                const data = await res.json();
                setMetrics(data);
            } else {
                console.error("Admin Access Denied");
            }

            // 2. Match Test
            const matchRes = await fetch(`${apiUrl}/api/admin/match-test`, { credentials: 'include' });
            if (matchRes.ok) {
                const matchData = await matchRes.json();
                setMatchTest(matchData.distribution);
            }

        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    if (authLoading) return null;
    if (!user) return <div className="text-center py-20">Access Denied</div>;

    return (
        <div className="min-h-screen bg-background-light dark:bg-background-dark flex flex-col font-display text-foreground">
            <Header />

            <main className="flex-1 max-w-6xl mx-auto w-full p-6 pb-20 space-y-8">
                <div className="flex items-center justify-between">
                    <h1 className="text-4xl font-black">Admin Dashboard 👑</h1>
                    <span className="text-sm px-3 py-1 bg-yellow-500/10 text-yellow-500 font-bold rounded-full border border-yellow-500/20">
                        SUPER ADMIN
                    </span>
                </div>

                {loading ? (
                    <div className="animate-pulse space-y-4">
                        <div className="h-32 bg-surface-light dark:bg-surface-dark rounded-xl"></div>
                        <div className="h-64 bg-surface-light dark:bg-surface-dark rounded-xl"></div>
                    </div>
                ) : metrics ? (
                    <>
                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            <StatCard title="Total Users" value={metrics.users.total} icon="group" color="text-blue-500" />
                            <StatCard title="Matchable Users" value={metrics.users.matchable} icon="favorite" color="text-pink-500" />
                            <StatCard title="Public Mixes" value={metrics.playlists.public} icon="album" color="text-green-500" />
                            <StatCard title="Total Likes" value={metrics.engagement.likes} icon="thumb_up" color="text-purple-500" />
                        </div>

                        <div className="grid md:grid-cols-2 gap-8">
                            {/* Match Simulation */}
                            <div className="bg-surface-light dark:bg-surface-dark p-6 rounded-3xl border border-foreground/5">
                                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                                    <span className="material-symbols-outlined">network_node</span>
                                    Match Quality Check (You vs All)
                                </h2>
                                <p className="text-sm text-muted-foreground mb-4">
                                    Simulating match scores between YOU and all matchable users to verify the algorithm.
                                </p>

                                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                                    {matchTest.map((m: any, i: number) => (
                                        <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-background-light dark:bg-background-dark border border-foreground/5">
                                            <span className="font-bold">@{m.username}</span>
                                            <div className="flex items-center gap-2">
                                                <div className="h-2 w-24 bg-gray-200 rounded-full overflow-hidden">
                                                    <div className="h-full bg-primary" style={{ width: `${m.score}%` }}></div>
                                                </div>
                                                <span className="text-sm font-bold w-10 text-right">{m.score}%</span>
                                            </div>
                                        </div>
                                    ))}
                                    {matchTest.length === 0 && <p className="text-muted-foreground">No matchable users found.</p>}
                                </div>
                            </div>

                            {/* Recent Users */}
                            <div className="bg-surface-light dark:bg-surface-dark p-6 rounded-3xl border border-foreground/5">
                                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                                    <span className="material-symbols-outlined">schedule</span>
                                    Newest Vibe Checks
                                </h2>
                                <div className="space-y-3">
                                    {metrics.recentUsers.map((u: any) => (
                                        <div key={u.id} className="flex items-center gap-3">
                                            <div className="size-10 rounded-full bg-gray-200 overflow-hidden">
                                                {u.avatarUrl ? (
                                                    <img src={u.avatarUrl} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full bg-primary flex items-center justify-center text-white font-bold">{u.username?.[0]}</div>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-bold truncate">@{u.username || 'No Username'}</p>
                                                <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                                            </div>
                                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                                                {new Date(u.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="text-center text-red-500">
                        Error loading data. Are you sure you are an Admin?
                    </div>
                )}
            </main>
        </div>
    );
}

function StatCard({ title, value, icon, color }: any) {
    return (
        <div className="bg-surface-light dark:bg-surface-dark p-5 rounded-3xl border border-foreground/5 flex items-center gap-4">
            <div className={`p-3 rounded-full bg-foreground/5 ${color}`}>
                <span className="material-symbols-outlined text-2xl">{icon}</span>
            </div>
            <div>
                <p className="text-sm text-muted-foreground font-medium">{title}</p>
                <p className="text-2xl font-black">{value}</p>
            </div>
        </div>
    );
}
