"use client";

import Link from 'next/link';
import { ThemeToggle } from './ThemeToggle';
import { useAuth } from '@/context/AuthContext';
import { usePathname, useRouter } from 'next/navigation';

export const Header = () => {
    const { user, loading } = useAuth();
    const router = useRouter();

    const isAuthPage = pathname === '/auth';

    return (
        <header className="flex items-center p-4 pb-2 justify-between sticky top-0 z-50 bg-background-light dark:bg-background-dark/80 backdrop-blur-sm transition-colors duration-300">
            {/* Left: Back or Logo */}
            {pathname === '/' ? (
                <div className="size-10"></div> // Spacer
            ) : (
                <button
                    onClick={() => router.back()}
                    className="text-foreground flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                >
                    <span className="material-symbols-outlined text-2xl">arrow_back</span>
                </button>
            )}

            {/* Center: Branding */}
            <Link href="/" className="flex items-center gap-2 flex-1 justify-center hover:opacity-80 transition-opacity">
                <img src="/logo.png" alt="Logo" className="w-12 h-12 object-contain" />
                <h1 className="text-foreground text-3xl font-bold leading-tight tracking-[-0.015em] hidden md:block">
                    VibeMixer
                </h1>
            </Link>

            {/* Right: Actions */}
            <div className="flex items-center gap-3 justify-end min-w-[120px]">
                <Link href="/swipe" className="hidden md:block text-sm font-medium hover:text-primary transition-colors text-center">
                    Swipe Mode
                </Link>
                <Link href="/discover" className="hidden md:block text-sm font-medium hover:text-primary transition-colors text-center">
                    Discover
                </Link>
                <Link href="/india" className="hidden md:block text-sm font-medium hover:text-primary transition-colors text-center">
                    Indian Vibe Map
                </Link>
                <ThemeToggle />

                {!loading && !isAuthPage && (
                    user ? (
                        <Link href="/profile" className="relative group">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-secondary p-[2px]">
                                <div className="w-full h-full rounded-full bg-background-light dark:bg-background-dark flex items-center justify-center overflow-hidden">
                                    <span className="font-bold text-lg text-foreground uppercase">{user.email[0]}</span>
                                </div>
                            </div>
                        </Link>
                    ) : (
                        <Link href="/auth">
                            <button className="px-4 py-2 rounded-full bg-primary/10 hover:bg-primary/20 text-primary font-bold text-sm transition-colors">
                                Login
                            </button>
                        </Link>
                    )
                )}
            </div>
        </header>
    );
};
