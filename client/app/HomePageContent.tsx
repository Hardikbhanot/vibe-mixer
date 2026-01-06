"use client";

import Link from "next/link";
import { Header } from "@/components/Header";
import { motion, useScroll, useTransform } from "framer-motion";
import {
    Sparkles,
    Music,
    MapPin,
    MessageCircle,
    Play,
    Users,
    Zap,
    Heart,
    Headphones,
    ArrowRight
} from "lucide-react";
import { useRef } from "react";

// --- Components ---

const FadeIn = ({ children, delay = 0, className = "" }: { children: React.ReactNode, delay?: number, className?: string }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay, ease: "easeOut" }}
        className={className}
    >
        {children}
    </motion.div>
);

const FeatureCard = ({ icon: Icon, title, desc, delay, href }: any) => (
    <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay }}
        className="group relative p-8 rounded-3xl bg-white/5 border border-white/10 hover:border-primary/50 transition-colors overflow-hidden"
    >
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="relative z-10">
            <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                <Icon className="text-primary" size={24} />
            </div>
            <h3 className="text-xl font-bold mb-3 text-white">{title}</h3>
            <p className="text-white/60 mb-6 leading-relaxed">{desc}</p>
            {href && (
                <Link href={href} className="flex items-center gap-2 text-sm font-bold text-primary hover:text-primary/80 transition-colors">
                    Try it out <ArrowRight size={16} />
                </Link>
            )}
        </div>
    </motion.div>
);

const Stat = ({ label, value, delay }: any) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay }}
        className="text-center"
    >
        <div className="text-4xl md:text-5xl font-black bg-gradient-to-b from-primary to-primary/50 bg-clip-text text-transparent mb-2">
            {value}
        </div>
        <div className="text-sm font-medium text-white/50 uppercase tracking-wider">{label}</div>
    </motion.div>
);

