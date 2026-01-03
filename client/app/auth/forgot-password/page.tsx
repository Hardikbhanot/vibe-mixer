"use client";

import { useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success'>('idle');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('loading');

        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:4000';
            const res = await fetch(`${apiUrl}/auth/forgot-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });

            // Always show success message for security
            toast.success('If an account exists, checks your inbox.');
            setStatus('success');
        } catch (error) {
            toast.error('Something went wrong. Try again.');
            setStatus('idle');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark p-4">
            <div className="w-full max-w-md space-y-8 bg-surface-light dark:bg-surface-dark p-8 rounded-3xl shadow-2xl border border-foreground/5">
                <div className="text-center">
                    <h2 className="text-3xl font-black text-foreground">Forgot Password? 🔐</h2>
                    <p className="mt-2 text-muted-foreground">Enter your email to reset your vibe.</p>
                </div>

                {status === 'success' ? (
                    <div className="text-center space-y-4">
                        <div className="p-4 bg-green-500/10 text-green-500 rounded-xl font-medium">
                            Link sent! Check your inbox (and spam).
                        </div>
                        <Link href="/auth" className="block text-primary hover:underline">
                            Back to Login
                        </Link>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-foreground px-1 mb-2">Email Address</label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl bg-background-light dark:bg-background-dark border border-foreground/10 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                                placeholder="you@example.com"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={status === 'loading'}
                            className="w-full py-3 px-4 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/30 hover:shadow-primary/50 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {status === 'loading' ? 'Sending...' : 'Send Reset Link'}
                        </button>

                        <div className="text-center">
                            <Link href="/auth" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                                Back to Login
                            </Link>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
