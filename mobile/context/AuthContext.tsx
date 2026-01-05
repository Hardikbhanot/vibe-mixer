
import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '@/constants/api';
import * as Linking from 'expo-linking';
import * as Store from 'expo-secure-store';

type User = {
    id: string;
    email: string;
};

type AuthContextType = {
    user: User | null;
    isLoading: boolean;
    login: (email: string, pass: string) => Promise<any>;
    register: (email: string, pass: string) => Promise<any>;
    logout: () => Promise<void>;
    loginWithSpotify: () => void;
    loginWithGoogle: () => void;
    spotifyLinked: boolean;
    googleLinked: boolean;
};

const AuthContext = createContext<AuthContextType>({
    user: null,
    isLoading: false,
    login: async () => { },
    register: async () => { },
    logout: async () => { },
    loginWithSpotify: () => { },
    loginWithGoogle: () => { },
    spotifyLinked: false,
    googleLinked: false,
});

export function useAuth() {
    return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [spotifyLinked, setSpotifyLinked] = useState(false);
    const [googleLinked, setGoogleLinked] = useState(false);

    // Persist session check
    useEffect(() => {
        async function checkUser() {
            try {
                // Check if we have a token stored
                const token = await Store.getItemAsync('auth_token');
                if (token) {
                    // Validate with backend
                    const res = await api.get('/auth/me');
                    if (res && res.user) {
                        setUser(res.user);
                    } else {
                        // Token invalid/expired
                        await Store.deleteItemAsync('auth_token');
                        setUser(null);
                    }
                }
            } catch (e) {
                console.error("Session check failed", e);
            } finally {
                setIsLoading(false);
            }
        }
        checkUser();
    }, []);

    // Deep Link Handler
    useEffect(() => {
        const handleDeepLink = async (event: { url: string }) => {
            const { url } = event;
            console.log("Deep link received:", url);

            // Parse query params
            const queryParams = Linking.parse(url).queryParams;
            if (!queryParams) return;

            // Extract Tokens
            if (queryParams.auth_token) {
                await Store.setItemAsync('auth_token', queryParams.auth_token as string);
                // Refresh User
                const res = await api.get('/auth/me');
                if (res?.user) setUser(res.user);
            }
            if (queryParams.spotify_access_token) {
                await Store.setItemAsync('spotify_access_token', queryParams.spotify_access_token as string);
            }
            if (queryParams.spotify_refresh_token) {
                await Store.setItemAsync('spotify_refresh_token', queryParams.spotify_refresh_token as string);
            }
            if (queryParams.google_access_token) {
                await Store.setItemAsync('google_access_token', queryParams.google_access_token as string);
            }
            if (queryParams.google_refresh_token) {
                await Store.setItemAsync('google_refresh_token', queryParams.google_refresh_token as string);
            }
        };

        const subscription = Linking.addEventListener('url', handleDeepLink);

        // Check initial URL (if app opened via link)
        Linking.getInitialURL().then((url) => {
            if (url) handleDeepLink({ url });
        });

        return () => subscription.remove();
    }, []);

    const login = async (email: string, pass: string) => {
        const res = await api.post('/auth/login', { email, password: pass });
        if (res && res.user) {
            setUser(res.user);
            if (res.token) {
                await Store.setItemAsync('auth_token', res.token);
            }
            return { success: true };
        }
        return { success: false, error: res.error || 'Login failed' };
    };

    const register = async (email: string, pass: string) => {
        const res = await api.post('/auth/register', { email, password: pass });
        if (res && res.user) {
            setUser(res.user);
            if (res.token) {
                await Store.setItemAsync('auth_token', res.token);
            }
            return { success: true };
        }
        return { success: false, error: res.error || 'Registration failed' };
    };

    const logout = async () => {
        await api.post('/auth/logout', {});
        await Store.deleteItemAsync('auth_token');
        await Store.deleteItemAsync('spotify_access_token');
        await Store.deleteItemAsync('spotify_refresh_token');
        await Store.deleteItemAsync('google_access_token');
        await Store.deleteItemAsync('google_refresh_token');
        setUser(null);
    };

    // External OAuth Start
    const loginWithSpotify = async () => {
        const authUrl = `${api.baseUrl}/auth/login?platform=mobile`;
        Linking.openURL(authUrl);
    };

    const loginWithGoogle = async () => {
        const authUrl = `${api.baseUrl}/auth/google?platform=mobile`;
        Linking.openURL(authUrl);
    };

    return (
        <AuthContext.Provider value={{ user, isLoading, login, register, logout, loginWithSpotify, loginWithGoogle, spotifyLinked, googleLinked }}>
            {children}
        </AuthContext.Provider>
    );
}
