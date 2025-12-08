"use client";

import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

interface Track {
    id: string;
    name: string;
    artists: { name: string }[];
    album: {
        name: string;
        images: { url: string }[];
    };
    uri: string;
    duration_ms: number;
    external_urls: { spotify: string };
}

interface PlaylistData {
    playlist_name: string;
    playlist_description: string;
    cover_art_description?: string;
    tracks: Track[];
    total_duration_mins?: number;
}

export default function ResultsPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [data, setData] = useState<PlaylistData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isSavingYoutube, setIsSavingYoutube] = useState(false);
    const [coverImage, setCoverImage] = useState<string | null>(null);
    const [isGeneratingImage, setIsGeneratingImage] = useState(false);

    useEffect(() => {
        if (window.location.hostname === 'localhost') {
            window.location.href = window.location.href.replace('localhost', '127.0.0.1');
            return;
        }

        const storedData = localStorage.getItem('playlistData');
        console.log('Retrieved from localStorage:', storedData);

        if (storedData) {
            try {
                const parsed = JSON.parse(storedData);
                console.log('Parsed data:', parsed);
                setData(parsed);

                // Trigger image generation if we have a description
                if (parsed.cover_art_description && !coverImage) {
                    generateCoverImage(parsed.cover_art_description);
                }
            } catch (e) {
                console.error('Failed to parse playlist data', e);
                setError('Failed to load playlist data.');
            }
        } else {
            console.warn('No playlist data found in localStorage');
            setError('No playlist data found. Please try again.');
        }
        setLoading(false);

        // Check for Google Auth success
        const googleConnected = searchParams.get('google_connected');
        if (googleConnected) {
            // Remove the query param to clean up URL
            window.history.replaceState({}, '', '/results');
            // Maybe show a toast?
        }
    }, [searchParams]);

    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

    useEffect(() => {
        if (toast) {
            const timer = setTimeout(() => setToast(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [toast]);

    const generateCoverImage = async (prompt: string) => {
        setIsGeneratingImage(true);
        try {
            const response = await fetch('http://127.0.0.1:4000/ai/image', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt }),
            });
            const result = await response.json();
            if (result.imageUrl) {
                setCoverImage(result.imageUrl);
            } else {
                throw new Error('No image URL returned');
            }
        } catch (error) {
            console.error('Failed to generate image:', error);
            setToast({ message: 'AI generation failed. Using fallback cover.', type: 'error' });
        } finally {
            setIsGeneratingImage(false);
        }
    };

    const handleSaveToSpotify = async () => {
        if (!data) return;
        setIsSaving(true);
        try {
            // Use generated image or fallback to Pollinations URL
            const finalCoverImage = coverImage || `https://image.pollinations.ai/prompt/${encodeURIComponent(data.cover_art_description || data.playlist_name)}?width=512&height=512&nologo=true`;

            const response = await fetch('http://127.0.0.1:4000/spotify/playlist', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: data.playlist_name,
                    trackUris: data.tracks.map(t => t.uri),
                    coverImageUrl: finalCoverImage
                }),
                credentials: 'include'
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || 'Failed to create playlist');
            }

            const result = await response.json();
            setToast({ message: 'Spotify Playlist created successfully!', type: 'success' });
            window.open(result.external_urls.spotify, '_blank');
        } catch (error: any) {
            console.error('Error saving playlist:', error);
            setToast({ message: error.message || 'Failed to save playlist. Check Spotify login.', type: 'error' });
        } finally {
            setIsSaving(false);
        }
    };

    const handleSaveToYoutube = async () => {
        if (!data) return;
        setIsSavingYoutube(true);
        try {
            const response = await fetch('http://127.0.0.1:4000/youtube/playlist', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: data.playlist_name,
                    description: data.playlist_description,
                    tracks: data.tracks
                }),
                credentials: 'include'
            });

            if (response.status === 401) {
                // Redirect to Google Auth
                window.location.href = 'http://127.0.0.1:4000/auth/google';
                return;
            }

            if (!response.ok) throw new Error('Failed to create playlist');

            const result = await response.json();
            alert('YouTube Playlist created successfully!');
            window.open(result.playlistUrl, '_blank');
        } catch (error) {
            console.error('Error saving to YouTube:', error);
            alert('Failed to save playlist.');
        } finally {
            setIsSavingYoutube(false);
        }
    };

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background-light dark:bg-background-dark">
                <div className="text-foreground">Loading...</div>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background-light dark:bg-background-dark p-4">
                <div className="text-red-500">{error || 'Something went wrong'}</div>
                <Link href="/generate">
                    <button className="rounded-full bg-primary px-6 py-2 text-white hover:bg-primary/90">
                        Try Again
                    </button>
                </Link>
            </div>
        );
    }

    // Use state image or fallback
    const displayImage = coverImage || `https://image.pollinations.ai/prompt/${encodeURIComponent(data.cover_art_description || data.playlist_name)}?width=512&height=512&nologo=true`;

    return (
        <div className="relative flex h-auto min-h-screen w-full flex-col group/design-root overflow-x-hidden antialiased">
            {/* Top App Bar */}
            <header className="flex items-center p-4 pb-2 justify-between sticky top-0 z-10 bg-background-light dark:bg-background-dark/80 backdrop-blur-sm transition-colors duration-300">
                <Link
                    href="/generate"
                    className="text-foreground flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                >
                    <span className="material-symbols-outlined text-2xl">arrow_back</span>
                </Link>
                <div className="flex items-center gap-2 flex-1 justify-center">
                    <img src="/logo.png" alt="Logo" className="w-12 h-12 object-contain" />
                    <h1 className="text-foreground text-3xl font-bold leading-tight tracking-[-0.015em]">
                        VibeMixer
                    </h1>
                </div>
                <div className="flex size-10 shrink-0 items-center justify-end">
                    <ThemeToggle />
                </div>
            </header>

            <main className="flex-1 px-4 py-6 max-w-2xl mx-auto w-full">

                {/* Playlist Header */}
                <div className="flex flex-col md:flex-row gap-6 items-center md:items-start mb-8">
                    {/* Generated Cover Art */}
                    <div className="shrink-0 relative">
                        {isGeneratingImage && !coverImage && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-xl z-10">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                            </div>
                        )}
                        <img
                            src={displayImage}
                            alt="Playlist Cover"
                            className="w-48 h-48 md:w-56 md:h-56 rounded-xl shadow-lg object-cover"
                        />
                    </div>

                    {/* Info & Actions */}
                    <div className="flex flex-col text-center md:text-left flex-1 gap-4">
                        <div>
                            <h2 className="text-foreground tracking-light text-[32px] font-bold leading-tight">
                                {data.playlist_name}
                            </h2>
                            <p className="text-foreground/70 text-base mt-2">
                                {data.playlist_description}
                            </p>
                            <p className="text-muted-foreground text-sm mt-1">
                                {data.tracks.length} Tracks • {data.total_duration_mins || Math.round(data.tracks.reduce((acc, t) => acc + t.duration_ms, 0) / 60000)} mins
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                            <button
                                onClick={handleSaveToSpotify}
                                disabled={isSaving}
                                className="flex items-center justify-center gap-2 h-10 px-6 bg-spotify text-white text-sm font-bold rounded-full hover:scale-105 transition-transform disabled:opacity-50"
                            >
                                <img src="https://storage.googleapis.com/pr-newsroom-wp/1/2018/11/Spotify_Logo_RGB_White.png" alt="Spotify" className="h-5 w-auto" />
                                {isSaving ? 'Saving...' : 'Save to Spotify'}
                            </button>

                            <button
                                onClick={handleSaveToYoutube}
                                disabled={isSavingYoutube}
                                className="flex items-center justify-center gap-2 h-10 px-6 bg-[#FF0000] text-white text-sm font-bold rounded-full hover:scale-105 transition-transform disabled:opacity-50"
                            >
                                <span className="material-symbols-outlined text-xl">play_circle</span>
                                {isSavingYoutube ? 'Creating...' : 'Save to YouTube'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Track List */}
                <div className="flex flex-col gap-2">
                    <h3 className="text-foreground text-xl font-bold mb-4 px-2">Track List</h3>
                    {data.tracks.map((track, index) => (
                        <div key={track.id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors group">
                            <span className="text-muted-foreground w-6 text-center text-sm font-medium">
                                {index + 1}
                            </span>
                            <img
                                src={track.album.images[2]?.url || track.album.images[0]?.url}
                                alt={track.name}
                                className="w-12 h-12 rounded-md shadow-sm"
                            />
                            <div className="flex-1 min-w-0">
                                <p className="text-foreground text-base font-medium truncate group-hover:text-primary transition-colors">
                                    {track.name}
                                </p>
                                <p className="text-muted-foreground text-sm truncate">
                                    {track.artists.map(a => a.name).join(', ')}
                                </p>
                            </div>
                            <div className="text-muted-foreground text-sm font-variant-numeric tabular-nums">
                                {Math.floor(track.duration_ms / 60000)}:
                                {((track.duration_ms % 60000) / 1000).toFixed(0).padStart(2, '0')}
                            </div>
                        </div>
                    ))}
                </div>

                {/* New Vibe Button */}
                <div className="pt-12 pb-6 text-center">
                    <Link
                        href="/generate"
                        className="inline-flex items-center justify-center gap-2 text-primary hover:text-primary/80 font-bold transition-colors"
                    >
                        <span className="material-symbols-outlined">add_circle</span>
                        Create Another Mix
                    </Link>
                </div>

                {/* Toast Notification */}
                {toast && (
                    <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 px-6 py-3 rounded-full shadow-lg text-white text-sm font-medium z-50 transition-all ${toast.type === 'error' ? 'bg-red-500' :
                            toast.type === 'success' ? 'bg-green-500' : 'bg-blue-500'
                        }`}>
                        {toast.message}
                    </div>
                )}

            </main>
        </div >
    );
}
