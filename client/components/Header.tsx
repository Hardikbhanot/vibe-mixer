"use client";

import { useState } from 'react';
import Link from 'next/link';
import { ThemeToggle } from './ThemeToggle';
import { useAuth } from '@/context/AuthContext';
import { usePathname, useRouter } from 'next/navigation';

export const Header = () => {
    const { user, loading } = useAuth();
    const pathname = usePathname();
    const router = useRouter();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const isAuthPage = pathname === '/auth';

    const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
    const closeMenu = () => setIsMenuOpen(false);

    return (
        <>
            <header className="flex items-center px-6 py-3 justify-between sticky top-0 z-50 bg-background-light/70 dark:bg-background-dark/70 backdrop-blur-xl border-b border-black/5 dark:border-white/5 transition-all duration-300">
                {/* Left: Back or Logo */}
                <div className="flex items-center gap-4">
                    {pathname !== '/' && (
                        <button
                            onClick={() => router.back()}
                            className="hidden md:flex text-foreground size-10 shrink-0 items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                        >
                            <span className="material-symbols-outlined text-2xl">arrow_back</span>
                        </button>
                    )}

                    {/* Branding */}
                    <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                        <img src="/logo.png" alt="Logo" className="w-10 h-10 object-contain" />
                        <h1 className="text-foreground text-2xl font-bold tracking-tight hidden md:block bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                            VibeMixer
                        </h1>
                    </Link>
                </div>

                {/* Center: Navigation (Desktop) */}
                <nav className="hidden md:flex items-center gap-1 bg-surface-light/50 dark:bg-surface-dark/50 p-1 rounded-full border border-black/5 dark:border-white/5 backdrop-blur-sm">
                    <Link
                        href="/generate"
                        className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${pathname === '/generate' ? 'bg-primary text-background-dark shadow-sm' : 'hover:bg-black/5 dark:hover:bg-white/5'}`}
                    >
                        ✨ Generate
                    </Link>
                    <Link
                        href="/swipe"
                        className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${pathname === '/swipe' ? 'bg-primary text-background-dark shadow-sm' : 'hover:bg-black/5 dark:hover:bg-white/5'}`}
                    >
                        Swipe
                    </Link>
                    <Link
                        href="/discover"
                        className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${pathname === '/discover' ? 'bg-primary text-background-dark shadow-sm' : 'hover:bg-black/5 dark:hover:bg-white/5'}`}
                    >
                        Discover
                    </Link>
                    <Link
                        href="/match"
                        className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${pathname === '/match' ? 'bg-primary text-background-dark shadow-sm' : 'hover:bg-black/5 dark:hover:bg-white/5'}`}
                    >
                        Match
                    </Link>
                    <Link
                        href="/india"
                        className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${pathname === '/india' ? 'bg-primary text-background-dark shadow-sm' : 'hover:bg-black/5 dark:hover:bg-white/5'}`}
                    >
                        Map
                    </Link>
                </nav>

                {/* Right: Actions */}
                <div className="flex items-center gap-3 justify-end">
                    <div className="hidden md:block">
                        <ThemeToggle />
                    </div>

                    {!loading && !isAuthPage && (
                        user ? (
                            <Link href="/profile" className="relative group hidden md:block">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-secondary p-[2px] transition-transform group-hover:scale-105">
                                    <div className="w-full h-full rounded-full bg-background-light dark:bg-background-dark flex items-center justify-center overflow-hidden">
                                        {user.avatarUrl ? (
                                            <img src={user.avatarUrl} alt={user.username} className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="font-bold text-lg text-foreground uppercase">{user.email[0]}</span>
                                        )}
                                    </div>
                                </div>
                            </Link>
                        ) : (
                            <Link href="/auth" className="hidden md:block">
                                <button className="px-5 py-2 rounded-full bg-primary text-background-dark font-bold text-sm transition-transform hover:scale-105 shadow-lg shadow-primary/25">
                                    Login
                                </button>
                            </Link>
                        )
                    )}

                    {/* Mobile Hamburger Button */}
                    <button
                        onClick={toggleMenu}
                        className="md:hidden flex size-10 items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors z-50"
                    >
                        <span className="material-symbols-outlined text-2xl">
                            {isMenuOpen ? 'close' : 'menu'}
                        </span>
                    </button>
                </div>
            </header>

            {/* Mobile Menu Overlay */}
            {isMenuOpen && (
                <div className="fixed inset-0 z-40 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-xl flex flex-col items-center justify-center gap-8 md:hidden animate-in fade-in zoom-in-95 duration-200 p-6">
                    <ThemeToggle />

                    <nav className="flex flex-col items-center gap-6 w-full max-w-xs">
                        <Link href="/generate" onClick={closeMenu} className="w-full py-4 text-center rounded-2xl bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-xl font-bold">
                            ✨ Generate Mix
                        </Link>
                        <div className="w-full h-px bg-border/50"></div>
                        <Link href="/swipe" onClick={closeMenu} className="text-2xl font-bold hover:text-primary transition-colors">
                            Swipe Mode
                        </Link>
                        <Link href="/discover" onClick={closeMenu} className="text-2xl font-bold hover:text-primary transition-colors">
                            Discover
                        </Link>
                        <Link href="/match" onClick={closeMenu} className="text-2xl font-bold hover:text-primary transition-colors">
                            Vibe Match
                        </Link>
                        <Link href="/india" onClick={closeMenu} className="text-2xl font-bold hover:text-primary transition-colors">
                            Global Map
                        </Link>
                        <Link href="/messages" onClick={closeMenu} className="text-2xl font-bold hover:text-primary transition-colors">
                            Messages
                        </Link>
                    </nav>

                    {!loading && !isAuthPage && (
                        user ? (
                            <Link href="/profile" onClick={closeMenu} className="flex flex-col items-center gap-2 mt-4">
                                <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-primary to-secondary p-[2px]">
                                    <div className="w-full h-full rounded-full bg-background-light dark:bg-background-dark flex items-center justify-center overflow-hidden">
                                        {user.avatarUrl ? (
                                            <img src={user.avatarUrl} alt={user.username} className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="font-bold text-2xl text-foreground uppercase">{user.email[0]}</span>
                                        )}
                                    </div>
                                </div>
                                <span className="text-xl font-bold">My Profile</span>
                            </Link>
                        ) : (
                            <Link href="/auth" onClick={closeMenu}>
                                <button className="px-8 py-3 rounded-full bg-primary text-background-dark font-bold text-lg transition-transform active:scale-95 shadow-lg shadow-primary/25">
                                    Login to Vibe
                                </button>
                            </Link>
                        )
                    )}
                </div>
            )}
        </>
    );
};
