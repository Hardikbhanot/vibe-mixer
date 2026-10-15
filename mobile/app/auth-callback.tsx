import React, { useEffect, useState } from 'react';
import { StyleSheet, ActivityIndicator } from 'react-native';
import { Text, View } from '@/components/Themed';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Store from 'expo-secure-store';
import { LinearGradient } from 'expo-linear-gradient';
import FontAwesome from '@expo/vector-icons/FontAwesome';

export default function AuthCallbackScreen() {
    const params = useLocalSearchParams();
    const router = useRouter();
    const [statusText, setStatusText] = useState('Finalizing authentication...');
    const [isSuccess, setIsSuccess] = useState(false);

    useEffect(() => {
        async function processTokens() {
            try {
                const {
                    auth_token,
                    spotify_access_token,
                    spotify_refresh_token,
                    google_access_token,
                    google_refresh_token,
                } = params;

                let connectedService = 'account';

                if (auth_token) {
                    await Store.setItemAsync('auth_token', auth_token as string);
                }

                if (spotify_access_token) {
                    await Store.setItemAsync('spotify_access_token', spotify_access_token as string);
                    connectedService = 'Spotify';
                }
                if (spotify_refresh_token) {
                    await Store.setItemAsync('spotify_refresh_token', spotify_refresh_token as string);
                }

                if (google_access_token) {
                    await Store.setItemAsync('google_access_token', google_access_token as string);
                    connectedService = 'YouTube';
                }
                if (google_refresh_token) {
                    await Store.setItemAsync('google_refresh_token', google_refresh_token as string);
                }

                setIsSuccess(true);
                setStatusText(`Successfully linked ${connectedService}! Redirecting...`);

                setTimeout(() => {
                    router.replace('/profile');
                }, 1200);
            } catch (err) {
                console.error('Failed to store OAuth tokens:', err);
                setStatusText('Authentication error. Please try again.');
                setTimeout(() => {
                    router.replace('/profile');
                }, 2000);
            }
        }

        processTokens();
    }, [params]);

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#000000', '#11052C', '#1E0B36']}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 1 }}
                style={StyleSheet.absoluteFill}
            />

            <View style={styles.card}>
                <View style={styles.iconCircle}>
                    <FontAwesome
                        name={isSuccess ? 'check' : 'lock'}
                        size={32}
                        color={isSuccess ? '#10B981' : '#8B5CF6'}
                    />
                </View>

                <Text style={styles.title}>VibeMixer Auth</Text>
                <Text style={styles.subtitle}>{statusText}</Text>

                {!isSuccess && (
                    <ActivityIndicator size="large" color="#8B5CF6" style={{ marginTop: 20 }} />
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#000',
    },
    card: {
        width: '85%',
        padding: 30,
        borderRadius: 24,
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderWidth: 1,
        borderColor: 'rgba(139, 92, 246, 0.3)',
    },
    iconCircle: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: 'rgba(139, 92, 246, 0.15)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.7)',
        textAlign: 'center',
        lineHeight: 20,
    },
});
