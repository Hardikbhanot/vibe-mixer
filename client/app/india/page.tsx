"use client";

import React, { useState } from "react";
import Link from "next/link";
import IndiaMap from "@/components/IndiaMap";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function IndiaVibePage() {
    const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
    const [videos, setVideos] = useState<any[]>([]);
    const [currentVideo, setCurrentVideo] = useState<any | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [creatingPlaylist, setCreatingPlaylist] = useState(false);

    const handleRegionSelect = async (region: string) => {
        setSelectedRegion(region);
        setLoading(true);
        setError(null);
        setVideos([]);
        setCurrentVideo(null);

        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:4000';
            const response = await fetch(`${apiUrl}/youtube/region-vibe?region=${encodeURIComponent(region)}`);
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.details || errorData.error || "Failed to fetch regional vibe");
            }
            const data = await response.json();
            if (data.videos && data.videos.length > 0) {
                setVideos(data.videos);
                setCurrentVideo(data.videos[0]);
            } else {
                setError("No vibe found for this region.");
            }
        } catch (err: any) {
            console.error(err);
            setError(err.message || "Failed to load vibe. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleCreatePlaylist = async () => {
        if (!videos.length || !selectedRegion) return;
        setCreatingPlaylist(true);
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:4000';
            const response = await fetch(`${apiUrl}/youtube/playlist`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: `${selectedRegion} Vibes - VibeMixer`,
                    description: `Top songs from ${selectedRegion} curated by VibeMixer.`,
                    tracks: videos.map(v => ({ name: v.title, artists: [{ name: v.channelTitle }] })) // Mocking track structure for existing endpoint
                }),
                credentials: 'include'
            });

            if (response.status === 401) {
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:4000';
                window.location.href = `${apiUrl}/auth/google`;
                return;
            }

            if (!response.ok) throw new Error('Failed to create playlist');

            const result = await response.json();
            alert('Playlist created successfully! Check your YouTube account.');
            window.open(result.playlistUrl, '_blank');
        } catch (error) {
            console.error('Error creating playlist:', error);
            alert('Failed to create playlist.');
        } finally {
            setCreatingPlaylist(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-background-light dark:bg-background-dark text-foreground transition-colors duration-300">
            {/* Header */}
            <header className="flex items-center p-4 justify-between sticky top-0 z-10 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-sm border-b border-border">
                <Link
                    href="/"
                    className="flex items-center justify-center size-10 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                >
                    <span className="material-symbols-outlined text-2xl">home</span>
                </Link>
                <div className="flex items-center gap-2">
                    <img src="/logo.png" alt="Logo" className="w-8 h-8 object-contain" />
                    <h1 className="text-xl font-bold">Indian Vibe Map</h1>
                </div>
                <ThemeToggle />
            </header>

            <main className="flex-1 flex flex-col md:flex-row p-4 gap-6 max-w-7xl mx-auto w-full h-[calc(100vh-80px)]">
                {/* Map Section */}
                <div className="flex-1 flex flex-col bg-card rounded-2xl shadow-sm border border-border overflow-hidden relative">
                    <div className="absolute top-4 left-4 z-10 w-64">
                        <div className="relative group">
                            <span className="absolute left-3 top-2.5 material-symbols-outlined text-muted-foreground group-focus-within:text-primary transition-colors">search</span>
                            <input
                                type="text"
                                placeholder="Search your state..."
                                className="w-full pl-10 pr-4 py-2 bg-background/80 backdrop-blur-md border border-border rounded-full text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/50 shadow-sm transition-all"
                                onChange={(e) => {
                                    // Simple logic: if enter is pressed or match found?
                                    // Actually, a datalist or suggestion list is better.
                                    // For now, let's implement a simple suggestion dropdown.
                                }}
                                list="indian-states"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        const val = (e.target as HTMLInputElement).value;
                                        if (val) handleRegionSelect(val);
                                    }
                                }}
                            />
                            <datalist id="indian-states">
                                {['Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Puducherry'].map(s => (
                                    <option key={s} value={s} />
                                ))}
                            </datalist>
                        </div>
                    </div>
                    <IndiaMap onRegionSelect={handleRegionSelect} />
                </div>

                {/* Player & List Section */}
                <div className="w-full md:w-[400px] flex flex-col gap-4 shrink-0 h-full overflow-hidden">
                    <div className="bg-card rounded-2xl shadow-sm border border-border p-4 flex flex-col gap-4 h-full">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold truncate">
                                {selectedRegion ? `${selectedRegion} Vibes` : "Select a Region"}
                            </h2>
                            {videos.length > 0 && (
                                <button
                                    onClick={handleCreatePlaylist}
                                    disabled={creatingPlaylist}
                                    className="text-xs bg-red-600 text-white px-3 py-1.5 rounded-full font-medium hover:bg-red-700 disabled:opacity-50 flex items-center gap-1"
                                >
                                    {creatingPlaylist ? 'Saving...' : 'Save Playlist'}
                                </button>
                            )}
                        </div>

                        {loading ? (
                            <div className="flex-1 flex items-center justify-center">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                            </div>
                        ) : error ? (
                            <div className="flex-1 flex items-center justify-center text-red-500 text-center px-4">
                                {error}
                            </div>
                        ) : currentVideo ? (
                            <div className="flex flex-col gap-4 h-full overflow-hidden">
                                {/* Main Player */}
                                <div className="aspect-video w-full rounded-xl overflow-hidden shadow-lg bg-black shrink-0">
                                    <iframe
                                        width="100%"
                                        height="100%"
                                        src={`https://www.youtube.com/embed/${currentVideo.id}?autoplay=1`}
                                        title="YouTube video player"
                                        frameBorder="0"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                        allowFullScreen
                                    ></iframe>
                                </div>

                                {/* Video List */}
                                <div className="flex-1 overflow-y-auto flex flex-col gap-2 pr-1">
                                    {videos.map((video) => (
                                        <button
                                            key={video.id}
                                            onClick={() => setCurrentVideo(video)}
                                            className={`flex items-center gap-3 p-2 rounded-lg text-left transition-colors ${currentVideo.id === video.id
                                                ? 'bg-primary/10 border border-primary/20'
                                                : 'hover:bg-black/5 dark:hover:bg-white/5'
                                                }`}
                                        >
                                            <img
                                                src={video.thumbnail}
                                                alt={video.title}
                                                className="w-16 h-9 rounded object-cover shrink-0"
                                            />
                                            <div className="min-w-0">
                                                <p className={`text-sm font-medium truncate ${currentVideo.id === video.id ? 'text-primary' : 'text-foreground'
                                                    }`}>
                                                    {video.title}
                                                </p>
                                                <p className="text-xs text-muted-foreground truncate">
                                                    {video.channelTitle}
                                                </p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground text-center gap-4 opacity-50">
                                <span className="material-symbols-outlined text-6xl">map</span>
                                <p>Click on any state in the map to start listening.</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
