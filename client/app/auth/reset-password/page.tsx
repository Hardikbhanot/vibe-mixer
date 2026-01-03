"use client";

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import Link from 'next/link';

function ResetPasswordForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get('token');

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);

    if (!token) {
        return <div className="text-red-500 text-center">Invalid Link</div>;
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password.length < 8) {
            toast.error("Password too short (min 8 chars)");
            return;
        }

        if (password !== confirmPassword) {
            toast.error("Passwords do not match");
            return;
        }

        setLoading(true);
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:4000';
            const res = await fetch(`${apiUrl}/auth/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, newPassword: password })
            });

            const data = await res.json();

            if (res.ok) {
                toast.success("Password Reset! Login now.");
                router.push('/auth');
            } else {
                toast.error(data.error || "Reset failed");
            }
        } catch (error) {
            toast.error("Server error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div>
                <label className="block text-sm font-medium text-foreground px-1 mb-2">New Password</label>
                <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-background-light dark:bg-background-dark border border-foreground/10 focus:ring-2 focus:ring-primary outline-none transition-all"
                    placeholder="Min 8 chars"
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-foreground px-1 mb-2">Confirm Password</label>
                <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-background-light dark:bg-background-dark border border-foreground/10 focus:ring-2 focus:ring-primary outline-none transition-all"
                    placeholder="Confirm new password"
                />
            </div>

            <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/30 hover:shadow-primary/50 transition-all disabled:opacity-50"
            >
                {loading ? 'Reseting...' : 'Reset Password'}
            </button>
        </form>
    );
}

export default function ResetPasswordPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark p-4">
            <div className="w-full max-w-md space-y-8 bg-surface-light dark:bg-surface-dark p-8 rounded-3xl shadow-2xl border border-foreground/5">
                <div className="text-center">
                    <h2 className="text-3xl font-black text-foreground">Reset Password 🔄</h2>
                    <p className="mt-2 text-muted-foreground">Type your new secure password below.</p>
                </div>
                <Suspense fallback={<div>Loading...</div>}>
                    <ResetPasswordForm />
                </Suspense>
            </div>
        </div>
    );
}
