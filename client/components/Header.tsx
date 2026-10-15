"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ThemeToggle } from './ThemeToggle';
import { useAuth } from '@/context/AuthContext';
import { usePathname, useRouter } from 'next/navigation';
import {
    Sparkles,
    ArrowLeft,
    Menu,
    X,
    Disc3,
    MessageSquare,
    Flame,
    Users,
    Heart,
    MapPin,
    LogOut,
    ChevronRight
} from 'lucide-react';

export const Header = () => {
    const { user, loading, logout } = useAuth();
    const pathname = usePathname();
    const router = useRouter();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const isAuthPage = pathname === '/auth';

    const toggleMenu = () => setIsMenuOpen(prev => !prev);
    const closeMenu = () => setIsMenuOpen(false);

    // Auto-close menu on route change
    useEffect(() => {
        setIsMenuOpen(false);
    }, [pathname]);

    // Prevent background scrolling when mobile menu drawer is open
    useEffect(() => {
        if (isMenuOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isMenuOpen]);

    const navLinks = [
        {
            href: '/generate',
            label: 'Studio',
            badge: 'AI',
            desc: 'AI Prompt to Playlist',
            icon: Sparkles,
            color: 'text-purple-400 bg-purple-500/15 border-purple-500/30'
        },
        {
            href: '/swipe',
            label: 'Taste Deck',
            badge: 'Live',
            desc: 'Swipe to Train AI',
            icon: Flame,
            color: 'text-rose-400 bg-rose-500/15 border-rose-500/30'
        },
        {
            href: '/india',
            label: 'Radar',
            badge: 'Map',
            desc: 'Regional Soundscapes',
            icon: MapPin,
            color: 'text-amber-400 bg-amber-500/15 border-amber-500/30'
        },
        {
            href: '/discover',
            label: 'Community',
            desc: 'Public Community Mixes',
            icon: Users,
            color: 'text-cyan-400 bg-cyan-500/15 border-cyan-500/30'
        },
        {
            href: '/match',
            label: 'Vibe Match',
            desc: 'Find Your Sonic Twin',
            icon: Heart,
            color: 'text-pink-400 bg-pink-500/15 border-pink-500/30'
        },
        {
            href: '/messages',
            label: 'Messages',
            desc: 'Direct Creator Chat',
            icon: MessageSquare,
            color: 'text-indigo-400 bg-indigo-500/15 border-indigo-500/30'
        },
    ];

    return (
        <>
            <header className="flex items-center px-3.5 sm:px-8 py-3 justify-between sticky top-0 z-50 bg-[#070709]/85 dark:bg-[#070709]/85 backdrop-blur-xl border-b border-white/[0.08] transition-all duration-300">
                {/* Left: Back Arrow (if not home) + Logo Branding */}
                <div className="flex items-center gap-2 sm:gap-4 min-w-0">
                    {pathname !== '/' && (
                        <button
                            onClick={() => router.back()}
                            className="flex text-white/70 size-8 sm:size-9 shrink-0 items-center justify-center rounded-xl hover:bg-white/[0.08] hover:text-white transition-colors border border-white/[0.06]"
                            title="Go Back"
                        >
                            <ArrowLeft size={16} />
                        </button>
                    )}

                    {/* Logo Branding */}
                    <Link href="/" className="flex items-center gap-2 sm:gap-2.5 hover:opacity-90 transition-opacity group shrink-0">
                        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-purple-600 via-primary to-cyan-400 p-[1.5px] shadow-lg shadow-purple-500/20 group-hover:scale-105 transition-transform shrink-0">
                            <div className="w-full h-full rounded-[10px] bg-[#070709] flex items-center justify-center">
                                <Disc3 size={17} className="text-purple-300 group-hover:rotate-90 transition-transform duration-500" />
                            </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="text-white text-lg sm:text-xl font-bold tracking-tight">
                                VibeMixer
                            </span>
                            <span className="hidden sm:inline text-[9px] uppercase font-mono font-bold tracking-wider px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                                2.5
                            </span>
                        </div>
                    </Link>
                </div>

                {/* Center: Navigation (Desktop Only) */}
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
                <div className="flex items-center gap-2 sm:gap-3 justify-end shrink-0">
                    <div className="hidden sm:block">
                        <ThemeToggle />
                    </div>

                    {!loading && !isAuthPage && (
                        user ? (
                            <div className="flex items-center gap-2">
                                {/* Desktop only messages shortcut */}
                                <Link
                                    href="/messages"
                                    className={`hidden sm:flex size-9 rounded-xl items-center justify-center transition-colors border ${
                                        pathname === '/messages'
                                            ? 'bg-purple-600/30 border-purple-500/50 text-purple-300'
                                            : 'bg-white/[0.04] border-white/[0.08] hover:bg-white/[0.08] text-white/70 hover:text-white'
                                    }`}
                                    title="Messages"
                                >
                                    <MessageSquare size={17} />
                                </Link>

                                {/* User Avatar Shortcut */}
                                <Link href="/profile" className="relative group shrink-0">
                                    <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-tr from-purple-500 to-cyan-400 p-[1.5px] transition-transform group-hover:scale-105 shadow-md">
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
                                <Link href={`/auth${pathname && pathname !== '/' ? `?next=${encodeURIComponent(pathname)}` : ''}`} className="hidden sm:block">
                                    <button className="px-3.5 py-1.5 text-xs font-semibold text-white/70 hover:text-white transition-colors">
                                        Sign In
                                    </button>
                                </Link>
                                <Link href="/generate" className="hidden sm:block">
                                    <button className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-primary text-white font-bold text-xs hover:opacity-90 transition-all shadow-md shadow-purple-500/20 flex items-center gap-1.5">
                                        <Sparkles size={13} />
                                        <span>Studio</span>
                                    </button>
                                </Link>
                            </div>
                        )
                    )}

                    {/* Mobile Hamburger Button (Compact, Touch-friendly) */}
                    <button
                        onClick={toggleMenu}
                        className={`lg:hidden flex size-9 items-center justify-center rounded-xl transition-all border ${
                            isMenuOpen
                                ? 'bg-purple-600/30 border-purple-500/50 text-white'
                                : 'bg-white/[0.04] border-white/[0.08] text-white/80 hover:text-white hover:bg-white/[0.08]'
                        }`}
                        aria-label="Toggle Menu"
                    >
                        {isMenuOpen ? <X size={19} /> : <Menu size={19} />}
                    </button>
                </div>
            </header>

            {/* Mobile Drawer Overlay */}
            {isMenuOpen && (
                <div className="fixed inset-x-0 top-[57px] bottom-0 z-50 bg-[#070709]/95 backdrop-blur-2xl lg:hidden animate-in fade-in slide-in-from-top-3 duration-200 overflow-y-auto flex flex-col justify-between p-4 sm:p-6 border-t border-white/[0.08]">
                    <div className="space-y-4">
                        {/* Profile Bar or Login CTA Card */}
                        {!loading && (
                            user ? (
                                <Link
                                    href="/profile"
                                    onClick={closeMenu}
                                    className="flex items-center justify-between p-3.5 rounded-2xl bg-white/[0.04] border border-white/[0.08] hover:border-purple-500/40 transition-colors group"
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-500 to-cyan-400 p-[1.5px] shrink-0">
                                            <div className="w-full h-full rounded-full bg-[#070709] flex items-center justify-center overflow-hidden">
                                                {user.avatarUrl ? (
                                                    <img src={user.avatarUrl} alt={user.username || 'User'} className="w-full h-full object-cover" />
                                                ) : (
                                                    <span className="font-bold text-sm text-white uppercase">{user.email?.[0] || 'U'}</span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="min-w-0">
                                            <div className="text-sm font-bold text-white truncate">{user.username ? `@${user.username}` : user.email}</div>
                                            <div className="text-[11px] text-purple-300 font-mono flex items-center gap-1">
                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                                Vibe Curator
                                            </div>
                                        </div>
                                    </div>
                                    <ChevronRight size={18} className="text-white/40 group-hover:text-white group-hover:translate-x-0.5 transition-all shrink-0" />
                                </Link>
                            ) : (
                                <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-900/40 via-black to-cyan-950/30 border border-purple-500/30 space-y-3">
                                    <div>
                                        <h4 className="text-sm font-bold text-white">Join VibeMixer</h4>
                                        <p className="text-xs text-white/60">Generate AI playlists & connect with music lovers.</p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <Link
                                            href="/auth"
                                            onClick={closeMenu}
                                            className="w-full py-2.5 text-center text-xs font-bold text-white bg-white/[0.08] hover:bg-white/[0.12] rounded-xl transition-colors border border-white/10"
                                        >
                                            Sign In
                                        </Link>
                                        <Link
                                            href="/auth"
                                            onClick={closeMenu}
                                            className="w-full py-2.5 text-center text-xs font-bold text-white bg-gradient-to-r from-purple-600 to-primary rounded-xl transition-all shadow-md shadow-purple-500/20"
                                        >
                                            Get Started
                                        </Link>
                                    </div>
                                </div>
                            )
                        )}

                        {/* Navigation Links Grid */}
                        <div className="space-y-1.5">
                            <div className="text-[10px] uppercase font-mono tracking-wider text-white/40 px-2 py-1">
                                Menu Navigation
                            </div>
                            <div className="grid grid-cols-1 gap-1.5">
                                {navLinks.map((link) => {
                                    const isActive = pathname === link.href;
                                    const Icon = link.icon;
                                    return (
                                        <Link
                                            key={link.href}
                                            href={link.href}
                                            onClick={closeMenu}
                                            className={`flex items-center justify-between p-3 rounded-xl transition-all ${
                                                isActive
                                                    ? 'bg-purple-600/20 border border-purple-500/40 text-white shadow-sm'
                                                    : 'bg-white/[0.02] border border-white/[0.05] text-white/80 hover:bg-white/[0.06] hover:text-white'
                                            }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${link.color}`}>
                                                    <Icon size={16} />
                                                </div>
                                                <div>
                                                    <div className="text-sm font-bold leading-tight">{link.label}</div>
                                                    <div className="text-[11px] text-white/40">{link.desc}</div>
                                                </div>
                                            </div>
                                            {link.badge && (
                                                <span className="text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                                                    {link.badge}
                                                </span>
                                            )}
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Bottom Utility Bar: Theme Toggle + Logout */}
                    <div className="pt-4 border-t border-white/[0.08] mt-6 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-white/50">Theme:</span>
                            <ThemeToggle />
                        </div>

                        {user && (
                            <button
                                onClick={() => {
                                    closeMenu();
                                    logout();
                                    router.push('/');
                                }}
                                className="flex items-center gap-1.5 text-xs font-semibold text-rose-400 hover:text-rose-300 px-3 py-1.5 rounded-xl hover:bg-rose-500/10 transition-colors"
                            >
                                <LogOut size={14} />
                                <span>Sign Out</span>
                            </button>
                        )}
                    </div>
                </div>
            )}
        </>
    );
};
