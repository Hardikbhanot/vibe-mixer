import { useState } from 'react';
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { toast } from 'sonner';
import Image from 'next/image';

interface Track {
    id: string;
    name: string;
    artists: { name: string }[];
    album: {
        name: string;
        images: { url: string }[];
    };
    uri: string;
    external_urls?: { spotify: string };
}

interface SwipeCardsProps {
    tracks: Track[];
    onEmpty?: () => void;
}

const SwipeCards = ({ tracks, onEmpty }: SwipeCardsProps) => {
    const [cards, setCards] = useState<Track[]>(tracks);
    const [showModal, setShowModal] = useState(false);
    const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);

    const getSpotifyUrl = (track: Track) => {
        if (track.external_urls?.spotify) return track.external_urls.spotify;
        if (track.id) return `https://open.spotify.com/track/${track.id}`;
        return null;
    };

    const handlePlay = (track: Track) => {
        const platform = localStorage.getItem('musicPlatform');
        const spotifyUrl = getSpotifyUrl(track);

        if (platform === 'spotify' && spotifyUrl) {
            window.open(spotifyUrl, '_blank');
        } else if (platform === 'youtube') {
            window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(track.name + ' ' + track.artists[0].name)}`, '_blank');
        } else {
            setSelectedTrack(track);
            setShowModal(true);
        }
    };

    const confirmPlatform = (platform: 'spotify' | 'youtube', remember: boolean) => {
        if (remember) {
            localStorage.setItem('musicPlatform', platform);
        }

        if (selectedTrack) {
            if (platform === 'spotify') {
                const spotifyUrl = getSpotifyUrl(selectedTrack);
                if (spotifyUrl) {
                    window.open(spotifyUrl, '_blank');
                } else {
                    // Fallback if we absolutely can't find a link
                    toast.error('Spotify link not available, searching YouTube instead');
                    window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(selectedTrack.name + ' ' + selectedTrack.artists[0].name)}`, '_blank');
                }
            } else {
                window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(selectedTrack.name + ' ' + selectedTrack.artists[0].name)}`, '_blank');
            }
        }
        setShowModal(false);
        setSelectedTrack(null);
    };

    const handleSwipe = async (direction: 'left' | 'right' | 'up', track: Track) => {
        // ... (existing logic)
        setCards((prev) => prev.slice(0, -1));

        if (cards.length <= 1 && onEmpty) {
            onEmpty();
        }

        const actionString = direction === 'right' ? 'LIKE' : direction === 'left' ? 'DISLIKE' : 'SUPERLIKE';

        // Optimistic UI feedback
        if (direction === 'up') {
            toast.success(`Superliked ${track.name}! ⭐`);
        } else if (direction === 'right') {
            toast.success(`Liked ${track.name} 💚`);
        }

        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:4000';
            await fetch(`${apiUrl}/api/swipe`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    songName: track.name,
                    artistName: track.artists[0].name,
                    action: actionString
                }),
                credentials: 'include'
            });
        } catch (error) {
            console.error('Swipe error:', error);
        }
    };

    return (
        <div className="relative w-full h-[650px] flex items-center justify-center overflow-hidden">
            {cards.map((track, index) => {
                const isTop = index === cards.length - 1;
                return (
                    <Card
                        key={track.id}
                        track={track}
                        isTop={isTop}
                        onSwipe={(dir) => handleSwipe(dir, track)}
                        onPlay={() => handlePlay(track)}
                    />
                );
            })}
            {cards.length === 0 && (
                <div className="text-center text-muted-foreground">
                    <p>No more songs to swipe! 🎵</p>
                </div>
            )}

            {/* Control Buttons - Only show if there are cards */}
            {cards.length > 0 && (
                <div className="absolute bottom-4 flex gap-8 items-center justify-center w-full z-20">
                    <button
                        onClick={() => handleSwipe('left', cards[cards.length - 1])}
                        className="w-16 h-16 rounded-full bg-background-light dark:bg-surface-dark border border-red-500/20 shadow-lg flex items-center justify-center text-red-500 hover:bg-red-500 hover:text-white transition-all hover:scale-110 active:scale-95"
                    >
                        <span className="material-symbols-outlined text-3xl">close</span>
                    </button>

                    <button
                        onClick={() => handleSwipe('up', cards[cards.length - 1])}
                        className="w-12 h-12 rounded-full bg-background-light dark:bg-surface-dark border border-blue-500/20 shadow-lg flex items-center justify-center text-blue-500 hover:bg-blue-500 hover:text-white transition-all hover:scale-110 active:scale-95"
                    >
                        <span className="material-symbols-outlined text-2xl">star</span>
                    </button>

                    <button
                        onClick={() => handleSwipe('right', cards[cards.length - 1])}
                        className="w-16 h-16 rounded-full bg-background-light dark:bg-surface-dark border border-green-500/20 shadow-lg flex items-center justify-center text-green-500 hover:bg-green-500 hover:text-white transition-all hover:scale-110 active:scale-95"
                    >
                        <span className="material-symbols-outlined text-3xl">favorite</span>
                    </button>
                </div>
            )}

            {showModal && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-surface-light dark:bg-surface-dark p-6 rounded-2xl shadow-2xl max-w-sm w-full animate-in fade-in zoom-in-95 duration-200">
                        <h3 className="text-xl font-bold mb-4 text-center">Play on...</h3>
                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <button
                                onClick={() => confirmPlatform('spotify', (document.getElementById('remember') as HTMLInputElement)?.checked)}
                                className="flex flex-col items-center gap-2 p-4 rounded-xl bg-[#1DB954]/10 hover:bg-[#1DB954]/20 transition-colors"
                            >
                                <img src="https://storage.googleapis.com/pr-newsroom-wp/1/2018/11/Spotify_Logo_RGB_Green.png" className="h-8 w-auto" alt="Spotify" />
                                <span className="text-sm font-bold text-[#1DB954]">Spotify</span>
                            </button>
                            <button
                                onClick={() => confirmPlatform('youtube', (document.getElementById('remember') as HTMLInputElement)?.checked)}
                                className="flex flex-col items-center gap-2 p-4 rounded-xl bg-red-500/10 hover:bg-red-500/20 transition-colors"
                            >
                                <span className="material-symbols-outlined text-4xl text-red-500">play_circle</span>
                                <span className="text-sm font-bold text-red-500">YouTube</span>
                            </button>
                        </div>
                        <div className="flex items-center justify-center gap-2 mb-4">
                            <input type="checkbox" id="remember" className="rounded border-gray-300 text-primary focus:ring-primary" />
                            <label htmlFor="remember" className="text-sm text-muted-foreground">Remember my choice</label>
                        </div>
                        <button onClick={() => setShowModal(false)} className="w-full py-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg text-sm text-muted-foreground font-medium transition-colors">
                            Cancel
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

// Individual Card Component
const Card = ({ track, isTop, onSwipe, onPlay }: { track: Track; isTop: boolean; onSwipe: (dir: 'left' | 'right' | 'up') => void; onPlay: () => void }) => {
    const x = useMotionValue(0);
    const y = useMotionValue(0);
    // ... (rest of framer motion logic unchanged)
    const rotate = useTransform(x, [-200, 200], [-25, 25]);
    const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0]);
    const likeOpacity = useTransform(x, [20, 100], [0, 1]);
    const dislikeOpacity = useTransform(x, [-100, -20], [1, 0]);
    const superlikeOpacity = useTransform(y, [-100, -20], [1, 0]);

    const handleDragEnd = (event: any, info: PanInfo) => {
        if (Math.abs(info.offset.x) > 100) {
            onSwipe(info.offset.x > 0 ? 'right' : 'left');
        } else if (info.offset.y < -100) {
            onSwipe('up');
        }
    };

    return (
        <motion.div
            style={{ x, y, rotate, zIndex: isTop ? 10 : 0 }}
            drag={isTop ? true : false}
            dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
            dragElastic={0.6}
            onDragEnd={handleDragEnd}
            whileTap={{ cursor: 'grabbing' }}
            className={`absolute w-80 h-[450px] bg-background-light dark:bg-[#1a1a1a] rounded-2xl shadow-xl flex flex-col items-center p-4 border border-white/10 ${!isTop && 'top-4 scale-95 opacity-50 pointer-events-none'}`}
        >
            {/* Action Overlays */}
            {isTop && (
                <>
                    <motion.div style={{ opacity: likeOpacity }} className="absolute top-8 right-8 z-20 transform rotate-12 bg-green-500 text-white px-4 py-1 rounded-md text-3xl font-bold border-4 border-white">LIKE</motion.div>
                    <motion.div style={{ opacity: dislikeOpacity }} className="absolute top-8 left-8 z-20 transform -rotate-12 bg-red-500 text-white px-4 py-1 rounded-md text-3xl font-bold border-4 border-white">NOPE</motion.div>
                    <motion.div style={{ opacity: superlikeOpacity }} className="absolute bottom-20 z-20 bg-blue-500 text-white px-4 py-1 rounded-md text-2xl font-bold border-4 border-white">SUPER</motion.div>
                </>
            )}

            {/* Album Art - Clickable for Play */}
            <div className="relative w-full aspect-square mb-4 rounded-xl overflow-hidden shadow-inner group">
                <Image
                    src={track.album.images[0]?.url}
                    alt={track.name}
                    fill
                    className="object-cover pointer-events-none group-hover:scale-105 transition-transform duration-500"
                    sizes="(max-width: 768px) 100vw, 300px"
                />
                {isTop && (
                    <div
                        onClick={(e) => { e.stopPropagation(); onPlay(); }}
                        className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                    >
                        <span className="material-symbols-outlined text-6xl text-white drop-shadow-lg transform scale-90 group-hover:scale-100 transition-transform">play_circle</span>
                    </div>
                )}
            </div>

            {/* Track Info */}
            <div className="text-center w-full pointer-events-none">
                <h3 className="text-xl font-bold text-foreground line-clamp-1">{track.name}</h3>
                <p className="text-muted-foreground text-md line-clamp-1">{track.artists[0].name}</p>
                <p className="text-xs text-muted-foreground mt-2">{track.album.name}</p>
            </div>
        </motion.div>
    );
};

export default SwipeCards;
