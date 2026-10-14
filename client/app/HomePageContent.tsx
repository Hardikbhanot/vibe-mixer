"use client";

import Link from "next/link";
import { Header } from "@/components/Header";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import {
    Sparkles,
    Music,
    MapPin,
    Flame,
    Play,
    Users,
    Zap,
    Heart,
    Headphones,
    ArrowRight,
    Sliders,
    Camera,
    Radio,
    Disc3,
    CheckCircle2,
    XCircle,
    Activity,
    Layers,
    ExternalLink
} from "lucide-react";
import { useState, useRef } from "react";

// --- Preset Demo Vibes for the Interactive Hero Sandbox ---
const DEMO_VIBES = [
    {
        id: "tokyo",
        chip: "🌆 Tokyo Midnight Drive",
        prompt: "Neon-lit highways in Tokyo, synthwave bassline, high energy driving through rain",
        title: "Neon Expressway",
        artist: "Kavinsky • The Midnight • Gunship",
        bpm: 128,
        valence: "68% (Euphoric)",
        energy: "89% (High Drive)",
        ragMatch: "99.4%",
        color: "from-fuchsia-500 to-cyan-500"
    },
    {
        id: "coffee",
        chip: "☕ Rainy Sunday Lo-Fi",
        prompt: "Warm coffee shop in Kyoto, soft rhodes piano, vinyl crackle, cozy raindrops",
        title: "Kyoto Petrichor",
        artist: "Kowloon • idealism • Tomppabeats",
        bpm: 78,
        valence: "54% (Melancholic Peace)",
        energy: "32% (Deep Focus)",
        ragMatch: "98.7%",
        color: "from-amber-400 to-rose-400"
    },
    {
        id: "cyberpunk",
        chip: "⚡ Cyberpunk Workout",
        prompt: "Underground high-tech gym, dark industrial phonk, heavy distorted 808s",
        title: "Overclocked Pulse",
        artist: "Kordhell • DVRST • Pharmacist",
        bpm: 142,
        valence: "40% (Aggressive Focus)",
        energy: "98% (Peak Overdrive)",
        ragMatch: "99.8%",
        color: "from-purple-500 to-emerald-400"
    },
    {
        id: "sunset",
        chip: "🌅 Mediterranean Sunset",
        prompt: "Ibiza beach club sunset, organic afro house, warm melodic percussion, gentle sea breeze",
        title: "Balearic Horizon",
        artist: "Keinemusik • Black Coffee • Rampa",
        bpm: 122,
        valence: "86% (Pure Warmth)",
        energy: "74% (Smooth Groove)",
        ragMatch: "97.9%",
        color: "from-orange-400 to-pink-500"
    }
];

