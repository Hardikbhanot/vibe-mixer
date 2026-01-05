import { StyleSheet, Dimensions, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import React, { useState, useEffect, useCallback } from 'react';
import { Text, View } from '@/components/Themed';
import { GestureDetector, Gesture, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, runOnJS, withTiming, interpolate, Extrapolate } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { api } from '@/constants/api'; // Import API helper

const { width, height } = Dimensions.get('window');
const SWIPE_THRESHOLD = width * 0.25;

export default function SwipeScreen() {
    const [cards, setCards] = useState<any[]>([]); // Real data
    const [loading, setLoading] = useState(true);

    // Animation Values
    const translateX = useSharedValue(0);
    const translateY = useSharedValue(0);
    const cardScale = useSharedValue(1);

    // Fetch Feed on Mount
    useEffect(() => {
        loadFeed();
    }, []);

    const loadFeed = async () => {
        setLoading(true);
        console.log("Fetching swipe feed...");
        const res = await api.get('/api/swipe/feed');
        if (res && res.tracks) {
            console.log(`Loaded ${res.tracks.length} tracks`);
            setCards(res.tracks);
        } else {
            console.error("Failed to load feed", res);
        }
        setLoading(false);
    };

    const handleSwipe = useCallback(async (direction: 'left' | 'right' | 'up') => {
        if (cards.length === 0) return;

        const currentCard = cards[0];
        const action = direction === 'right' ? 'LIKE' : direction === 'left' ? 'DISLIKE' : 'SUPERLIKE';

        // 1. Optimistic UI Update: Remove card immediately
        setCards(prev => prev.slice(1));

        // Reset position for next card (visually hidden/replaced)
        translateX.value = 0;
        translateY.value = 0;
        cardScale.value = 1; // Reset scale

        console.log(`Swiped ${direction} on ${currentCard.name} `);

        // 2. Send to Backend
        // Ensure we map the data correctly to what the backend expects
        await api.post('/api/swipe', {
            songName: currentCard.name,
            artistName: currentCard.artists[0].name,
            spotifyId: currentCard.id,
            action: action
        });

        // Refill if empty
        if (cards.length <= 1) { // <= 1 because we just removed one
            loadFeed();
        }

    }, [cards, translateX, translateY, cardScale]);

    // Gesture Handling
    const gesture = Gesture.Pan()
        .onBegin(() => {
            cardScale.value = withTiming(1.05, { duration: 100 });
        })
        .onUpdate((event) => {
            translateX.value = event.translationX;
            translateY.value = event.translationY * 0.8; // Reduce vertical movement slightly
        })
        .onEnd((event) => {
            if (event.translationX > SWIPE_THRESHOLD) {
                // Swipe Right
                translateX.value = withTiming(width * 1.5, {}, () => {
                    runOnJS(handleSwipe)('right');
                });
            } else if (event.translationX < -SWIPE_THRESHOLD) {
                // Swipe Left
                translateX.value = withTiming(-width * 1.5, {}, () => {
                    runOnJS(handleSwipe)('left');
                });
            } else if (event.translationY < -SWIPE_THRESHOLD) {
                // Swipe Up (Superlike)
                translateY.value = withTiming(-height, {}, () => {
                    runOnJS(handleSwipe)('up');
                });
            } else {
                // Return to center
                translateX.value = withSpring(0);
                translateY.value = withSpring(0);
                cardScale.value = withSpring(1);
            }
        });

    const animatedStyle = useAnimatedStyle(() => {
        const rotate = interpolate(
            translateX.value,
            [-width / 2, 0, width / 2],
            [-10, 0, 10],
            Extrapolate.CLAMP
        );

        return {
            transform: [
                { translateX: translateX.value },
                { translateY: translateY.value },
                { rotate: `${rotate} deg` },
                { scale: cardScale.value }
            ]
        };
    });

    // Next Card Style (Scale up as front card moves)
    const nextCardStyle = useAnimatedStyle(() => {
        const scale = interpolate(
            Math.abs(translateX.value),
            [0, width],
            [0.9, 1],
            Extrapolate.CLAMP
        );
        return {
            transform: [{ scale }],
            opacity: scale
        };
    });

    if (loading && cards.length === 0) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color="#A855F7" />
                <Text style={{ marginTop: 20, color: '#888' }}>Finding your vibe...</Text>
            </View>
        );
    }

    if (cards.length === 0) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <Text style={{ color: 'white', marginBottom: 20 }}>No more vibes right now!</Text>
                <TouchableOpacity onPress={loadFeed} style={styles.resetButton}>
                    <Text style={{ color: 'black', fontWeight: 'bold' }}>Refresh Feed</Text>
                </TouchableOpacity>
            </View>
        );
    }

    // Prepare Cards
    const topCard = cards[0];
    const nextCard = cards.length > 1 ? cards[1] : null;

    // Helper to secure image URL
    const getImageUrl = (track: any) => {
        if (track.album && track.album.images && track.album.images.length > 0) {
            return track.album.images[0].url;
        }
        return 'https://via.placeholder.com/400x400.png?text=No+Image';
    };

    return (
        <View style={styles.container}>
            <LinearGradient colors={['#000000', '#0a0a0a']} style={StyleSheet.absoluteFill} />

            <View style={styles.header}>
                <Text style={styles.headerTitle}>Vibe Swipe</Text>
            </View>

            <View style={styles.cardContainer}>

                {/* Background Card (Next) */}
                {nextCard && (
                    <Animated.View style={[styles.card, styles.nextCard, nextCardStyle]}>
                        <Image source={{ uri: getImageUrl(nextCard) }} style={styles.image} resizeMode="cover" />
                        <LinearGradient colors={['transparent', 'rgba(0,0,0,0.9)']} style={styles.cardInfo}>
                            <Text style={styles.cardTitle}>{nextCard.name}</Text>
                            <Text style={styles.cardArtist}>{nextCard.artists[0]?.name}</Text>
                        </LinearGradient>
                    </Animated.View>
                )}

                {/* Foreground Card (Active) */}
                <GestureDetector gesture={gesture}>
                    <Animated.View style={[styles.card, animatedStyle]}>
                        <Image source={{ uri: getImageUrl(topCard) }} style={styles.image} resizeMode="cover" />

                        {/* Gradient Overlay for Text Readability */}
                        <LinearGradient colors={['transparent', 'rgba(0,0,0,0.9)']} style={styles.cardInfo}>
                            <Text style={styles.cardTitle}>{topCard.name}</Text>
                            <Text style={styles.cardArtist}>{topCard.artists[0]?.name}</Text>
                            <Text style={styles.cardTags}>
                                {topCard.album?.name} • {(topCard.duration_ms / 60000).toFixed(1)} mins
                            </Text>
                        </LinearGradient>

                        {/* Stamps (Like/Nope) - Optional Polish */}
                    </Animated.View>
                </GestureDetector>

            </View>

            {/* Action Buttons */}
            <View style={styles.actions}>
                <TouchableOpacity
                    style={[styles.actionBtn, { borderColor: '#ef4444' }]}
                    onPress={() => {
                        translateX.value = withTiming(-width * 1.5, {}, () => runOnJS(handleSwipe)('left'));
                    }}
                >
                    <FontAwesome name="times" size={30} color="#ef4444" />
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.actionBtn, { borderColor: '#3b82f6', width: 60, height: 60 }]}
                    onPress={() => {
                        translateY.value = withTiming(-height, {}, () => runOnJS(handleSwipe)('up'));
                    }}
                >
                    <FontAwesome name="star" size={24} color="#3b82f6" />
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.actionBtn, { borderColor: '#22c55e' }]}
                    onPress={() => {
                        translateX.value = withTiming(width * 1.5, {}, () => runOnJS(handleSwipe)('right'));
                    }}
                >
                    <FontAwesome name="heart" size={30} color="#22c55e" />
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'black',
    },
    header: {
        marginTop: 60,
        alignItems: 'center',
    },
    headerTitle: {
        color: 'white',
        fontSize: 24,
        fontWeight: 'bold',
        fontFamily: 'Inter', // Assuming Inter is available or fallback
    },
    cardContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 20,
    },
    card: {
        width: width * 0.9,
        height: height * 0.6,
        borderRadius: 20,
        backgroundColor: '#1a1a1a',
        overflow: 'hidden',
        position: 'absolute', // Stack them
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.30,
        shadowRadius: 4.65,
        elevation: 8,
    },
    nextCard: {
        zIndex: -1,
        // We handle the transform via reanimated now
    },
    image: {
        width: '100%',
        height: '100%',
    },
    cardInfo: {
        position: 'absolute',
        bottom: 0,
        width: '100%',
        padding: 30,
        paddingBottom: 40,
        alignItems: 'center',
    },
    cardTitle: {
        color: 'white',
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 5,
        textAlign: 'center',
    },
    cardArtist: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 18,
        fontWeight: '500',
        marginBottom: 5,
        textAlign: 'center',
    },
    cardSub: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 14,
        textAlign: 'center',
    },
    controls: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 30,
        marginTop: 40,
    },
    circleButton: {
        // Hit slop could be added here
    },
    circleInner: {
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
    }
});
