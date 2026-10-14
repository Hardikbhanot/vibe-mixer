"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Headphones } from 'lucide-react';

export const Footer = () => {
    const pathname = usePathname();

    // The homepage has its own full-width multi-column footer
    if (pathname === '/') {
        return null;
    }

    return (
        <footer className="w-full py-8 mt-auto border-t border-white/[0.08] bg-[#070709] text-white/50 text-xs">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <Headphones size={16} className="text-purple-400" />
                    <span className="font-bold text-white tracking-wide">VibeMixer</span>
                    <span className="text-white/20">•</span>
                    <span>© {new Date().getFullYear()} Technologies Inc.</span>
                </div>

                <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono text-[11px]">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Neural Systems Operational</span>
                </div>

                <div className="flex items-center gap-6">
                    <Link href="/generate" className="hover:text-white transition-colors">
                        Studio
                    </Link>
                    <Link href="/swipe" className="hover:text-white transition-colors">
                        Taste Deck
                    </Link>
                    <Link href="/brain" className="hover:text-white transition-colors flex items-center gap-1.5">
                        <span>AI Brain</span>
                        <span className="text-[10px] font-mono px-1 rounded bg-purple-500/20 text-purple-300">RAG</span>
                    </Link>
                    <Link href="/privacy" className="hover:text-white transition-colors">
                        Privacy
                    </Link>
                    <Link href="/terms" className="hover:text-white transition-colors">
                        Terms
                    </Link>
                    <a href="mailto:support@vibemixer.hbhanot.tech" className="hover:text-white transition-colors">
                        Contact
                    </a>
                </div>
            </div>
        </footer>
    );
};
