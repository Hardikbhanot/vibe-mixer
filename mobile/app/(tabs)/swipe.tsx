
import { StyleSheet, Dimensions, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import React, { useState, useEffect, useCallback } from 'react';
import { Text, View } from '@/components/Themed';
import { GestureDetector, Gesture, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, runOnJS, withTiming, interpolate, Extrapolate, withSequence } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { api } from '@/constants/api';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'expo-router';

const { width, height } = Dimensions.get('window');
const SWIPE_THRESHOLD = width * 0.25;
const CARD_WIDTH = width * 0.9;
const CARD_HEIGHT = height * 0.65;

export default function SwipeScreen() {
    const { user, isLoading } = useAuth();
    const router = useRouter();

    const [cards, setCards] = useState<any[]>([]); // Feed data
    const [loading, setLoading] = useState(true);

    // Animation Values
    const translateX = useSharedValue(0);
    const translateY = useSharedValue(0);
    const cardRotate = useSharedValue(0);
    const cardScale = useSharedValue(1);

    // Fetch Feed
    useEffect(() => {
        if (user) loadFeed();
        else if (!isLoading) setLoading(false);
    }, [user, isLoading]);

    const loadFeed = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const res = await api.get('/api/swipe/feed');
            if (res && res.tracks) {
                // Filter out duplicates if needed
                setCards(res.tracks);
            }
        } catch (e) {
            console.error("Feed load failed", e);
        } finally {
            setLoading(false);
        }
    };

    const handleSwipe = useCallback(async (direction: 'left' | 'right' | 'up') => {
        if (cards.length === 0) return;
        const currentCard = cards[0];
        const action = direction === 'right' ? 'LIKE' : direction === 'left' ? 'DISLIKE' : 'SUPERLIKE';

        // Optimistic Remove
        setCards(prev => prev.slice(1));

        // Reset Animation
        translateX.value = 0;
        translateY.value = 0;
        cardRotate.value = 0;
        cardScale.value = 1;

        // API Call
        try {
            await api.post('/api/swipe', {
                songName: currentCard.name,
                artistName: currentCard.artists[0].name,
                spotifyId: currentCard.id,
                action: action
            });
        } catch (e) {
            console.error("Swipe API failed", e);
        }

        // Refill
        if (cards.length <= 2) loadFeed();
    }, [cards]);

    // Gesture
    const gesture = Gesture.Pan()
        .onBegin(() => {
            cardScale.value = withTiming(1.02, { duration: 100 });
        })
        .onUpdate((event) => {
            translateX.value = event.translationX;
            translateY.value = event.translationY * 0.8;
            cardRotate.value = interpolate(event.translationX, [-width, width], [-15, 15]);
        })
        .onEnd((event) => {
            if (event.translationX > SWIPE_THRESHOLD) {
                translateX.value = withTiming(width * 1.5, {}, () => runOnJS(handleSwipe)('right'));
            } else if (event.translationX < -SWIPE_THRESHOLD) {
                translateX.value = withTiming(-width * 1.5, {}, () => runOnJS(handleSwipe)('left'));
            } else if (event.translationY < -SWIPE_THRESHOLD) {
                translateY.value = withTiming(-height, {}, () => runOnJS(handleSwipe)('up'));
            } else {
                translateX.value = withSpring(0);
                translateY.value = withSpring(0);
                cardRotate.value = withSpring(0);
                cardScale.value = withSpring(1);
            }
        });

    // Animated Styles
    const topCardStyle = useAnimatedStyle(() => ({
        transform: [
            { translateX: translateX.value },
            { translateY: translateY.value },
            { rotate: `${cardRotate.value}deg` },
            { scale: cardScale.value }
        ]
    }));

    // Back card scales up as you swipe
    const nextCardStyle = useAnimatedStyle(() => {
        const scale = interpolate(
            Math.abs(translateX.value),
            [0, width],
            [0.92, 1],
            Extrapolate.CLAMP
        );
        return {
            transform: [{ scale }],
            opacity: interpolate(Math.abs(translateX.value), [0, width], [0.5, 1])
        };
    });

    const triggerSwipe = (direction: 'left' | 'right') => {
        const value = direction === 'right' ? width * 1.5 : -width * 1.5;
        translateX.value = withTiming(value, { duration: 300 }, () => runOnJS(handleSwipe)(direction));
    };

    const triggerSuperLike = () => {
        translateY.value = withTiming(-height, { duration: 300 }, () => runOnJS(handleSwipe)('up'));
    };

    if (isLoading) return <LoadingScreen />;
    if (!user) return <LoginGate router={router} />;
    if (loading && cards.length === 0) return <LoadingScreen message="Curating your vibe..." />;
    if (cards.length === 0) return <EmptyFeed loadFeed={loadFeed} />;

    const topCard = cards[0];
    const nextCard = cards[1];
    const image = topCard.album?.images[0]?.url || 'https://via.placeholder.com/600';

    return (
        <View style={styles.container}>
            <LinearGradient colors={['#111', '#000']} style={StyleSheet.absoluteFill} />

            {/* Header */}
            <View style={styles.header}>
                <FontAwesome name="music" size={20} color="#FF4b4b" />
                <Text style={styles.headerTitle}>Discover</Text>
            </View>

            {/* Cards Area */}
            <View style={styles.cardStack}>
                {nextCard && (
                    <Animated.View style={[styles.card, styles.nextCard, nextCardStyle]}>
                        <Image source={{ uri: nextCard.album?.images[0]?.url }} style={styles.cardImage} />
                    </Animated.View>
                )}

                <GestureDetector gesture={gesture}>
                    <Animated.View style={[styles.card, topCardStyle]}>
                        <Image source={{ uri: image }} style={styles.cardImage} />

                        {/* Gradient Text Overlay */}
                        <LinearGradient
                            colors={['transparent', 'rgba(0,0,0,0.8)', 'rgba(0,0,0,0.95)']}
                            style={styles.cardOverlay}
                        >
                            <Text style={styles.trackName} numberOfLines={2}>{topCard.name}</Text>
                            <Text style={styles.artistName}>{topCard.artists[0]?.name}</Text>
                            <Text style={styles.albumName}>{topCard.album?.name || 'Single'}</Text>
                        </LinearGradient>

                        {/* Swipe overlay badges could go here */}
                    </Animated.View>
                </GestureDetector>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionContainer}>
                <TouchableOpacity style={[styles.actionBtn, styles.btnDislike]} onPress={() => triggerSwipe('left')}>
                    <FontAwesome name="times" size={30} color="#EF4444" />
                </TouchableOpacity>

                <TouchableOpacity style={[styles.actionBtn, styles.btnSuper]} onPress={triggerSuperLike}>
                    <FontAwesome name="star" size={24} color="#3B82F6" />
                </TouchableOpacity>

                <TouchableOpacity style={[styles.actionBtn, styles.btnLike]} onPress={() => triggerSwipe('right')}>
                    <FontAwesome name="heart" size={30} color="#10B981" />
                </TouchableOpacity>
            </View>
        </View>
    );
}