export default function HomePageContent({ jsonLd }: { jsonLd: any }) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [activeDemo, setActiveDemo] = useState(DEMO_VIBES[0]);
    const [isPlaying, setIsPlaying] = useState(true);

    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start start", "end end"]
    });

    const bgGlowY = useTransform(scrollYProgress, [0, 1], [0, -300]);

    return (
        <div ref={containerRef} className="relative min-h-screen bg-[#070709] text-white selection:bg-purple-500/30 font-display overflow-x-hidden">

            {/* Dynamic Mesh & Ambient Gradients */}
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
                <motion.div
                    style={{ y: bgGlowY }}
                    className="absolute -top-[25%] left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-gradient-to-b from-purple-600/20 via-primary/15 to-transparent rounded-full blur-[140px] opacity-70"
                />
                <div className="absolute top-[35%] -right-[15%] w-[700px] h-[700px] bg-cyan-500/10 rounded-full blur-[160px] pointer-events-none" />
                <div className="absolute top-[65%] -left-[15%] w-[700px] h-[700px] bg-purple-600/10 rounded-full blur-[160px] pointer-events-none" />
                {/* Subtle Grid Lines Overlay */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
            </div>

            {/* JSON-LD Script */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />

            <div className="relative z-10 flex flex-col min-h-screen">
                <Header />

                {/* ========================================================= */}
                {/* 1. HERO SECTION WITH INTERACTIVE STUDIO SANDBOX           */}
                {/* ========================================================= */}
                <section className="relative pt-12 pb-24 md:pt-20 md:pb-32 px-4 sm:px-6 max-w-7xl mx-auto w-full">
                    
                    {/* Top Product Announcement Pill */}
                    <div className="flex justify-center mb-8">
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                            className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] backdrop-blur-md hover:border-purple-500/40 transition-colors shadow-inner"
                        >
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
                            </span>
                            <span className="text-xs font-semibold tracking-wide text-white/90">
                                VibeMixer 2.5 • Autonomous Neural DJ
                            </span>
                            <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                                Live
                            </span>
                        </motion.div>
                    </div>

                    {/* Main Headings */}
                    <div className="text-center max-w-4xl mx-auto space-y-6 mb-12">
                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.7, delay: 0.1 }}
                            className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tight leading-[1.05]"
                        >
                            Soundtrack Your Life With{" "}
                            <span className="bg-gradient-to-r from-purple-400 via-fuchsia-300 to-cyan-400 bg-clip-text text-transparent">
                                Autonomous AI.
                            </span>
                        </motion.h1>

                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.7, delay: 0.2 }}
                            className="text-base sm:text-lg md:text-xl text-white/60 max-w-2xl mx-auto leading-relaxed"
                        >
                            Describe any scenario, upload a visual moodboard, or fine-tune harmonic coordinates. Our real-time RAG engine cross-references 15,000+ acoustic vectors and compiles directly to Spotify & YouTube.
                        </motion.p>

                        {/* Primary CTAs */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.7, delay: 0.3 }}
                            className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2"
                        >
                            <Link href="/generate" className="w-full sm:w-auto">
                                <button className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-purple-600 via-primary to-fuchsia-600 text-white font-bold text-base rounded-2xl hover:opacity-95 hover:scale-[1.02] shadow-[0_0_35px_-5px_rgba(138,43,226,0.6)] transition-all flex items-center justify-center gap-2.5">
                                    <Sparkles size={18} className="animate-spin-slow" />
                                    Launch AI Studio
                                </button>
                            </Link>

                            <Link href="/swipe" className="w-full sm:w-auto">
                                <button className="w-full sm:w-auto px-7 py-4 bg-white/[0.04] border border-white/[0.12] hover:bg-white/[0.08] hover:border-white/20 text-white font-semibold text-base rounded-2xl transition-all flex items-center justify-center gap-2">
                                    <Flame size={18} className="text-orange-400" />
                                    Try Taste Deck
                                </button>
                            </Link>
                        </motion.div>
                    </div>

                    {/* ========================================================= */}
                    {/* INTERACTIVE LIVE DEMO PREVIEW DOCK                        */}
                    {/* ========================================================= */}
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.4 }}
                        className="mt-8 max-w-4xl mx-auto"
                    >
                        {/* Interactive Pill Selector */}
                        <div className="flex flex-wrap items-center justify-center gap-2 mb-4">
                            <span className="text-xs font-semibold text-white/40 uppercase tracking-wider mr-2 hidden sm:inline">
                                Test A Live Vibe:
                            </span>
                            {DEMO_VIBES.map((vibe) => (
                                <button
                                    key={vibe.id}
                                    onClick={() => setActiveDemo(vibe)}
                                    className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 ${
                                        activeDemo.id === vibe.id
                                            ? "bg-white/15 text-white border border-purple-400/50 shadow-[0_0_15px_-3px_rgba(168,85,247,0.4)]"
                                            : "bg-white/[0.03] text-white/60 border border-white/[0.06] hover:bg-white/[0.08] hover:text-white"
                                    }`}
                                >
                                    {vibe.chip}
                                </button>
                            ))}
                        </div>

                        {/* Holographic Glass Player Dock */}
                        <div className="relative rounded-3xl p-6 sm:p-8 bg-black/60 border border-white/[0.12] backdrop-blur-2xl shadow-2xl overflow-hidden group">
                            {/* Ambient Top Light Beam */}
                            <div className="absolute top-0 left-1/4 right-1/4 h-[1px] bg-gradient-to-r from-transparent via-purple-400 to-transparent opacity-80" />
                            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />

                            <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                                
                                {/* Left: Vinyl & Cover Graphic */}
                                <div className="md:col-span-5 flex items-center gap-4">
                                    <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-gradient-to-tr from-purple-900 to-zinc-900 border border-white/20 p-2 shadow-xl shrink-0 flex items-center justify-center overflow-hidden">
                                        <div className={`absolute inset-0 bg-gradient-to-tr ${activeDemo.color} opacity-30`} />
                                        <Disc3 size={48} className={`text-white/80 ${isPlaying ? "animate-spin" : ""}`} style={{ animationDuration: '6s' }} />
                                        <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/80 backdrop-blur-md text-[9px] font-mono uppercase text-emerald-400 border border-emerald-500/30">
                                            RAG {activeDemo.ragMatch}
                                        </div>
                                    </div>

                                    <div className="min-w-0">
                                        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[11px] font-mono mb-1">
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                            Live Generation Preview
                                        </div>
                                        <h3 className="text-xl font-bold text-white truncate">{activeDemo.title}</h3>
                                        <p className="text-xs text-white/50 truncate mb-2">{activeDemo.artist}</p>
                                        
                                        {/* Animated Waveform Bars */}
                                        <div className="flex items-end gap-1 h-5">
                                            {[40, 75, 100, 60, 90, 45, 80, 65, 95, 50, 70, 85].map((h, i) => (
                                                <motion.span
                                                    key={i}
                                                    animate={{ height: isPlaying ? [`${h * 0.3}%`, `${h}%`, `${h * 0.4}%`] : `${h * 0.3}%` }}
                                                    transition={{ repeat: Infinity, duration: 0.8 + (i * 0.08), ease: "easeInOut" }}
                                                    className="w-1 bg-gradient-to-t from-purple-500 to-cyan-400 rounded-full"
                                                />
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Middle: Telemetry Attributes */}
                                <div className="md:col-span-4 grid grid-cols-2 gap-2 text-left bg-white/[0.02] border border-white/[0.06] rounded-2xl p-3">
                                    <div className="p-2">
                                        <div className="text-[10px] text-white/40 uppercase tracking-wider font-mono">BPM Cadence</div>
                                        <div className="text-sm font-bold text-white font-mono flex items-center gap-1.5">
                                            <Activity size={12} className="text-purple-400" />
                                            {activeDemo.bpm} BPM
                                        </div>
                                    </div>
                                    <div className="p-2">
                                        <div className="text-[10px] text-white/40 uppercase tracking-wider font-mono">Energy</div>
                                        <div className="text-sm font-bold text-white font-mono flex items-center gap-1.5">
                                            <Zap size={12} className="text-cyan-400" />
                                            {activeDemo.energy}
                                        </div>
                                    </div>
                                    <div className="p-2 col-span-2 border-t border-white/[0.05]">
                                        <div className="text-[10px] text-white/40 uppercase tracking-wider font-mono">Mood Vector</div>
                                        <div className="text-xs font-semibold text-white/90">
                                            {activeDemo.valence}
                                        </div>
                                    </div>
                                </div>

                                {/* Right: Launch Button */}
                                <div className="md:col-span-3 flex flex-col gap-2">
                                    <Link href="/generate" className="w-full">
                                        <button className="w-full py-3 px-4 bg-white text-black hover:bg-white/90 font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg flex items-center justify-center gap-2">
                                            Generate Full Mix
                                            <ArrowRight size={14} />
                                        </button>
                                    </Link>
                                    <div className="flex items-center justify-center gap-3 text-[11px] text-white/50 pt-1">
                                        <span className="flex items-center gap-1 text-[#1DB954]">
                                            <span className="w-1.5 h-1.5 rounded-full bg-[#1DB954]" /> Spotify Ready
                                        </span>
                                        <span className="flex items-center gap-1 text-[#FF0000]">
                                            <span className="w-1.5 h-1.5 rounded-full bg-[#FF0000]" /> YouTube Sync
                                        </span>
                                    </div>
                                </div>

                            </div>
                        </div>
                    </motion.div>

                </section>

                {/* ========================================================= */}
                {/* 2. ENTERPRISE TRUST & METRICS STRIP                      */}
                {/* ========================================================= */}
                <section className="py-10 border-y border-white/[0.07] bg-black/40 backdrop-blur-md">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 divide-x divide-white/[0.06]">
                            <div className="text-center px-4">
                                <div className="text-3xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-white">
                                    14,800+
                                </div>
                                <div className="text-xs font-semibold uppercase tracking-wider text-white/50 mt-1">
                                    Vector Knowledge Base
                                </div>
                            </div>
                            <div className="text-center px-4">
                                <div className="text-3xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-white">
                                    2.5M+
                                </div>
                                <div className="text-xs font-semibold uppercase tracking-wider text-white/50 mt-1">
                                    Tracks Sequenced
                                </div>
                            </div>
                            <div className="text-center px-4">
                                <div className="text-3xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-white">
                                    0.8s
                                </div>
                                <div className="text-xs font-semibold uppercase tracking-wider text-white/50 mt-1">
                                    Average Latency
                                </div>
                            </div>
                            <div className="text-center px-4">
                                <div className="text-3xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-white">
                                    99.9%
                                </div>
                                <div className="text-xs font-semibold uppercase tracking-wider text-white/50 mt-1">
                                    Zero Hallucination
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ========================================================= */}
                {/* 3. BENTO GRID ARCHITECTURE ("NEXT-GEN ACOUSTIC ENGINE")    */}
                {/* ========================================================= */}
                <section className="py-24 sm:py-32 max-w-7xl mx-auto px-4 sm:px-6 w-full">
                    
                    <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-xs font-mono uppercase tracking-wider text-purple-300">
                            Acoustic Intelligence
                        </div>
                        <h2 className="text-3xl sm:text-5xl font-black tracking-tight">
                            Engineered for Discerning Ears.
                        </h2>
                        <p className="text-white/60 text-base sm:text-lg">
                            Standard algorithms lock you in echo chambers. VibeMixer combines semantic natural language embeddings with multidimensional harmonic coordinates.
                        </p>
                    </div>

                    {/* The Bento Grid Layout */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">

                        {/* Bento Card 1: 2D Mood Space (Large, 8 Cols) */}
                        <motion.div
                            whileHover={{ y: -4 }}
                            transition={{ duration: 0.2 }}
                            className="md:col-span-8 rounded-3xl p-8 bg-gradient-to-br from-white/[0.05] to-white/[0.01] border border-white/[0.1] relative overflow-hidden group shadow-xl"
                        >
                            <div className="absolute top-0 right-0 w-80 h-80 bg-purple-600/10 rounded-full blur-[100px] pointer-events-none" />
                            
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                                <div>
                                    <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center mb-3">
                                        <Sliders size={20} className="text-purple-300" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-white">Continuous Harmonic Vectoring</h3>
                                    <p className="text-sm text-white/60 mt-1 max-w-md">
                                        Precision control over Energy, Valence (Happiness), and Tempo curves rather than rigid genre buckets.
                                    </p>
                                </div>
                                <span className="text-[11px] font-mono px-2.5 py-1 rounded-lg bg-white/[0.05] border border-white/[0.1] text-white/70">
                                    768-Dim Vector Space
                                </span>
                            </div>

                            {/* Visual Coordinate Plane */}
                            <div className="h-48 sm:h-56 w-full rounded-2xl bg-black/50 border border-white/[0.08] relative overflow-hidden flex items-center justify-center p-4">
                                <div className="absolute inset-0 bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] bg-[size:16px_16px]" />
                                
                                {/* Center Axes */}
                                <div className="absolute left-1/2 top-0 bottom-0 w-[1px] bg-white/[0.1]" />
                                <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-white/[0.1]" />

                                {/* Quadrant Labels */}
                                <span className="absolute top-3 left-4 text-[10px] font-mono text-white/40 uppercase">Intense / Dark</span>
                                <span className="absolute top-3 right-4 text-[10px] font-mono text-purple-300 uppercase">Euphoric / Energetic</span>
                                <span className="absolute bottom-3 left-4 text-[10px] font-mono text-white/40 uppercase">Melancholic / Chill</span>
                                <span className="absolute bottom-3 right-4 text-[10px] font-mono text-cyan-300 uppercase">Peaceful / Ambient</span>

                                {/* Draggable Point Simulation */}
                                <motion.div
                                    animate={{
                                        x: [20, 60, 40, -10, 20],
                                        y: [-30, -10, 40, -40, -30],
                                    }}
                                    transition={{ repeat: Infinity, duration: 8, ease: "easeInOut" }}
                                    className="relative z-10 w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-cyan-400 p-[2px] shadow-[0_0_25px_rgba(168,85,247,0.8)]"
                                >
                                    <div className="w-full h-full rounded-full bg-black flex items-center justify-center">
                                        <div className="w-2.5 h-2.5 rounded-full bg-white animate-ping" />
                                    </div>
                                </motion.div>
                            </div>
                        </motion.div>

                        {/* Bento Card 2: Vision AI (Medium, 4 Cols) */}
                        <motion.div
                            whileHover={{ y: -4 }}
                            transition={{ duration: 0.2 }}
                            className="md:col-span-4 rounded-3xl p-8 bg-gradient-to-br from-white/[0.05] to-white/[0.01] border border-white/[0.1] relative overflow-hidden group shadow-xl flex flex-col justify-between"
                        >
                            <div>
                                <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center mb-4">
                                    <Camera size={20} className="text-cyan-300" />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2">Vision-to-Soundtrack</h3>
                                <p className="text-sm text-white/60 leading-relaxed mb-6">
                                    Drop any photograph or aesthetic moodboard. Llama 3.2 Vision decodes lighting, scenery, and mood into an instant acoustic score.
                                </p>
                            </div>

                            <div className="h-32 rounded-2xl bg-black/40 border border-dashed border-white/20 flex flex-col items-center justify-center gap-2 text-center p-4">
                                <Camera size={24} className="text-white/40 group-hover:text-cyan-400 transition-colors" />
                                <span className="text-xs text-white/60">Upload photo for visual analysis</span>
                            </div>
                        </motion.div>

                        {/* Bento Card 3: Taste Deck (Medium, 4 Cols) */}
                        <motion.div
                            whileHover={{ y: -4 }}
                            transition={{ duration: 0.2 }}
                            className="md:col-span-4 rounded-3xl p-8 bg-gradient-to-br from-white/[0.05] to-white/[0.01] border border-white/[0.1] relative overflow-hidden group shadow-xl flex flex-col justify-between"
                        >
                            <div>
                                <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center mb-4">
                                    <Flame size={20} className="text-rose-400" />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2">Autonomous Taste Deck</h3>
                                <p className="text-sm text-white/60 leading-relaxed mb-6">
                                    Active feedback loop. Swipe right to like or left to pass. The vector pipeline adjusts future playlist seeds to your individual profile.
                                </p>
                            </div>

                            <Link href="/swipe">
                                <button className="w-full py-2.5 rounded-xl bg-white/[0.05] border border-white/10 hover:bg-white/[0.1] text-xs font-bold uppercase tracking-wider text-white transition-all flex items-center justify-center gap-2">
                                    Open Swipe Deck <ArrowRight size={14} />
                                </button>
                            </Link>
                        </motion.div>

                        {/* Bento Card 4: Regional Indian Soundscapes (Medium, 4 Cols) */}
                        <motion.div
                            whileHover={{ y: -4 }}
                            transition={{ duration: 0.2 }}
                            className="md:col-span-4 rounded-3xl p-8 bg-gradient-to-br from-white/[0.05] to-white/[0.01] border border-white/[0.1] relative overflow-hidden group shadow-xl flex flex-col justify-between"
                        >
                            <div>
                                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mb-4">
                                    <MapPin size={20} className="text-emerald-400" />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2">Regional Radar</h3>
                                <p className="text-sm text-white/60 leading-relaxed mb-6">
                                    Explore authentic cultural sounds with our interactive D3 India Radar—from Punjabi trap and Sufi acoustics to Kerala indie rock.
                                </p>
                            </div>

                            <Link href="/india">
                                <button className="w-full py-2.5 rounded-xl bg-white/[0.05] border border-white/10 hover:bg-white/[0.1] text-xs font-bold uppercase tracking-wider text-white transition-all flex items-center justify-center gap-2">
                                    Explore Map <ArrowRight size={14} />
                                </button>
                            </Link>
                        </motion.div>

                        {/* Bento Card 5: Universal Dual Sync (Medium, 4 Cols) */}
                        <motion.div
                            whileHover={{ y: -4 }}
                            transition={{ duration: 0.2 }}
                            className="md:col-span-4 rounded-3xl p-8 bg-gradient-to-br from-white/[0.05] to-white/[0.01] border border-white/[0.1] relative overflow-hidden group shadow-xl flex flex-col justify-between"
                        >
                            <div>
                                <div className="w-10 h-10 rounded-xl bg-yellow-500/20 border border-yellow-500/30 flex items-center justify-center mb-4">
                                    <Layers size={20} className="text-yellow-400" />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2">Universal Streaming Sync</h3>
                                <p className="text-sm text-white/60 leading-relaxed mb-6">
                                    Never manually build a playlist again. Single-click deployment exports full song queues, metadata, and custom AI cover art into your library.
                                </p>
                            </div>

                            <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-black/40 border border-white/[0.08]">
                                <span className="text-xs font-semibold text-[#1DB954] flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full bg-[#1DB954]" /> Spotify API
                                </span>
                                <span className="text-xs font-semibold text-[#FF0000] flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full bg-[#FF0000]" /> YouTube Data v3
                                </span>
                            </div>
                        </motion.div>

                    </div>
                </section>

                {/* ========================================================= */}
                {/* 4. COMPARISON MATRIX: WHY VIBEMIXER                      */}
                {/* ========================================================= */}
                <section className="py-20 border-t border-white/[0.07] bg-black/30">
                    <div className="max-w-5xl mx-auto px-4 sm:px-6">
                        <div className="text-center mb-14 space-y-3">
                            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">Why Curators Choose VibeMixer</h2>
                            <p className="text-white/60 text-sm sm:text-base">See how our neural architecture compares to standard streaming and general chatbots.</p>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse min-w-[600px]">
                                <thead>
                                    <tr className="border-b border-white/10 text-xs font-mono uppercase tracking-wider text-white/50">
                                        <th className="py-4 px-4">Feature</th>
                                        <th className="py-4 px-4">Spotify Daily Mix</th>
                                        <th className="py-4 px-4">ChatGPT Prompts</th>
                                        <th className="py-4 px-4 text-purple-400 font-bold">VibeMixer Engine</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/[0.05] text-sm">
                                    <tr>
                                        <td className="py-4 px-4 font-semibold text-white">Prompt-to-Acoustic Grounding</td>
                                        <td className="py-4 px-4 text-white/40"><XCircle size={16} className="text-rose-500 inline mr-1" /> Generic genres</td>
                                        <td className="py-4 px-4 text-white/40"><XCircle size={16} className="text-rose-500 inline mr-1" /> No audio features</td>
                                        <td className="py-4 px-4 text-emerald-400 font-semibold"><CheckCircle2 size={16} className="text-emerald-400 inline mr-1" /> Valence, BPM & Tempo</td>
                                    </tr>
                                    <tr>
                                        <td className="py-4 px-4 font-semibold text-white">Zero Fake / Hallucinated Songs</td>
                                        <td className="py-4 px-4 text-white/40"><CheckCircle2 size={16} className="text-emerald-400 inline mr-1" /> Verified</td>
                                        <td className="py-4 px-4 text-white/40"><XCircle size={16} className="text-rose-500 inline mr-1" /> High hallucination</td>
                                        <td className="py-4 px-4 text-emerald-400 font-semibold"><CheckCircle2 size={16} className="text-emerald-400 inline mr-1" /> 100% Verified pgvector DB</td>
                                    </tr>
                                    <tr>
                                        <td className="py-4 px-4 font-semibold text-white">Visual Moodboard Uploads</td>
                                        <td className="py-4 px-4 text-white/40"><XCircle size={16} className="text-rose-500 inline mr-1" /> Not supported</td>
                                        <td className="py-4 px-4 text-white/40"><XCircle size={16} className="text-rose-500 inline mr-1" /> Text only output</td>
                                        <td className="py-4 px-4 text-emerald-400 font-semibold"><CheckCircle2 size={16} className="text-emerald-400 inline mr-1" /> Multimodal LPU Vision</td>
                                    </tr>
                                    <tr>
                                        <td className="py-4 px-4 font-semibold text-white">1-Click Dual Streaming Sync</td>
                                        <td className="py-4 px-4 text-white/40"><XCircle size={16} className="text-rose-500 inline mr-1" /> Spotify only</td>
                                        <td className="py-4 px-4 text-white/40"><XCircle size={16} className="text-rose-500 inline mr-1" /> Manual copying</td>
                                        <td className="py-4 px-4 text-emerald-400 font-semibold"><CheckCircle2 size={16} className="text-emerald-400 inline mr-1" /> Spotify & YouTube</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </section>

                {/* ========================================================= */}
                {/* 5. HIGH-IMPACT FINAL CTA                                 */}
                {/* ========================================================= */}
                <section className="py-24 sm:py-32 px-4 relative overflow-hidden">
                    <div className="max-w-4xl mx-auto rounded-3xl p-10 sm:p-14 bg-gradient-to-b from-purple-900/40 via-black to-black border border-purple-500/30 text-center relative overflow-hidden shadow-2xl">
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-purple-500/20 rounded-full blur-[120px] pointer-events-none" />
                        
                        <div className="relative z-10 space-y-6">
                            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
                                Ready To Redefine Your Listening Experience?
                            </h2>
                            <p className="text-white/60 text-base sm:text-lg max-w-xl mx-auto">
                                Join thousands of listeners curating the future of music. Free to start, instant to sync.
                            </p>
                            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
                                <Link href="/generate">
                                    <button className="w-full sm:w-auto px-9 py-4 bg-white text-black font-bold text-base rounded-2xl hover:bg-white/90 hover:scale-105 transition-all shadow-xl">
                                        Start Generating Free
                                    </button>
                                </Link>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ========================================================= */}
                {/* 6. STARTUP-GRADE ENTERPRISE FOOTER                       */}
                {/* ========================================================= */}
                <footer className="py-16 border-t border-white/[0.08] bg-[#050507] text-white/60 text-sm">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-2 md:grid-cols-5 gap-10 mb-12">
                        
                        {/* Col 1: Brand & Status */}
                        <div className="col-span-2 space-y-4">
                            <div className="flex items-center gap-2">
                                <Headphones size={22} className="text-purple-400" />
                                <span className="text-white font-bold text-xl tracking-wide">VibeMixer</span>
                            </div>
                            <p className="text-xs text-white/50 max-w-xs leading-relaxed">
                                The autonomous neural engine for contextual music discovery and algorithmic synthesis.
                            </p>
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-mono text-emerald-400">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                All Systems Operational
                            </div>
                        </div>

                        {/* Col 2: Studio */}
                        <div className="space-y-3">
                            <h4 className="text-xs font-mono uppercase tracking-wider text-white">Studio</h4>
                            <ul className="space-y-2 text-xs">
                                <li><Link href="/generate" className="hover:text-white transition-colors">AI Studio</Link></li>
                                <li><Link href="/swipe" className="hover:text-white transition-colors">Taste Deck</Link></li>
                                <li><Link href="/india" className="hover:text-white transition-colors">Regional Radar</Link></li>
                                <li><Link href="/discover" className="hover:text-white transition-colors">Community Feed</Link></li>
                            </ul>
                        </div>

                        {/* Col 3: Integrations */}
                        <div className="space-y-3">
                            <h4 className="text-xs font-mono uppercase tracking-wider text-white">Integrations</h4>
                            <ul className="space-y-2 text-xs">
                                <li><span className="text-white/40">Spotify Web API</span></li>
                                <li><span className="text-white/40">YouTube Data v3</span></li>
                                <li><span className="text-white/40">Groq LPU Acceleration</span></li>
                                <li><span className="text-white/40">Google Gemini Embeddings</span></li>
                            </ul>
                        </div>

                        {/* Col 4: Platform & Legal */}
                        <div className="space-y-3">
                            <h4 className="text-xs font-mono uppercase tracking-wider text-white">Legal</h4>
                            <ul className="space-y-2 text-xs">
                                <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                                <li><Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
                                <li><a href="mailto:support@vibemixer.hbhanot.tech" className="hover:text-white transition-colors">Support Contact</a></li>
                            </ul>
                        </div>

                    </div>

                    <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 border-t border-white/[0.05] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/40">
                        <div>© {new Date().getFullYear()} VibeMixer Technologies Inc. All rights reserved.</div>
                        <div className="flex items-center gap-6">
                            <span>Designed for music lovers worldwide</span>
                        </div>
                    </div>
                </footer>

            </div>
        </div>
    );
}
