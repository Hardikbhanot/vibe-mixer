"use client";

import { createContext, useContext, useEffect, useState } from 'react';

interface User {
    id: string;
    email: string;
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    refreshAuth: () => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    refreshAuth: async () => { },
    logout: async () => { },
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    const refreshAuth = async () => {
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:4000';
            const res = await fetch(`${apiUrl}/auth/me`, { credentials: 'include' });
            if (res.ok) {
                const data = await res.json();
                setUser(data.user);
            } else {
                setUser(null);
            }
        } catch (error) {
            console.error('Auth check failed', error);
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    const logout = async () => {
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:4000';
            await fetch(`${apiUrl}/auth/logout`, { method: 'POST', credentials: 'include' });
            setUser(null);
        } catch (error) {
            console.error('Logout failed', error);
        }
    };

    useEffect(() => {
        refreshAuth();
    }, []);

    return (
        <AuthContext.Provider value={{ user, loading, refreshAuth, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
