"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { ArrowLeft, Brain, Info, Database, Zap } from "lucide-react";

export default function BreakdownPage() {
    const router = useRouter();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const storedData = localStorage.getItem('playlistData');
        if (storedData) {
            setData(JSON.parse(storedData));
        }
        setLoading(false);
    }, []);

    if (loading) return <div className="min-h-screen flex items-center justify-center">Loading breakdown...</div>;
    if (!data) return <div className="min-h-screen flex items-center justify-center">No data found.</div>;

    const getScoreColor = (score: number) => {
        if (score >= 90) return 'text-green-500 bg-green-500/10 border-green-500/20';
        if (score >= 80) return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
        return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
    };

    return (
        <div className="min-h-screen bg-black text-white p-6 pt-24 font-sans">
            <Header />

            <div className="max-w-4xl mx-auto">
                <div className="flex items-center gap-4 mb-8">
                    <button onClick={() => router.back()} className="p-2 bg-gray-900 rounded-full hover:bg-gray-800 transition">
                        <ArrowLeft size={20} />
                    </button>
                    <h1 className="text-3xl font-bold flex items-center gap-2">
                        <Brain className="text-purple-500" />
                        AI Vibe Breakdown
                    </h1>
                </div>

                {/* --- GUIDE SECTION --- */}
                <div className="grid md:grid-cols-3 gap-4 mb-10">
                    <div className="bg-gray-900/50 p-5 rounded-2xl border border-gray-800">
                        <div className="flex items-center gap-2 mb-2 text-green-400 font-bold">
                            <Database size={18} />
                            <span>Vector Match</span>
                        </div>
                        <p className="text-sm text-gray-400">
                            The "Gold Standard". The AI found a mathematically identical match in our database (Lyrics or Playlist vibes).
                        </p>
                    </div>
                    <div className="bg-gray-900/50 p-5 rounded-2xl border border-gray-800">
                        <div className="flex items-center gap-2 mb-2 text-blue-400 font-bold">
                            <Zap size={18} />
                            <span>AI Prediction</span>
                        </div>
                        <p className="text-sm text-gray-400">
                            The "Creative Spark". Llama 3 predicted this song fits perfectly based on your mood, even if we don't have its lyrics stored yet.
                        </p>
                    </div>
                    <div className="bg-gray-900/50 p-5 rounded-2xl border border-gray-800">
                        <div className="flex items-center gap-2 mb-2 text-yellow-400 font-bold">
                            <Info size={18} />
                            <span>Confidence Score</span>
                        </div>
                        <p className="text-sm text-gray-400">
                            A percentage (0-100%) showing how sure the AI is. Above 90% is a guaranteed banger.
                        </p>
                    </div>
                </div>

                {/* --- TRACK LIST --- */}
                <div className="space-y-4">
                    {data.tracks.map((track: any, i: number) => (
                        <div key={i} className="bg-gray-900/30 p-4 rounded-xl border border-gray-800 flex flex-col md:flex-row gap-6 hover:bg-gray-900/50 transition">
                            {/* Number & Art */}
                            <div className="flex items-center gap-4 shrink-0">
                                <span className="text-gray-500 font-mono w-6 text-center">{i + 1}</span>
                                <img src={track.image || track.album?.images?.[0]?.url || '/placeholder.png'} className="w-16 h-16 rounded-lg object-cover" />
                            </div>

                            {/* Info & Reason */}
                            <div className="flex-1">
                                <h3 className="font-bold text-lg">{track.name}</h3>
                                <p className="text-gray-400 text-sm mb-3">{track.artist}</p>

                                <div className="bg-purple-900/20 p-3 rounded-lg border border-purple-500/20">
                                    <p className="text-sm text-purple-200 italic">
                                        "{track.ai_reason || 'Perfect conceptual fit.'}"
                                    </p>
                                </div>
                            </div>

                            {/* Score Badge */}
                            <div className="shrink-0 flex flex-col items-end justify-center min-w-[140px] gap-2">
                                <div className={`px-3 py-1 rounded-full text-xs font-bold border ${getScoreColor(track.confidence_score || 90)}`}>
                                    {track.match_type || 'AI Predicted'}
                                </div>
                                <div className="flex items-center gap-2 w-full">
                                    <div className="h-2 bg-gray-700 rounded-full flex-1 overflow-hidden">
                                        <div
                                            className="h-full bg-current opacity-80"
                                            style={{
                                                width: `${track.confidence_score || 90}%`,
                                                backgroundColor: (track.confidence_score || 90) >= 90 ? '#22c55e' : '#3b82f6'
                                            }}
                                        />
                                    </div>
                                    <span className="text-sm font-mono font-bold">{track.confidence_score || 90}%</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

            </div>
        </div>
    );
}