export default function HomePageContent({ jsonLd }: { jsonLd: any }) {
    const containerRef = useRef(null);
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start start", "end end"]
    });

    // Parallax background y values
    const y1 = useTransform(scrollYProgress, [0, 1], [0, -200]);
    const y2 = useTransform(scrollYProgress, [0, 1], [0, -500]);

    return (
        <div ref={containerRef} className="relative min-h-screen bg-[#050505] text-white selection:bg-primary/30 font-display overflow-x-hidden">

            {/* Dynamic Background */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <motion.div style={{ y: y1 }} className="absolute -top-[20%] -left-[10%] w-[800px] h-[800px] bg-primary/20 rounded-full blur-[100px] opacity-30" />
                <motion.div style={{ y: y2 }} className="absolute top-[40%] -right-[20%] w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[100px] opacity-30" />
            </div>

            {/* JSON-LD Script */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />

            <div className="relative z-10 flex flex-col min-h-screen">
                <Header />

                {/* --- Hero Section --- */}
                <section className="relative pt-20 pb-32 md:pt-32 md:pb-48 px-4 text-center">
                    <div className="max-w-4xl mx-auto space-y-8">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm font-medium text-primary mb-4"
                        >
                            <Sparkles size={16} /> 2.0 Now Live
                        </motion.div>

                        <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter leading-[0.9]">
                            <motion.span
                                initial={{ opacity: 0, y: 50 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.8, delay: 0.1 }}
                                className="block"
                            >
                                Your Mood.
                            </motion.span>
                            <motion.span
                                initial={{ opacity: 0, y: 50 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.8, delay: 0.2 }}
                                className="block text-transparent bg-clip-text bg-gradient-to-r from-primary via-purple-400 to-blue-500 animate-gradient-x"
                            >
                                Your Vibe.
                            </motion.span>
                            <motion.span
                                initial={{ opacity: 0, y: 50 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.8, delay: 0.3 }}
                                className="block"
                            >
                                Instantly.
                            </motion.span>
                        </h1>

                        <FadeIn delay={0.4} className="max-w-xl mx-auto">
                            <p className="text-lg md:text-xl text-white/60 leading-relaxed">
                                Stop scrolling and start vibing. Describe your moment—VibeMixer uses AI to curate the perfect playlist and syncs it to Spotify & YouTube in seconds.
                            </p>
                        </FadeIn>

                        <FadeIn delay={0.5} className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                            <Link href="/generate" className="w-full sm:w-auto">
                                <button className="w-full sm:w-auto px-8 py-4 bg-primary text-black font-bold text-lg rounded-full hover:scale-105 hover:shadow-[0_0_40px_-10px_rgba(var(--primary-rgb),0.5)] transition-all flex items-center justify-center gap-2">
                                    <Zap size={20} fill="black" />
                                    Generate Vibe
                                </button>
                            </Link>
                            <Link href="/discover" className="w-full sm:w-auto">
                                <button className="w-full sm:w-auto px-8 py-4 bg-white/5 border border-white/10 text-white font-bold text-lg rounded-full hover:bg-white/10 transition-all flex items-center justify-center gap-2">
                                    Explore Feed
                                </button>
                            </Link>
                        </FadeIn>
                    </div>
                </section>

                {/* --- Live Stats --- */}
                <section className="py-12 border-y border-white/5 bg-black/50 backdrop-blur-sm">
                    <div className="container mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8">
                        <Stat label="Vibes Generated" value="12k+" delay={0.1} />
                        <Stat label="Active Users" value="850+" delay={0.2} />
                        <Stat label="Songs Curated" value="2.5M" delay={0.3} />
                        <Stat label="Avg. Response" value="1.2s" delay={0.4} />
                    </div>
                </section>

                {/* --- Features Grid --- */}
                <section className="py-32 container mx-auto px-4">
                    <FadeIn className="text-center mb-16">
                        <h2 className="text-4xl font-bold mb-4">More than just a playlist generator.</h2>
                        <p className="text-white/60 text-lg">A complete ecosystem for music discovery and community.</p>
                    </FadeIn>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <FeatureCard
                            icon={Music}
                            title="AI Curation"
                            desc="Describe a scenario like 'Late night drive in Tokyo' and get a perfectly sequenced playlist."
                            delay={0.1}
                            href="/generate"
                        />
                        <FeatureCard
                            icon={Heart}
                            title="Tinder for Music"
                            desc="Swipe right on tracks you love to train your personal AI recommendation engine."
                            delay={0.2}
                            href="/swipe"
                        />
                        <FeatureCard
                            icon={MapPin}
                            title="Indian Vibe Map"
                            desc="Interactive musical map of India. Discover regional hits from Punjab to Kerala."
                            delay={0.3}
                            href="/india"
                        />
                        <FeatureCard
                            icon={Users}
                            title="Community Feed"
                            desc="See what others are listening to. Save their vibes or remix them for yourself."
                            delay={0.4}
                            href="/discover"
                        />
                        <FeatureCard
                            icon={MessageCircle}
                            title="Social Messaging"
                            desc="Connect with other curators. Chat about music, exchange tracks, and vibe together."
                            delay={0.5}
                            href="/messages"
                        />
                        <FeatureCard
                            icon={Play}
                            title="Dual Sync"
                            desc="We integrate with both Spotify and YouTube, so you can listen wherever you want."
                            delay={0.6}
                        />
                    </div>
                </section>

                {/* --- Footer --- */}
                <footer className="py-12 border-t border-white/10 bg-black text-center text-white/40">
                    <div className="flex items-center justify-center gap-2 mb-4">
                        <Headphones size={24} className="text-primary" />
                        <span className="text-white font-bold text-xl">VibeMixer</span>
                    </div>
                    <p className="mb-8">Orchestrating the soundtrack of your life.</p>
                    <div className="flex justify-center gap-6 text-sm">
                        <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
                        <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
                        <Link href="https://github.com/Hardikbhanot" target="_blank" className="hover:text-white transition-colors">GitHub</Link>
                    </div>
                    <div className="mt-8 text-xs">
                        © 2026 VibeMixer. All rights reserved.
                    </div>
                </footer>

            </div>
        </div>
    );
}
