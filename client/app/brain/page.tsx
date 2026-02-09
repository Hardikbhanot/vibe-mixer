'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Brain, Music, Disc } from 'lucide-react';

export default function DebugPage() {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    const handleProbe = async () => {
        if (!query.trim()) return;
        setLoading(true);
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
        try {
            const res = await fetch(`${apiUrl}/ai/vector-probe`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query })
            });
            const data = await res.json();
            setResults(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const getScoreColor = (score: number) => {
        if (score >= 40) return 'bg-green-500'; // High relevance (Semantic Match)
        if (score >= 25) return 'bg-yellow-500'; // Moderate
        return 'bg-gray-600'; // Low
    };

    return (
        <div className="min-h-screen bg-black text-white p-6 pt-24">
            <div className="max-w-4xl mx-auto space-y-8">

                <header className="space-y-2">
                    <h1 className="text-3xl font-bold flex items-center gap-2">
                        <Brain className="text-purple-500" />
                        How VibeMixer Thinks
                    </h1>
                    <p className="text-gray-400">
                        Explore our <strong>RAG (Retrieval-Augmented Generation)</strong> engine.
                        Type a vibe below to see how we mathematically match your mood to specific songs and playlists using AI vectors.
                    </p>
                </header>

                {/* Input Area */}
                <div className="flex gap-4">
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder='Enter a vibe (e.g., "90s indian nostalgia")'
                        className="flex-1 bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500 transition"
                        onKeyDown={(e) => e.key === 'Enter' && handleProbe()}
                    />
                    <button
                        onClick={handleProbe}
                        disabled={loading}
                        className="bg-purple-600 hover:bg-purple-700 px-6 py-3 rounded-xl font-medium transition disabled:opacity-50 flex items-center gap-2"
                    >
                        {loading ? 'Scanning...' : <><Search size={18} /> Probe</>}
                    </button>
                </div>

                {/* Results Grid */}
                {results && (
                    <div className="grid md:grid-cols-2 gap-8">

                        {/* Playlists Column */}
                        <div className="space-y-4">
                            <h2 className="text-xl font-semibold flex items-center gap-2 text-blue-400">
                                <Disc size={20} /> Playlist Matches (Macro)
                            </h2>
                            <div className="space-y-3">
                                {results.playlists.map((p: any, i: number) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.1 }}
                                        className="bg-gray-900/50 p-4 rounded-lg border border-gray-800"
                                    >
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="font-medium truncate">{p.name}</span>
                                            <span className={`text-xs px-2 py-1 rounded-full font-bold text-black ${getScoreColor(parseFloat(p.score))}`}>
                                                {p.score}%
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-500 line-clamp-2">{p.description}</p>
                                        {/* Progress Bar */}
                                        <div className="mt-3 h-1 bg-gray-800 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full ${getScoreColor(parseFloat(p.score))}`}
                                                style={{ width: `${p.score}%` }}
                                            />
                                        </div>
                                    </motion.div>
                                ))}
                                {results.playlists.length === 0 && <p className="text-gray-600">No playlist matches found.</p>}
                            </div>
                        </div>

                        {/* Lyrics Column */}
                        <div className="space-y-4">
                            <h2 className="text-xl font-semibold flex items-center gap-2 text-green-400">
                                <Music size={20} /> Lyrical Matches (Micro)
                            </h2>
                            <div className="space-y-3">
                                {results.lyrics.map((l: any, i: number) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.1 }}
                                        className="bg-gray-900/50 p-4 rounded-lg border border-gray-800"
                                    >
                                        <div className="flex justify-between items-center mb-2">
                                            <div className="truncate">
                                                <span className="font-medium block">{l.title}</span>
                                                <span className="text-xs text-gray-400">{l.artist}</span>
                                            </div>
                                            <span className={`text-xs px-2 py-1 rounded-full font-bold text-black ${getScoreColor(parseFloat(l.score))}`}>
                                                {l.score}%
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-400 italic border-l-2 border-gray-700 pl-2">
                                            "{l.snippet}..."
                                        </p>
                                        {/* Progress Bar */}
                                        <div className="mt-3 h-1 bg-gray-800 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full ${getScoreColor(parseFloat(l.score))}`}
                                                style={{ width: `${l.score}%` }}
                                            />
                                        </div>
                                    </motion.div>
                                ))}
                                {results.lyrics.length === 0 && <p className="text-gray-600">No lyrical matches found.</p>}
                            </div>
                        </div>

                    </div>
                )}
            </div>
        </div>
    );
}
