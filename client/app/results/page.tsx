"use client";

import Link from "next/link";
import { toast } from "sonner";
import { Header } from "@/components/Header";
import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import html2canvas from "html2canvas";

// --- Types ---
interface Track {
    id: string;
    name: string;
    artists?: { name: string }[];
    artist?: string;
    album?: {
        name: string;
        images: { url: string }[];
    };
    image?: string;
    uri: string;
    duration_ms: number;
    external_urls: { spotify: string };
    ai_reason?: string;
}

interface PlaylistData {
    playlist_name: string;
    playlist_description: string;
    cover_art_description?: string;
    tracks: Track[];
    total_duration_mins?: number;
    isGuest?: boolean;
}

// --- Inner Component ---
function ResultsContent() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [data, setData] = useState<PlaylistData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isSavingYoutube, setIsSavingYoutube] = useState(false);
    const [isSharing, setIsSharing] = useState(false);
    const [coverImage, setCoverImage] = useState<string | null>(null);
    const [isGeneratingImage, setIsGeneratingImage] = useState(false);
    const [showPlatformModal, setShowPlatformModal] = useState(false);
    const [selectedTrackForPlay, setSelectedTrackForPlay] = useState<Track | null>(null);
    const [imageLoaded, setImageLoaded] = useState(false);

    useEffect(() => {
        const storedData = localStorage.getItem('playlistData');

        if (storedData) {
            try {
                const parsed = JSON.parse(storedData);
                setData(parsed);

                const userImage = localStorage.getItem('userImage');
                if (userImage) {
                    setCoverImage(userImage);
                } else if (parsed.cover_art_description && !coverImage) {
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

        const googleConnected = searchParams.get('google_connected');
        if (googleConnected) {
            window.history.replaceState({}, '', '/results');
        }
    }, [searchParams]);

    const generateCoverImage = async (prompt: string) => {
        setIsGeneratingImage(true);
        try {
            const apiUrl = '';
            const response = await fetch(`${apiUrl}/ai/image`, {
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
            toast.error('AI generation failed. Using fallback cover.');
        } finally {
            setIsGeneratingImage(false);
        }
    };

    const handleShareToInstagram = async () => {
        if (!data) return;
        setIsSharing(true);

        try {
            const element = document.getElementById('instagram-story-card');
            if (!element) throw new Error('Card not found');

            const imgElement = element.querySelector('img');
            const originalSrc = imgElement?.src;

            if (imgElement && originalSrc) {
                try {
                    const response = await fetch(originalSrc, { mode: 'cors' });
                    const blob = await response.blob();
                    const base64Url = await new Promise<string>((resolve) => {
                        const reader = new FileReader();
                        reader.onloadend = () => resolve(reader.result as string);
                        reader.readAsDataURL(blob);
                    });

                    imgElement.src = base64Url;
                } catch (e) {
                    // console.warn("Base64 conversion failed...", e);
                }
            }

            await new Promise(resolve => setTimeout(resolve, 500));

            const canvas = await html2canvas(element, {
                useCORS: true,
                scale: 2,
                backgroundColor: '#000000',
                allowTaint: true,
                logging: false,
            });

            if (imgElement && originalSrc) imgElement.src = originalSrc;

            const image = canvas.toDataURL("image/png");
            const link = document.createElement('a');
            link.href = image;
            link.download = `VibeMixer-Story-${Date.now()}.png`;
            link.click();

            toast.success("Story card downloaded!");

        } catch (error) {
            console.error("Share failed:", error);
            toast.error("Failed to generate image.");
        } finally {
            setIsSharing(false);
        }
    };

    const handleSaveToLibrary = async () => {
        if (!data) return;
        try {
            const apiUrl = '';

            // Check auth via cookie/session
            // Note: /api/playlists is correctly handled by rewrite to /api/playlists (which goes to backend)
            const response = await fetch(`${apiUrl}/api/playlists`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include', // Sends the auth_token cookie
                body: JSON.stringify({
                    name: data.playlist_name,
                    description: data.playlist_description,
                    coverImage: coverImage,
                    mood: "Mix",
                    tracks: data.tracks.map((t: any) => ({
                        id: t.id,
                        name: t.name,
                        uri: t.uri,
                        artist: t.artists[0]?.name || 'Unknown',
                        album: t.album?.name,
                        image: t.album?.images[0]?.url,
                        duration_ms: t.duration_ms
                    }))
                })
            });

            if (response.ok) {
                toast.success("Saved to your profile!");
            } else if (response.status === 401) {
                toast.error("Please login to save to library");
                router.push('/auth');
            } else {
                toast.error("Failed to save.");
            }
        } catch (e) {
            console.error(e);
            toast.error("Network error when saving.");
        }
    };
    const handleSaveToSpotify = async () => {
        if (!data) return;
        setIsSaving(true);
        try {
            const finalCoverImage = coverImage || `https://image.pollinations.ai/prompt/${encodeURIComponent(data.cover_art_description || data.playlist_name)}?width=512&height=512&nologo=true`;
            const apiUrl = '';

            const response = await fetch(`${apiUrl}/spotify/playlist`, {
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
            toast.success('Spotify Playlist created successfully!');
            window.open(result.external_urls.spotify, '_blank');
        } catch (error: any) {
            console.error('Error saving playlist:', error);
            toast.error(error.message || 'Failed to save playlist. Check Spotify login.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleSaveToYoutube = async () => {
        if (!data) return;
        setIsSavingYoutube(true);
        try {
            const apiUrl = '';
            const response = await fetch(`${apiUrl}/youtube/playlist`, {
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
                window.location.href = `${apiUrl}/auth/google`;
                return;
            }
            if (!response.ok) throw new Error('Failed to create playlist');

            const result = await response.json();
            toast.success('YouTube Playlist created successfully!');
            window.open(result.playlistUrl, '_blank');
        } catch (error) {
            console.error('Error saving to YouTube:', error);
            toast.error('Failed to save playlist.');
        } finally {
            setIsSavingYoutube(false);
        }
    };




    if (loading) return <div className="flex h-screen items-center justify-center">Loading your vibe...</div>;

    if (error || !data) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background-light dark:bg-background-dark p-4">
                <div className="text-red-500">{error || 'Something went wrong'}</div>
                <Link href="/generate">
                    <button className="rounded-full bg-primary px-6 py-2 text-white hover:bg-primary/90">Try Again</button>
                </Link>
            </div>
        );
    }

    const displayImage = coverImage || (data ? `https://image.pollinations.ai/prompt/${encodeURIComponent(data.cover_art_description || data.playlist_name)}?width=512&height=512&nologo=true` : '');

    const handlePlayTrack = (track: Track) => {
        const platform = localStorage.getItem('musicPlatform');
        if (platform === 'spotify') {
            window.open(track.external_urls.spotify, '_blank');
        } else if (platform === 'youtube') {
            window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(track.name + ' ' + (track.artist || track.artists?.[0]?.name || ''))}`, '_blank');
        } else {
            setSelectedTrackForPlay(track);
            setShowPlatformModal(true);
        }
    };

    const confirmPlatform = (platform: 'spotify' | 'youtube', remember: boolean) => {
        if (remember) {
            localStorage.setItem('musicPlatform', platform);
        }

        if (selectedTrackForPlay) {
            if (platform === 'spotify') {
                window.open(selectedTrackForPlay.external_urls.spotify, '_blank');
            } else {
                window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(selectedTrackForPlay.name + ' ' + (selectedTrackForPlay.artist || selectedTrackForPlay.artists?.[0]?.name || ''))}`, '_blank');
            }
        }
        setShowPlatformModal(false);
        setSelectedTrackForPlay(null);
    };

    return (
        <div className="relative flex h-auto min-h-screen w-full flex-col group/design-root overflow-x-hidden antialiased">
            <Header />

            <main className="flex-1 px-4 py-6 max-w-2xl mx-auto w-full">

                <div className="flex flex-col gap-4 mb-8">
                    <button
                        onClick={() => {
                            if (data.isGuest) {
                                router.push('/auth?next=/swipe');
                            } else {
                                router.push('/swipe');
                            }
                        }}
                        className="w-full py-4 rounded-2xl bg-gradient-to-r from-primary to-secondary text-white font-bold text-lg shadow-xl shadow-primary/20 hover:shadow-primary/40 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                    >
                        <span className="material-symbols-outlined text-2xl">graphic_eq</span>
                        {data.isGuest ? 'Login to Refine' : 'Refine Your Vibe'}
                    </button>
                </div>

                <div className="flex flex-col md:flex-row gap-6 items-center md:items-start mb-8">
                    <div className="shrink-0 relative w-48 h-48 md:w-56 md:h-56">
                        {(!imageLoaded || isGeneratingImage) && (
                            <div className="absolute inset-0 bg-surface-light dark:bg-surface-dark rounded-xl animate-pulse flex items-center justify-center overflow-hidden">
                                <div className="w-full h-full bg-gradient-to-tr from-transparent via-primary/10 to-transparent animate-shimmer" style={{ backgroundSize: '200% 100%' }}></div>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-4xl text-primary/50 animate-bounce">music_note</span>
                                </div>
                            </div>
                        )}
                        <img
                            src={displayImage}
                            alt="Playlist Cover"
                            className={`w-full h-full rounded-xl shadow-lg object-cover transition-opacity duration-500 ${imageLoaded && !isGeneratingImage ? 'opacity-100' : 'opacity-0'}`}
                            onLoad={() => setImageLoaded(true)}
                        />
                    </div>

                    <div className="flex flex-col text-center md:text-left flex-1 gap-4">
                        <div>
                            <h2 className="text-foreground tracking-light text-[32px] font-bold leading-tight">{data.playlist_name}</h2>
                            <p className="text-foreground/70 text-base mt-2">{data.playlist_description}</p>
                            <p className="text-muted-foreground text-sm mt-1">{data.tracks.length} Tracks • {data.total_duration_mins || Math.round(data.tracks.reduce((acc, t) => acc + t.duration_ms, 0) / 60000)} mins</p>
                        </div>
                        <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                            {!data.isGuest ? (
                                <button onClick={handleSaveToSpotify} disabled={isSaving} className="flex items-center justify-center gap-2 h-10 px-6 bg-[#1DB954] text-white text-sm font-bold rounded-full hover:scale-105 transition-transform disabled:opacity-50">
                                    <img src="https://storage.googleapis.com/pr-newsroom-wp/1/2018/11/Spotify_Logo_RGB_White.png" alt="Spotify" className="h-5 w-auto" />
                                    {isSaving ? 'Saving...' : 'Save to Spotify'}
                                </button>
                            ) : (
                                <button onClick={() => { window.location.href = `/auth/login`; }} className="flex items-center justify-center gap-2 h-10 px-6 bg-transparent border border-[#1DB954] text-[#1DB954] text-sm font-bold rounded-full hover:bg-[#1DB954] hover:text-white transition-colors">
                                    <img src="https://storage.googleapis.com/pr-newsroom-wp/1/2018/11/Spotify_Logo_RGB_Green.png" alt="Spotify" className="h-5 w-auto" />
                                    Login to Save
                                </button>
                            )}
                            <button onClick={handleSaveToYoutube} disabled={isSavingYoutube} className="flex items-center justify-center gap-2 h-10 px-6 bg-[#FF0000] text-white text-sm font-bold rounded-full hover:scale-105 transition-transform disabled:opacity-50">
                                <span className="material-symbols-outlined text-xl">play_circle</span>
                                {isSavingYoutube ? 'Creating...' : 'Save to YouTube'}
                            </button>
                            <button
                                onClick={handleSaveToLibrary}
                                className="flex items-center justify-center gap-2 h-10 px-6 bg-surface-light dark:bg-surface-dark border border-foreground/10 hover:bg-foreground/5 text-sm font-bold rounded-full transition-colors"
                            >
                                <span className="material-symbols-outlined text-xl">bookmark</span>
                                Save to Library
                            </button>
                            {/* Debug button removed */}
                            <button
                                onClick={handleShareToInstagram}
                                disabled={isSharing}
                                className="flex items-center justify-center gap-2 h-10 px-6 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-bold rounded-full hover:scale-105 transition-transform disabled:opacity-50"
                            >
                                <span className="material-symbols-outlined text-xl">ios_share</span>
                                {isSharing ? 'Generating...' : 'Share Story'}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-2">
                    <h3 className="text-foreground text-xl font-bold mb-4 px-2">Track List</h3>
                    {data.tracks.map((track, index) => (
                        <div
                            key={track.id}
                            onClick={() => handlePlayTrack(track)}
                            className="flex items-start gap-4 p-3 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors group cursor-pointer"
                        >
                            <span className="text-muted-foreground w-6 text-center text-sm font-medium mt-3">{index + 1}</span>

                            <div className="relative w-12 h-12 rounded-md shadow-sm overflow-hidden group-hover:scale-105 transition-transform shrink-0 mt-1">
                                <img src={track.image || track.album?.images?.[2]?.url || track.album?.images?.[0]?.url || '/placeholder.png'} alt={track.name} className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <span className="material-symbols-outlined text-white text-xl">play_arrow</span>
                                </div>
                            </div>

                            <div className="flex-1 min-w-0">
                                <p className="text-foreground text-base font-medium truncate group-hover:text-primary transition-colors">{track.name}</p>
                                <p className="text-muted-foreground text-sm truncate">{track.artist || track.artists?.map((a: any) => a.name).join(', ') || 'Unknown Artist'}</p>

                                {track.ai_reason && (
                                    <div className="mt-2 flex items-start gap-1.5 p-2 rounded-lg bg-primary/5 border border-primary/10 opacity-90 group-hover:opacity-100 transition-opacity">
                                        <span className="material-symbols-outlined text-[14px] text-primary mt-0.5 shrink-0 select-none">
                                            auto_awesome
                                        </span>
                                        <p className="text-xs text-primary/90 italic leading-relaxed whitespace-normal break-words">
                                            {track.ai_reason}
                                        </p>
                                    </div>
                                )}
                            </div>

                            <div className="text-muted-foreground text-sm font-variant-numeric tabular-nums whitespace-nowrap mt-3">
                                {Math.floor(track.duration_ms / 60000)}:{((track.duration_ms % 60000) / 1000).toFixed(0).padStart(2, '0')}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="pt-12 pb-6 text-center">
                    <Link href="/generate" className="inline-flex items-center justify-center gap-2 text-primary hover:text-primary/80 font-bold transition-colors">
                        <span className="material-symbols-outlined">add_circle</span>
                        Create Another Mix
                    </Link>
                </div>

                {showPlatformModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                        <div className="bg-surface-light dark:bg-surface-dark p-6 rounded-2xl shadow-2xl max-w-sm w-full animate-in fade-in zoom-in-95 duration-200">
                            <h3 className="text-xl font-bold mb-4 text-center">Play on...</h3>
                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <button
                                    onClick={() => confirmPlatform('spotify', (document.getElementById('remember_res') as HTMLInputElement)?.checked)}
                                    className="flex flex-col items-center gap-2 p-4 rounded-xl bg-[#1DB954]/10 hover:bg-[#1DB954]/20 transition-colors"
                                >
                                    <img src="https://storage.googleapis.com/pr-newsroom-wp/1/2018/11/Spotify_Logo_RGB_Green.png" className="h-8 w-auto" alt="Spotify" />
                                    <span className="text-sm font-bold text-[#1DB954]">Spotify</span>
                                </button>
                                <button
                                    onClick={() => confirmPlatform('youtube', (document.getElementById('remember_res') as HTMLInputElement)?.checked)}
                                    className="flex flex-col items-center gap-2 p-4 rounded-xl bg-red-500/10 hover:bg-red-500/20 transition-colors"
                                >
                                    <span className="material-symbols-outlined text-4xl text-red-500">play_circle</span>
                                    <span className="text-sm font-bold text-red-500">YouTube</span>
                                </button>
                            </div>
                            <div className="flex items-center justify-center gap-2 mb-4">
                                <input type="checkbox" id="remember_res" className="rounded border-gray-300 text-primary focus:ring-primary" />
                                <label htmlFor="remember_res" className="text-sm text-muted-foreground">Remember my choice</label>
                            </div>
                            <button onClick={() => setShowPlatformModal(false)} className="w-full py-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg text-sm text-muted-foreground font-medium transition-colors">
                                Cancel
                            </button>
                        </div>
                    </div>
                )}

                {/* ✅ 4. HIDDEN INSTAGRAM CARD (Fixed for html2canvas) */}
                {/* We place it far off-screen so it doesn't interfere with UI. html2canvas can still find it by ID. */}
                {data && (
                    <div
                        id="instagram-story-card"
                        className="fixed flex flex-col items-center justify-between font-sans"
                        style={{
                            left: '-9999px',
                            top: '0',
                            width: '1080px',
                            height: '1920px',
                            zIndex: -1,
                            background: '#000000',
                            color: '#ffffff',
                            fontFamily: 'Arial, sans-serif'
                        }}
                    >
                        {/* Use simple hex/rgba for background - Standard CSS Gradients */}
                        <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom right, #312e81, #581c87, #000000)', opacity: 1 }}></div>

                        {/* Patterns - REMOVED due to CORS error */}
                        {/* <div className="absolute inset-0 opacity-30" style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/stardust.png')" }}></div> */}

                        <div className="relative z-10 flex flex-col items-center gap-6 mt-20">
                            <div className="px-8 py-3 rounded-full border"
                                style={{
                                    backgroundColor: 'rgba(0, 0, 0, 0.6)',
                                    borderColor: 'rgba(255, 255, 255, 0.2)'
                                }}>
                                <span className="text-3xl font-bold tracking-widest uppercase" style={{ color: '#ffffff' }}>My Vibe Today</span>
                            </div>
                        </div>

                        <div className="relative z-10 flex flex-col items-center gap-10 w-full px-12">
                            <div className="w-[800px] h-[800px] rounded-3xl overflow-hidden border-4 relative"
                                style={{
                                    backgroundColor: '#111827',
                                    borderColor: 'rgba(255, 255, 255, 0.1)',
                                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                                }}>
                                <img
                                    src={displayImage}
                                    alt="Cover"
                                    crossOrigin="anonymous"
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute bottom-0 inset-x-0 p-10 pt-32" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.9), transparent)' }}>
                                    <h1 className="text-7xl font-bold leading-tight mb-4" style={{ color: '#ffffff' }}>{data.playlist_name}</h1>
                                    <p className="text-3xl font-medium italic" style={{ color: '#d1d5db' }}>"{data.playlist_description}"</p>
                                </div>
                            </div>

                            <div className="w-full flex flex-col gap-6 mt-8">
                                <p className="text-2xl font-bold uppercase tracking-wider ml-2" style={{ color: '#9ca3af' }}>Featuring</p>
                                {data.tracks.slice(0, 3).map((track, i) => (
                                    <div key={i} className="flex items-center gap-6 p-6 rounded-2xl border"
                                        style={{
                                            backgroundColor: 'rgba(20, 20, 20, 0.8)', // Darker, no blur for clean capture
                                            borderColor: 'rgba(255, 255, 255, 0.1)'
                                        }}>
                                        <div className="w-16 h-16 rounded-full flex items-center justify-center font-bold text-2xl"
                                            style={{
                                                background: 'linear-gradient(to top right, #9333ea, #a855f7)',
                                                color: '#ffffff'
                                            }}>
                                            {i + 1}
                                        </div>
                                        <div className="flex flex-col" style={{ overflow: 'hidden', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                            <span className="text-4xl font-bold truncate" style={{
                                                color: '#ffffff',
                                                whiteSpace: 'nowrap',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                lineHeight: '1.5',
                                                display: 'block',
                                                paddingBottom: '5px' // Prevent clipping
                                            }}>{track.name}</span>
                                            <span className="text-2xl" style={{
                                                color: '#9ca3af',
                                                lineHeight: '1.4',
                                                display: 'block'
                                            }}>{track.artist || track.artists?.[0]?.name || 'Unknown'}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="relative z-10 mb-20 flex flex-col items-center gap-4">
                            <p className="text-3xl font-medium" style={{ color: '#9ca3af' }}>Generated by</p>
                            <div className="flex items-center gap-4">
                                <span className="text-6xl font-black" style={{ color: '#c084fc' }}>
                                    VibeMixer
                                </span>
                            </div>
                            <p className="text-2xl mt-2" style={{ color: '#6b7280' }}>vibemixer.tech</p>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

export default function ResultsPage() {
    return (
        <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Loading...</div>}>
            <ResultsContent />
        </Suspense>
    );
}