// Components
const LoadingScreen = ({ message = "Loading..." }) => (
    <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#FF4b4b" />
        <Text style={styles.loadingText}>{message}</Text>
    </View>
);

const EmptyFeed = ({ loadFeed }: { loadFeed: () => void }) => (
    <View style={styles.centerContainer}>
        <FontAwesome name="search" size={50} color="#333" />
        <Text style={styles.emptyText}>No more vibes nearby.</Text>
        <TouchableOpacity style={styles.refreshBtn} onPress={loadFeed}>
            <Text style={styles.refreshText}>Refresh Feed</Text>
        </TouchableOpacity>
    </View>
);

const LoginGate = ({ router }: { router: any }) => (
    <View style={styles.centerContainer}>
        <FontAwesome name="lock" size={50} color="#666" />
        <Text style={styles.emptyText}>Join to start swiping</Text>
        <TouchableOpacity style={styles.refreshBtn} onPress={() => router.push('/login')}>
            <Text style={styles.refreshText}>Log In</Text>
        </TouchableOpacity>
    </View>
);

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' },
    header: {
        height: 60,
        marginTop: 50,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8
    },
    headerTitle: { color: 'white', fontSize: 18, fontWeight: '700', letterSpacing: 0.5 },

    cardStack: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    card: {
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        borderRadius: 24,
        backgroundColor: '#1E1E1E',
        overflow: 'hidden',
        position: 'absolute',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
        elevation: 10,
    },
    nextCard: { zIndex: -1 }, // transform handled by reanimated
    cardImage: { width: '100%', height: '100%', resizeMode: 'cover' },
    cardOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 24,
        paddingBottom: 32,
    },
    trackName: { color: 'white', fontSize: 26, fontWeight: '800', marginBottom: 4, textShadowColor: 'rgba(0,0,0,0.5)', textShadowRadius: 10 },
    artistName: { color: '#E5E5E5', fontSize: 18, fontWeight: '500', marginBottom: 4 },
    albumName: { color: '#9CA3AF', fontSize: 14, fontWeight: '400' },

    actionContainer: {
        flexDirection: 'row',
        justifyContent: 'space-evenly',
        alignItems: 'center',
        marginBottom: 50,
        paddingHorizontal: 20,
    },
    actionBtn: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#1F1F1F',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 6,
        borderWidth: 1,
        borderColor: '#333',
    },
    btnDislike: { borderColor: 'rgba(239, 68, 68, 0.3)' },
    btnLike: { borderColor: 'rgba(16, 185, 129, 0.3)' },
    btnSuper: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#1A1A1A', marginTop: 10, borderColor: 'rgba(59, 130, 246, 0.3)' },

    // Misc
    loadingText: { color: '#666', marginTop: 16 },
    emptyText: { color: '#666', fontSize: 16, marginVertical: 20 },
    refreshBtn: { backgroundColor: '#FF4b4b', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 30 },
    refreshText: { color: 'white', fontWeight: 'bold' }
});
