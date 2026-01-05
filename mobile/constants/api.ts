
import { Platform } from 'react-native';
import * as Store from 'expo-secure-store';

const LOCALHOST = Platform.OS === 'ios' ? 'http://localhost:3000' : 'http://10.0.2.2:3000';
const LOCAL_IP = 'https://vibemixer.hbhanot.tech'; // Production Domain
const API_URL = process.env.EXPO_PUBLIC_API_URL || LOCAL_IP;

export const api = {
    baseUrl: API_URL,

    async get(endpoint: string) {
        console.log(`GET ${API_URL}${endpoint}`);
        const headers: any = {};

        // Inject Tokens if available
        try {
            const token = await Store.getItemAsync('auth_token');
            const spotifyToken = await Store.getItemAsync('spotify_access_token');
            const googleToken = await Store.getItemAsync('google_access_token');

            if (token) headers['Authorization'] = `Bearer ${token}`;
            if (spotifyToken) headers['x-spotify-token'] = spotifyToken;
            if (googleToken) headers['x-google-token'] = googleToken;
        } catch (e) {
            console.log("Error reading tokens", e);
        }

        try {
            const response = await fetch(`${API_URL}${endpoint}`, {
                headers: headers,
                credentials: 'include',
            });
            return response.json();
        } catch (error) {
            console.error('API GET Error:', error);
            return { error: true, message: 'Network request failed' };
        }
    },

    async post(endpoint: string, body: any) {
        console.log(`POST ${API_URL}${endpoint}`, body);
        const headers: any = {
            'Content-Type': 'application/json',
        };

        // Inject Tokens
        try {
            const token = await Store.getItemAsync('auth_token');
            const spotifyToken = await Store.getItemAsync('spotify_access_token');

            // Fix: ensure correct header names for Google middleware
            const googleToken = await Store.getItemAsync('google_access_token');
            // We also need refresh tokens ideally, but start with access
            const spotifyRefresh = await Store.getItemAsync('spotify_refresh_token');
            const googleRefresh = await Store.getItemAsync('google_refresh_token');

            if (token) headers['Authorization'] = `Bearer ${token}`;
            if (spotifyToken) headers['x-spotify-token'] = spotifyToken;
            if (spotifyRefresh) headers['x-spotify-refresh-token'] = spotifyRefresh;
            if (googleToken) headers['x-google-token'] = googleToken;
            if (googleRefresh) headers['x-google-refresh-token'] = googleRefresh;

        } catch (e) {
            console.log("Error reading tokens", e);
        }

        try {
            const response = await fetch(`${API_URL}${endpoint}`, {
                method: 'POST',
                headers: headers,
                credentials: 'include',
                body: JSON.stringify(body),
            });
            return response.json();
        } catch (error) {
            console.error('API POST Error:', error);
            return { error: true, message: 'Network request failed' };
        }
    }
};
