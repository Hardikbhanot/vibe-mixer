import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '@/constants/api';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import * as Store from 'expo-secure-store';

// Notify WebBrowser to complete any pending auth sessions
WebBrowser.maybeCompleteAuthSession();

type User = {
    id: string;
    email: string;
    username?: string;
    avatarUrl?: string;
    hasSpotify?: boolean;
    hasGoogle?: boolean;
};

type AuthContextType = {
    user: User | null;
    isLoading: boolean;
    login: (email: string, pass: string) => Promise<any>;
    register: (email: string, pass: string) => Promise<any>;
    logout: () => Promise<void>;
    loginWithSpotify: () => Promise<void>;
    loginWithGoogle: () => Promise<void>;
    spotifyLinked: boolean;
    googleLinked: boolean;
};

const AuthContext = createContext<AuthContextType>({
    user: null,
    isLoading: false,
    login: async () => ({ success: false }),
    register: async () => ({ success: false }),
    logout: async () => { },
    loginWithSpotify: async () => { },
    loginWithGoogle: async () => { },
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

    // Persist session check on startup
    useEffect(() => {
        async function checkUser() {
            try {
                const token = await Store.getItemAsync('auth_token');
                const sToken = await Store.getItemAsync('spotify_access_token');
                const gToken = await Store.getItemAsync('google_access_token');

                setSpotifyLinked(!!sToken);
                setGoogleLinked(!!gToken);

                if (token) {
                    const res = await api.get('/auth/me');
                    if (res && res.user) {
                        setUser(res.user);
                        if (res.user.hasSpotify) setSpotifyLinked(true);
                        if (res.user.hasGoogle) setGoogleLinked(true);
                    } else {
                        // Token invalid/expired
                        await Store.deleteItemAsync('auth_token');
                        setUser(null);
                    }
                }
            } catch (e) {
                console.error('[Auth] Session check failed:', e);
            } finally {
                setIsLoading(false);
            }
        }
        checkUser();
    }, []);

    // Central redirect URL processor
    const handleAuthRedirect = async (url: string) => {
        try {
            console.log('[Auth] Incoming redirect URL:', url);
            const parsed = Linking.parse(url);
            const queryParams = parsed.queryParams;
            if (!queryParams) return;

            let updatedSession = false;

            if (queryParams.auth_token) {
                await Store.setItemAsync('auth_token', queryParams.auth_token as string);
                updatedSession = true;
            }
            if (queryParams.spotify_access_token) {
                await Store.setItemAsync('spotify_access_token', queryParams.spotify_access_token as string);
                setSpotifyLinked(true);
                updatedSession = true;
            }
            if (queryParams.spotify_refresh_token) {
                await Store.setItemAsync('spotify_refresh_token', queryParams.spotify_refresh_token as string);
            }
            if (queryParams.google_access_token) {
                await Store.setItemAsync('google_access_token', queryParams.google_access_token as string);
                setGoogleLinked(true);
                updatedSession = true;
            }
            if (queryParams.google_refresh_token) {
                await Store.setItemAsync('google_refresh_token', queryParams.google_refresh_token as string);
            }

            if (updatedSession) {
                const res = await api.get('/auth/me');
                if (res && res.user) {
                    setUser(res.user);
                    if (res.user.hasSpotify) setSpotifyLinked(true);
                    if (res.user.hasGoogle) setGoogleLinked(true);
                }
            }
        } catch (e) {
            console.error('[Auth] Failed to process auth redirect:', e);
        }
    };

    // Deep link listener for background / OS-dispatched links
    useEffect(() => {
        const handleDeepLink = async (event: { url: string }) => {
            await handleAuthRedirect(event.url);
        };

        const subscription = Linking.addEventListener('url', handleDeepLink);

        Linking.getInitialURL().then((url) => {
            if (url) handleAuthRedirect(url);
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
        try {
            await api.post('/auth/logout', {});
        } catch (e) { }
        await Store.deleteItemAsync('auth_token');
        await Store.deleteItemAsync('spotify_access_token');
        await Store.deleteItemAsync('spotify_refresh_token');
        await Store.deleteItemAsync('google_access_token');
        await Store.deleteItemAsync('google_refresh_token');
        setUser(null);
        setSpotifyLinked(false);
        setGoogleLinked(false);
    };

    // In-App OAuth via WebBrowser Custom Tabs
    const loginWithSpotify = async () => {
        try {
            const redirectUrl = Linking.createURL('auth-callback');
            console.log('[Spotify OAuth] Using redirect URL:', redirectUrl);
            const userParam = user?.id ? `&userId=${encodeURIComponent(user.id)}` : '';
            const authUrl = `${api.baseUrl}/auth/login?platform=mobile&redirect=${encodeURIComponent(redirectUrl)}${userParam}`;

            const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUrl);
            console.log('[Spotify OAuth] WebBrowser result:', result);

            if (result.type === 'success' && result.url) {
                await handleAuthRedirect(result.url);
            }
        } catch (e) {
            console.error('[Spotify OAuth] Flow failed:', e);
        }
    };

    const loginWithGoogle = async () => {
        try {
            const redirectUrl = Linking.createURL('auth-callback');
            console.log('[Google OAuth] Using redirect URL:', redirectUrl);
            const userParam = user?.id ? `&userId=${encodeURIComponent(user.id)}` : '';
            const authUrl = `${api.baseUrl}/auth/google?platform=mobile&redirect=${encodeURIComponent(redirectUrl)}${userParam}`;

            const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUrl);
            console.log('[Google OAuth] WebBrowser result:', result);

            if (result.type === 'success' && result.url) {
                await handleAuthRedirect(result.url);
            }
        } catch (e) {
            console.error('[Google OAuth] Flow failed:', e);
        }
    };

    return (
        <AuthContext.Provider value={{
            user,
            isLoading,
            login,
            register,
            logout,
            loginWithSpotify,
            loginWithGoogle,
            spotifyLinked,
            googleLinked
        }}>
            {children}
        </AuthContext.Provider>
    );
}
