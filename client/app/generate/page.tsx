"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function GeneratePage() {
    const router = useRouter();
    const [mood, setMood] = useState("");
    const [isAdvanced, setIsAdvanced] = useState(false);
    const [energy, setEnergy] = useState(50);
    const [tempo, setTempo] = useState(75);
    const [valence, setValence] = useState(30);
    const [isLoading, setIsLoading] = useState(false);

    const handleGenerate = async () => {
        setIsLoading(true);
        try {
            const response = await fetch('http://127.0.0.1:4000/spotify/search', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ query: mood }),
                credentials: 'include', // Important to send cookies
            });

            if (!response.ok) {
                throw new Error('Failed to fetch tracks');
            }

            const data = await response.json();
            console.log('Tracks found:', data);

            // For now, just redirect to results after successful fetch
            // In a real app, we'd pass this data to the results page
            router.push("/results");
        } catch (error) {
            console.error('Error generating mix:', error);
            alert('Failed to generate mix. Please make sure you are logged in.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="relative flex h-auto min-h-screen w-full flex-col group/design-root overflow-x-hidden antialiased">
            {/* Top App Bar */}
            <header className="flex items-center bg-background-dark p-4 pb-2 justify-between sticky top-0 z-10">
                <div className="flex size-12 shrink-0 items-center justify-start text-white/60">
                    <Link href="/" className="flex items-center justify-center">
                        <span className="material-symbols-outlined text-3xl">arrow_back</span>
                    </Link>
                </div>
                <h1 className="text-white text-xl font-bold leading-tight tracking-[-0.015em] flex-1 text-center">
                    VibeMixer
                </h1>
                <div className="flex size-12 shrink-0 items-center justify-end text-white/60 gap-2">
                    <ThemeToggle />
                    <span className="material-symbols-outlined text-3xl">more_vert</span>
                </div>
            </header>

            <main className="flex flex-col flex-1 px-4 py-6 space-y-8 max-w-xl mx-auto w-full">
                {/* Headline Text */}
                <h2 className="text-white tracking-light text-[32px] font-bold leading-tight text-center pb-2 pt-4">
                    Craft Your Perfect Mix
                </h2>

                {/* Text Field */}
                <div className="flex flex-col w-full">
                    <label className="flex flex-col min-w-40 flex-1">
                        <p className="text-white/80 text-base font-medium leading-normal pb-2">
                            Tell VibeMixer your vibe
                        </p>
                        <textarea
                            value={mood}
                            onChange={(e) => setMood(e.target.value)}
                            className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-xl text-white focus:outline-0 focus:ring-2 focus:ring-primary/50 border-white/20 bg-surface-dark min-h-36 placeholder:text-white/40 p-4 text-base font-normal leading-normal"
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
                        <p className="text-white text-base font-medium leading-normal flex-1 truncate">
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
                        {/* Energy Slider */}
                        <div className="@container">
                            <div className="relative flex w-full flex-col items-start justify-between gap-3">
                                <div className="flex w-full shrink-[3] items-center justify-between">
                                    <p className="text-white text-base font-medium leading-normal">
                                        Energy
                                    </p>
                                    <p className="text-white/70 text-sm font-normal leading-normal">
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
                                    <p className="text-white text-base font-medium leading-normal">
                                        Tempo
                                    </p>
                                    <p className="text-white/70 text-sm font-normal leading-normal">
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
                                    <p className="text-white text-base font-medium leading-normal">
                                        Valence (Positivity)
                                    </p>
                                    <p className="text-white/70 text-sm font-normal leading-normal">
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
