
import { StyleSheet, Dimensions, Image, TouchableOpacity, ScrollView, RefreshControl } from 'react-native';
import { Text, View } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { LinearGradient } from 'expo-linear-gradient';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { api } from '@/constants/api';

const { width } = Dimensions.get('window');


export default function DiscoverScreen() {
    const colorScheme = useColorScheme();
    const router = useRouter();
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        fetchFeed();
    }, []);

    const fetchFeed = async () => {
        try {
            const res = await api.get('/api/playlists/public');
            if (res && res.playlists) {
                setVibes(res.playlists);
            }
        } catch (e) {
            console.log("Error fetching feed", e);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchFeed();
    };

    return (
        <View style={styles.container}>
            {/* Global Background */}
            <LinearGradient
                colors={['#000000', '#0a0a0a']}
                style={StyleSheet.absoluteFill}
            />

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#8B5CF6" />
                }
            >

                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.title}>Community Vibes</Text>
                    <Text style={styles.subtitle}>
                        Explore mixes curated by the VibeMixer community. Listen, get inspired, and vibe along.
                    </Text>
                </View>

                {loading ? (
                    <View style={{ marginTop: 50 }}>
                        <FontAwesome name="circle-o-notch" size={30} color="#8B5CF6" style={{ alignSelf: 'center' }} />
                    </View>
                ) : (
                    vibes.map((vibe) => (
                        <TouchableOpacity
                            key={vibe.id}
                            style={styles.card}
                            activeOpacity={0.9}
                            onPress={() => router.push(`/playlist/${vibe.id}`)}
                        >
                            <Image
                                source={{ uri: vibe.coverImage || 'https://via.placeholder.com/400' }}
                                style={styles.cardImage}
                            />

                            {/* Overlay Badge - Clickable Author */}
                            <TouchableOpacity
                                style={styles.authorBadge}
                                onPress={() => router.push(`/user/${vibe.user?.username}`)}
                            >
                                <View style={styles.avatarPlaceholder}>
                                    {vibe.user?.avatarUrl ? (
                                        <Image source={{ uri: vibe.user.avatarUrl }} style={{ width: 24, height: 24, borderRadius: 12 }} />
                                    ) : (
                                        <Text style={styles.avatarText}>{(vibe.user?.username?.[0] || 'U').toUpperCase()}</Text>
                                    )}
                                </View>
                                <Text style={styles.authorText}>@{vibe.user?.username || 'user'}</Text>
                            </TouchableOpacity>

                            <View style={styles.cardContent}>
                                <View style={styles.cardHeader}>
                                    <Text style={styles.cardTitle}>{vibe.name}</Text>
                                    <View style={styles.dateBadge}>
                                        <Text style={styles.dateText}>{new Date(vibe.createdAt).toLocaleDateString()}</Text>
                                    </View>
                                </View>

                                <Text style={styles.description} numberOfLines={2}>{vibe.description}</Text>

                                <View style={styles.cardFooter}>
                                    <View style={styles.tag}>
                                        <Text style={styles.tagText}>{vibe.mood || 'Mix'}</Text>
                                    </View>
                                    <View style={{ flexDirection: 'row', gap: 15, marginLeft: 'auto' }}>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                                            <FontAwesome name="heart" size={12} color="#666" />
                                            <Text style={styles.dateText}>{vibe.likeCount || 0}</Text>
                                        </View>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                                            <FontAwesome name="bookmark" size={12} color="#666" />
                                            <Text style={styles.dateText}>{vibe.saveCount || 0}</Text>
                                        </View>
                                    </View>
                                </View>
                            </View>
                        </TouchableOpacity>
                    ))
                )}

            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'black',
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 100,
    },
    header: {
        alignItems: 'center',
        marginVertical: 30,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#8B5CF6', // Purple tint
        marginBottom: 10,
        textAlign: 'center',
    },
    subtitle: {
        color: 'rgba(255,255,255,0.7)',
        textAlign: 'center',
        fontSize: 16,
        lineHeight: 22,
    },
    card: {
        backgroundColor: '#111',
        borderRadius: 20,
        overflow: 'hidden',
        marginBottom: 25,
        borderWidth: 1,
        borderColor: '#222',
    },
    cardImage: {
        width: '100%',
        height: 350, // Tall aesthetic images
        resizeMode: 'cover',
    },
    authorBadge: {
        position: 'absolute',
        top: 15,
        left: 15,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.6)',
        padding: 6,
        paddingRight: 12,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    avatarPlaceholder: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#8B5CF6',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
    },
    avatarText: {
        color: 'white',
        fontSize: 12,
        fontWeight: 'bold',
    },
    authorText: {
        color: 'white',
        fontSize: 12,
        fontWeight: '600',
    },
    cardContent: {
        padding: 20,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    cardTitle: {
        color: 'white',
        fontSize: 22,
        fontWeight: 'bold',
    },
    dateBadge: {
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
        borderRadius: 12,
        paddingHorizontal: 8,
        paddingVertical: 4,
    },
    dateText: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 10,
    },
    description: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 14,
        lineHeight: 20,
        marginBottom: 20,
    },
    cardFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: '#222',
        paddingTop: 15,
    },
    tag: {
        backgroundColor: 'rgba(139, 92, 246, 0.1)', // Purple tint bg
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 6,
    },
    tagText: {
        color: '#A78BFA',
        fontSize: 12,
        fontWeight: '600',
    }
});
