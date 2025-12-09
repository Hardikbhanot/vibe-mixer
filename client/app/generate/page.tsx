"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Header } from "@/components/Header";
import { useAuth } from "@/context/AuthContext";

export default function GeneratePage() {
    const router = useRouter();
    const [mood, setMood] = useState("");
    const [isAdvanced, setIsAdvanced] = useState(false);
    const [energy, setEnergy] = useState(50);
    const [tempo, setTempo] = useState(75);
    const [valence, setValence] = useState(30);
    const [duration, setDuration] = useState(60); // Default 60 minutes
    const [vibeType, setVibeType] = useState<'offbeat' | 'popular' | 'mix'>('mix');
    const [isLoading, setIsLoading] = useState(false);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    useEffect(() => {
        if (window.location.hostname === 'localhost') {
            window.location.href = window.location.href.replace('localhost', '127.0.0.1');
        }
        // Clear any previous user image
        localStorage.removeItem('userImage');
    }, []);

    const handleGenerate = async () => {
        setIsLoading(true);
        try {
            // 1. Analyze mood with AI (Groq)
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:4000';
            const response = await fetch(`${apiUrl}/ai/analyze`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    mood,
                    duration, // Send duration in minutes
                    vibeType, // Send vibe preference
                    energy,
                    tempo,
                    valence
                }),
                credentials: 'include',
            });

            if (response.status === 401) {
                // If 401 happens (should be rare now with Guest Mode), show error
                throw new Error('Authentication failed. Please try logging in again.');
            }

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to analyze mood');
            }

            const aiData = await response.json();
            console.log('AI Analysis Result:', aiData);

            // Save to localStorage for the results page
            console.log('Saving to localStorage: playlistData', aiData);
            localStorage.setItem('playlistData', JSON.stringify(aiData));

            // If user uploaded an image, save it to use as cover art
            if (selectedImage) {
                localStorage.setItem('userImage', selectedImage);
            }

            router.push('/results');

        } catch (error) {
            console.error('Error generating mix:', error);
            alert('Failed to generate mix. Check console for details.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogin = () => {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:4000';
        window.location.href = `${apiUrl}/auth/login`;
    };

    return (
        <div className="relative flex h-auto min-h-screen w-full flex-col group/design-root overflow-x-hidden antialiased">
            <Header />

            <main className="flex flex-col flex-1 px-4 py-6 space-y-8 max-w-xl mx-auto w-full">
                {/* Headline Text */}
                <h2 className="text-foreground tracking-light text-[32px] font-bold leading-tight text-center pb-2 pt-4">
                    Craft Your Perfect Mix
                </h2>

                {/* Image Upload for Vibe Analysis */}
                <div className="flex flex-col gap-2">
                    <p className="text-foreground/80 text-base font-medium leading-normal">
                        Start with a photo (Optional)
                    </p>
                    <div className="relative flex items-center justify-center w-full">
                        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-xl cursor-pointer bg-surface-light dark:bg-surface-dark hover:bg-black/5 dark:hover:bg-white/5 transition-colors overflow-hidden group">

                            {selectedImage ? (
                                <div className="relative w-full h-full">
                                    <img src={selectedImage} alt="Preview" className="w-full h-full object-cover opacity-60 group-hover:opacity-40 transition-opacity" />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <span className="bg-black/50 text-white px-3 py-1 rounded-full text-sm font-medium backdrop-blur-sm">Change Image</span>
                                    </div>
                                </div>
                            ) : isLoading ? (
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-2"></div>
                                    <p className="text-sm text-muted-foreground">Analyzing Vibe...</p>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center px-4">
                                    <span className="material-symbols-outlined text-3xl text-muted-foreground mb-2">add_photo_alternate</span>
                                    <p className="text-sm text-foreground">
                                        <span className="font-semibold">Click to upload</span> or drag and drop
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        AI will describe the vibe for you
                                    </p>
                                </div>
                            )}

                            <input
                                type="file"
                                className="hidden"
                                accept="image/*"
                                onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    if (!file) return;

                                    if (file.size > 5 * 1024 * 1024) {
                                        alert('Image is too large. Please upload an image under 5MB.');
                                        return;
                                    }

                                    // Create preview
                                    const reader = new FileReader();
                                    reader.onloadend = () => {
                                        setSelectedImage(reader.result as string);
                                    };
                                    reader.readAsDataURL(file);

                                    setIsLoading(true);
                                    try {
                                        const formData = new FormData();
                                        formData.append('image', file);

                                        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:4000';
                                        const response = await fetch(`${apiUrl}/ai/analyze-image`, {
                                            method: 'POST',
                                            body: formData,
                                        });

                                        if (!response.ok) throw new Error('Failed to analyze image');

                                        const data = await response.json();

                                        // Auto-fill the mood
                                        setMood(prev => {
                                            const newMood = data.mood;
                                            return prev ? `${prev} ${newMood}` : newMood;
                                        });

                                    } catch (error) {
                                        console.error('Image upload error:', error);
                                        alert('Failed to analyze image. Please try again.');
                                        setSelectedImage(null); // Clear preview on error
                                    } finally {
                                        setIsLoading(false);
                                    }
                                }}
                            />
                        </label>
                    </div>
                </div>

                {/* Text Field */}
                <div className="flex flex-col w-full">
                    <label className="flex flex-col min-w-40 flex-1">
                        <p className="text-foreground/80 text-base font-medium leading-normal pb-2">
                            Tell VibeMixer your vibe
                        </p>
                        <textarea
                            value={mood}
                            onChange={(e) => setMood(e.target.value)}
                            className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-xl text-foreground focus:outline-0 focus:ring-2 focus:ring-primary/50 border-border bg-surface-light dark:bg-surface-dark min-h-36 placeholder:text-muted-foreground p-4 text-base font-normal leading-normal"
                            placeholder="e.g., 'Rainy day coding music' or 'High-energy 90s hip-hop workout.'"
                        ></textarea>
                    </label>
                </div>

                {/* List Item for Advanced Mode */}
                <div className="flex items-center gap-4 bg-transparent min-h-14 justify-between">
                    <div className="flex items-center gap-4">
                        <div className="text-white flex items-center justify-center rounded-lg bg-surface-dark shrink-0 size-10">
                            <span className="material-symbols-outlined">tune</span>
                        </div>
                        <p className="text-foreground text-base font-medium leading-normal flex-1 truncate">
                            Advanced Mode
                        </p>
                    </div>
                    <div className="shrink-0">
                        <label className="relative flex h-[31px] w-[51px] cursor-pointer items-center rounded-full border-none bg-surface-dark p-0.5 has-[:checked]:justify-end has-[:checked]:bg-spotify">
                            <div
                                className="h-full w-[27px] rounded-full bg-white transition-transform shadow-sm"
                            ></div>
                            <input
                                className="invisible absolute"
                                type="checkbox"
                                checked={isAdvanced}
                                onChange={(e) => setIsAdvanced(e.target.checked)}
                            />
                        </label>
                    </div>
                </div>



                {/* Advanced Controls Sliders */}
                {isAdvanced && (
                    <div className="flex flex-col space-y-6 pt-2 animate-in fade-in slide-in-from-top-4 duration-300">

                        {/* Vibe Type Selection */}
                        <div className="flex flex-col gap-3">
                            <p className="text-foreground text-base font-medium leading-normal">
                                Vibe Type
                            </p>
                            <div className="grid grid-cols-3 gap-2">
                                <button
                                    onClick={() => setVibeType('offbeat')}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${vibeType === 'offbeat'
                                        ? 'bg-primary text-background-dark'
                                        : 'bg-surface-dark text-white hover:bg-white/10'
                                        }`}
                                >
                                    Offbeat
                                </button>
                                <button
                                    onClick={() => setVibeType('popular')}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${vibeType === 'popular'
                                        ? 'bg-primary text-background-dark'
                                        : 'bg-surface-dark text-white hover:bg-white/10'
                                        }`}
                                >
                                    Popular
                                </button>
                                <button
                                    onClick={() => setVibeType('mix')}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${vibeType === 'mix'
                                        ? 'bg-primary text-background-dark'
                                        : 'bg-surface-dark text-white hover:bg-white/10'
                                        }`}
                                >
                                    Mix
                                </button>
                            </div>
                        </div>

                        {/* Duration Slider */}
                        <div className="@container">
                            <div className="relative flex w-full flex-col items-start justify-between gap-3">
                                <div className="flex w-full shrink-[3] items-center justify-between">
                                    <p className="text-foreground text-base font-medium leading-normal">
                                        Duration
                                    </p>
                                    <p className="text-foreground/70 text-sm font-normal leading-normal">
                                        {duration} mins
                                    </p>
                                </div>
                                <input
                                    type="range"
                                    min="15"
                                    max="180"
                                    step="5"
                                    value={duration}
                                    onChange={(e) => setDuration(Number(e.target.value))}
                                    className="w-full h-2 bg-surface-dark rounded-lg appearance-none cursor-pointer accent-white"
                                />
                            </div>
                        </div>

                        {/* Energy Slider */}
                        <div className="@container">
                            <div className="relative flex w-full flex-col items-start justify-between gap-3">
                                <div className="flex w-full shrink-[3] items-center justify-between">
                                    <p className="text-foreground text-base font-medium leading-normal">
                                        Energy
                                    </p>
                                    <p className="text-foreground/70 text-sm font-normal leading-normal">
                                        {energy}%
                                    </p>
                                </div>
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={energy}
                                    onChange={(e) => setEnergy(Number(e.target.value))}
                                    className="w-full h-2 bg-surface-dark rounded-lg appearance-none cursor-pointer accent-white"
                                />
                            </div>
                        </div>

                        {/* Tempo Slider */}
                        <div className="@container">
                            <div className="relative flex w-full flex-col items-start justify-between gap-3">
                                <div className="flex w-full shrink-[3] items-center justify-between">
                                    <p className="text-foreground text-base font-medium leading-normal">
                                        Tempo
                                    </p>
                                    <p className="text-foreground/70 text-sm font-normal leading-normal">
                                        {tempo}%
                                    </p>
                                </div>
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={tempo}
                                    onChange={(e) => setTempo(Number(e.target.value))}
                                    className="w-full h-2 bg-surface-dark rounded-lg appearance-none cursor-pointer accent-white"
                                />
                            </div>
                        </div>

                        {/* Valence Slider */}
                        <div className="@container">
                            <div className="relative flex w-full flex-col items-start justify-between gap-3">
                                <div className="flex w-full shrink-[3] items-center justify-between">
                                    <p className="text-foreground text-base font-medium leading-normal">
                                        Valence (Positivity)
                                    </p>
                                    <p className="text-foreground/70 text-sm font-normal leading-normal">
                                        {valence}%
                                    </p>
                                </div>
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={valence}
                                    onChange={(e) => setValence(Number(e.target.value))}
                                    className="w-full h-2 bg-surface-dark rounded-lg appearance-none cursor-pointer accent-white"
                                />
                            </div>
                        </div>
                    </div>
                )}

                <div className="flex-grow"></div>

                {/* Loading Status Section */}
                {isLoading && (
                    <div className="flex flex-col items-center justify-center space-y-2 text-center h-12">
                        <div className="flex items-center gap-2">
                            <div className="size-1.5 animate-pulse rounded-full bg-white/50 [animation-delay:-0.3s]"></div>
                            <div className="size-1.5 animate-pulse rounded-full bg-white/50 [animation-delay:-0.15s]"></div>
                            <div className="size-1.5 animate-pulse rounded-full bg-white/50"></div>
                        </div>
                        <p className="text-white/60 text-sm">Analyzing your vibe...</p>
                    </div>
                )}

                {/* Primary CTA Button */}
                <div className="py-4">
                    <button
                        onClick={handleGenerate}
                        disabled={isLoading || !mood}
                        className="flex w-full items-center justify-center gap-2 whitespace-nowrap rounded-full bg-primary px-5 py-4 text-base font-bold leading-6 text-background-dark transition-transform duration-200 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? "Generating..." : "Generate My Mix"}
                    </button>
                </div>
            </main>
        </div>
    );
}
