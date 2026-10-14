"use client";

import { useState } from 'react';
import Link from 'next/link';
import { ThemeToggle } from './ThemeToggle';
import { useAuth } from '@/context/AuthContext';
import { usePathname, useRouter } from 'next/navigation';
import { Sparkles, ArrowLeft, Menu, X, Disc3, MessageSquare } from 'lucide-react';

export const Header = () => {
    const { user, loading } = useAuth();
    const pathname = usePathname();
    const router = useRouter();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const isAuthPage = pathname === '/auth';

    const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
    const closeMenu = () => setIsMenuOpen(false);

    const navLinks = [
        { href: '/generate', label: 'Studio', badge: 'AI' },
        { href: '/swipe', label: 'Taste Deck' },
        { href: '/messages', label: 'Messages' },
        { href: '/discover', label: 'Community' },
        { href: '/match', label: 'Vibe Match' },
        { href: '/india', label: 'Radar' },
    ];

    return (
        <>
            <header className="flex items-center px-4 sm:px-8 py-3.5 justify-between sticky top-0 z-50 bg-[#070709]/80 dark:bg-[#070709]/80 backdrop-blur-xl border-b border-white/[0.08] transition-all duration-300">
                {/* Left: Back or Logo */}
                <div className="flex items-center gap-4">
                    {pathname !== '/' && (
                        <button
                            onClick={() => router.back()}
                            className="flex text-white/70 size-9 shrink-0 items-center justify-center rounded-xl hover:bg-white/[0.08] hover:text-white transition-colors border border-white/[0.06]"
                            title="Go Back"
                        >
                            <ArrowLeft size={18} />
                        </button>
                    )}

                    {/* Branding */}
                    <Link href="/" className="flex items-center gap-2.5 hover:opacity-90 transition-opacity group">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 via-primary to-cyan-400 p-[1.5px] shadow-lg shadow-purple-500/20 group-hover:scale-105 transition-transform">
                            <div className="w-full h-full rounded-[10px] bg-[#070709] flex items-center justify-center">
                                <Disc3 size={18} className="text-purple-300 group-hover:rotate-90 transition-transform duration-500" />
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-white text-xl font-bold tracking-tight">
                                VibeMixer
                            </span>
                            <span className="hidden sm:inline text-[9px] uppercase font-mono font-bold tracking-wider px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                                2.5
                            </span>
                        </div>
                    </Link>
                </div>

                {/* Center: Navigation (Desktop) */}
                <nav className="hidden lg:flex items-center gap-1 bg-white/[0.03] p-1.5 rounded-full border border-white/[0.08] backdrop-blur-md shadow-inner">
                    {navLinks.map((link) => {
                        const isActive = pathname === link.href;
                        return (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={`px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all flex items-center gap-1.5 ${
                                    isActive
                                        ? 'bg-white/15 text-white shadow-sm border border-white/20'
                                        : 'text-white/60 hover:text-white hover:bg-white/[0.05]'
                                }`}
                            >
                                {link.label}
                                {link.badge && (
                                    <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-purple-500/30 text-purple-200">
                                        {link.badge}
                                    </span>
                                )}
                            </Link>
                        );
                    })}
                </nav>

                {/* Right: Actions */}
                <div className="flex items-center gap-3 justify-end">
                    <div className="hidden sm:block">
                        <ThemeToggle />
                    </div>

                    {!loading && !isAuthPage && (
                        user ? (
                            <div className="flex items-center gap-2.5">
                                <Link
                                    href="/messages"
                                    className={`size-9 rounded-xl flex items-center justify-center transition-colors border ${
                                        pathname === '/messages'
                                            ? 'bg-purple-600/30 border-purple-500/50 text-purple-300'
                                            : 'bg-white/[0.04] border-white/[0.08] hover:bg-white/[0.08] text-white/70 hover:text-white'
                                    }`}
                                    title="Messages"
                                >
                                    <MessageSquare size={17} />
                                </Link>
                                <Link href="/profile" className="relative group">
                                    <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-purple-500 to-cyan-400 p-[1.5px] transition-transform group-hover:scale-105 shadow-md">
                                        <div className="w-full h-full rounded-full bg-[#070709] flex items-center justify-center overflow-hidden">
                                            {user.avatarUrl ? (
                                                <img src={user.avatarUrl} alt={user.username || 'User'} className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="font-bold text-xs text-white uppercase">{user.email?.[0] || 'U'}</span>
                                            )}
                                        </div>
                                    </div>
                                </Link>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <Link href="/auth" className="hidden sm:block">
                                    <button className="px-4 py-2 text-xs font-semibold text-white/70 hover:text-white transition-colors">
                                        Sign In
                                    </button>
                                </Link>
                                <Link href="/generate">
                                    <button className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-primary text-white font-bold text-xs hover:opacity-90 transition-all shadow-md shadow-purple-500/20 flex items-center gap-1.5">
                                        <Sparkles size={13} />
                                        <span>Studio</span>
                                    </button>
                                </Link>
                            </div>
                        )
                    )}

                    {/* Mobile Hamburger Button */}
                    <button
                        onClick={toggleMenu}
                        className="lg:hidden flex size-9 items-center justify-center rounded-xl bg-white/[0.04] border border-white/[0.08] text-white/80 hover:text-white transition-colors"
                        aria-label="Toggle Menu"
                    >
                        {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
                    </button>
                </div>
            </header>

            {/* Mobile Menu Overlay */}
            {isMenuOpen && (
                <div className="fixed inset-0 z-40 bg-[#070709]/95 backdrop-blur-2xl flex flex-col items-center justify-center gap-8 lg:hidden animate-in fade-in zoom-in-95 duration-200 p-6">
                    <div className="flex justify-between items-center w-full max-w-xs mb-4">
                        <span className="text-xs uppercase font-mono tracking-wider text-white/40">Navigation</span>
                        <ThemeToggle />
                    </div>

                    <nav className="flex flex-col items-center gap-3 w-full max-w-xs">
                        {navLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                onClick={closeMenu}
                                className={`w-full py-3.5 px-4 text-center rounded-2xl font-bold text-base transition-all ${
                                    pathname === link.href
                                        ? 'bg-purple-600/20 border border-purple-500/40 text-purple-300'
                                        : 'bg-white/[0.03] border border-white/[0.06] text-white/80 hover:text-white'
                                }`}
                            >
                                {link.label}
                            </Link>
                        ))}
                    </nav>

                    {!loading && !isAuthPage && (
                        user ? (
                            <Link href="/profile" onClick={closeMenu} className="flex items-center gap-3 mt-4 px-4 py-2.5 rounded-2xl bg-white/[0.05] border border-white/10">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-500 to-cyan-400 p-[1.5px]">
                                    <div className="w-full h-full rounded-full bg-black flex items-center justify-center overflow-hidden">
                                        {user.avatarUrl ? (
                                            <img src={user.avatarUrl} alt={user.username || 'User'} className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="font-bold text-sm text-white uppercase">{user.email?.[0] || 'U'}</span>
                                        )}
                                    </div>
                                </div>
                                <div className="text-left">
                                    <div className="text-xs font-bold text-white">{user.email}</div>
                                    <div className="text-[10px] text-white/40">View Profile →</div>
                                </div>
                            </Link>
                        ) : (
                            <Link href="/auth" onClick={closeMenu} className="w-full max-w-xs">
                                <button className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 to-primary text-white font-bold text-sm transition-all shadow-lg shadow-purple-500/30">
                                    Sign In / Register
                                </button>
                            </Link>
                        )
                    )}
                </div>
            )}
        </>
    );
};
