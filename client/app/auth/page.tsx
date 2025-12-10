"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

export default function AuthPage() {
    const [isLogin, setIsLogin] = useState(true);
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    // Form State
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const { refreshAuth, login } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            toast.error('Please enter a valid email address');
            return;
        }

        if (password.length < 8) {
            toast.error('Password must be at least 8 characters long');
            return;
        }

        if (!isLogin) {
            if (password !== confirmPassword) {
                toast.error('Passwords do not match');
                return;
            }

            // Strict Validation: Number, Uppercase, Lowercase
            const hasNumber = /\d/.test(password);
            const hasUpper = /[A-Z]/.test(password);
            const hasLower = /[a-z]/.test(password);

            if (!hasNumber || !hasUpper || !hasLower) {
                toast.error('Password must contain at least one number, one uppercase letter, and one lowercase letter');
                return;
            }
        }

        setIsLoading(true);

        setIsLoading(true);

        try {
            if (isLogin) {
                // Use centralized login function
                const result = await login(email, password);
                if (result.success) {
                    toast.success('Welcome back! 👋');
                    // Redirect is handled in AuthContext or here
                    // AuthContext handles push to /generate, but we might want to respect ?next
                    // Ideally AuthContext should just return success and let component redirect.
                    // But looking at AuthContext, it pushes to /generate. 
                    // Let's assume AuthContext handles it, or we can force it here if AuthContext returns true.
                    // Actually, looking at the previous AuthContext file, it DOES router.push('/generate').
                    // This might override the 'next' param logic. 
                    // We should probably rely on AuthContext for now to keep it simple as requested.
                } else {
                    toast.error(result.error || 'Login failed');
                }
            } else {
                // Register using relative path (proxy)
                const apiUrl = '';
                const response = await fetch(`${apiUrl}/auth/register`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password }),
                    credentials: 'include'
                });

                const data = await response.json();
                if (!response.ok) throw new Error(data.error || 'Registration failed');

                toast.success('Account created! 🎉');

                // Auto-login after register? Or just redirect?
                // For now, let's just ask them to login or auto-login.
                // The backend register endpoint usually doesn't set the cookie unless built to do so.
                // Let's call login immediately after register to be smooth.
                await login(email, password);
            }

        } catch (error: any) {
            toast.error(error.message || 'An error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-background-light dark:bg-background-dark p-4 overflow-hidden relative">
            {/* Background Ambience */}
            <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-primary/20 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-secondary/20 rounded-full blur-[100px] pointer-events-none" />

            <Link href="/" className="absolute top-6 left-6 flex items-center gap-2 text-foreground/80 hover:text-primary transition-colors z-20">
                <span className="material-symbols-outlined">arrow_back</span>
                <span>Home</span>
            </Link>

            <div className="w-full max-w-md z-10">
                <div className="bg-white/80 dark:bg-black/40 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl overflow-hidden relative">

                    {/* Header Switcher */}
                    <div className="flex p-2 m-2 bg-black/5 dark:bg-white/5 rounded-2xl relative">
                        <motion.div
                            className="absolute top-2 bottom-2 bg-white dark:bg-black/60 shadow-sm rounded-xl"
                            initial={false}
                            animate={{
                                left: isLogin ? '8px' : '50%',
                                width: 'calc(50% - 12px)',
                                x: isLogin ? 0 : 4
                            }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        />
                        <button
                            onClick={() => setIsLogin(true)}
                            className={`flex-1 relative z-10 py-2 text-sm font-bold transition-colors ${isLogin ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                            Log In
                        </button>
                        <button
                            onClick={() => setIsLogin(false)}
                            className={`flex-1 relative z-10 py-2 text-sm font-bold transition-colors ${!isLogin ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                            Sign Up
                        </button>
                    </div>

                    <div className="p-8 pt-4">
                        <div className="text-center mb-8">
                            <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary inline-block">
                                {isLogin ? 'Welcome Back' : 'Join VibeMixer'}
                            </h2>
                            <p className="text-muted-foreground mt-2 text-sm">
                                {isLogin
                                    ? 'Enter your credentials to access your account'
                                    : 'Create an account to start swiping and refining'}
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1">Email</label>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl bg-black/5 dark:bg-white/5 border border-transparent focus:border-primary focus:bg-white dark:focus:bg-black focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                                    placeholder="hello@example.com"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1">Password</label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full px-4 py-3 pr-12 rounded-xl bg-black/5 dark:bg-white/5 border border-transparent focus:border-primary focus:bg-white dark:focus:bg-black focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                                        placeholder="••••••••"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        <span className="material-symbols-outlined text-lg">
                                            {showPassword ? 'visibility_off' : 'visibility'}
                                        </span>
                                    </button>
                                </div>
                                {!isLogin && (
                                    <p className="text-[10px] text-muted-foreground ml-1">
                                        Must contain 1 number, 1 uppercase, 1 lowercase.
                                    </p>
                                )}
                            </div>

                            <AnimatePresence>
                                {!isLogin && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="space-y-2 overflow-hidden"
                                    >
                                        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1">Confirm Password</label>
                                        <input
                                            type="password"
                                            required={!isLogin}
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            className="w-full px-4 py-3 rounded-xl bg-black/5 dark:bg-white/5 border border-transparent focus:border-primary focus:bg-white dark:focus:bg-black focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                                            placeholder="••••••••"
                                        />
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                type="submit"
                                disabled={isLoading}
                                className="w-full py-4 mt-4 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Processing...
                                    </span>
                                ) : (
                                    isLogin ? 'Sign In' : 'Create Account'
                                )}
                            </motion.button>
                        </form>

                        {/* Social Login Separator */}
                        <div className="relative my-8">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-black/10 dark:border-white/10"></div>
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-background-light dark:bg-[#121212] px-2 text-muted-foreground">Or continue with</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={() => {
                                    window.location.href = `/auth/login`; // Spotify via Proxy
                                }}
                                className="flex items-center justify-center gap-2 py-3 bg-[#1DB954]/10 hover:bg-[#1DB954]/20 text-[#1DB954] font-bold rounded-xl transition-colors"
                            >
                                <img src="https://storage.googleapis.com/pr-newsroom-wp/1/2018/11/Spotify_Logo_RGB_Green.png" alt="Spotify" className="h-5 w-auto" />
                            </button>
                            <button
                                onClick={() => {
                                    window.location.href = `/auth/google`; // Google via Proxy
                                }}
                                className="flex items-center justify-center gap-2 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 font-bold rounded-xl transition-colors"
                            >
                                <span className="material-symbols-outlined text-xl">play_circle</span> Google
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
