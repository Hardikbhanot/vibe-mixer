import { StyleSheet, Image, FlatList, TouchableOpacity, ScrollView, Alert, Linking, Dimensions, Share } from 'react-native';
import { Text, View } from '@/components/Themed';
import React, { useState, useEffect } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Colors from '@/constants/Colors';
import { api } from '@/constants/api';
import { useAuth } from '@/context/AuthContext';
import Animated, { FadeInDown } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

export default function PlaylistDetailsScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const { spotifyLinked, loginWithSpotify } = useAuth();

    const [playlist, setPlaylist] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [savingSpotify, setSavingSpotify] = useState(false);
    const [savingLibrary, setSavingLibrary] = useState(false);
    const [liked, setLiked] = useState(false);
    const [likeCount, setLikeCount] = useState(0);

    useEffect(() => {
        if (id) {
            fetchPlaylist();
            checkIsLiked();
        }
    }, [id]);

    const fetchPlaylist = async () => {
        try {
            const res = await api.get(`/api/playlists/public/${id}`);
            if (res && res.id) {
                setPlaylist(res);
                setLikeCount(res.likeCount || 0);
            } else {
                Alert.alert("Error", "Playlist not found.");
                router.back();
            }
        } catch (e) {
            Alert.alert("Error", "Failed to load playlist.");
        } finally {
            setLoading(false);
        }
    };

    const checkIsLiked = async () => {
        try {
            const res = await api.get(`/api/playlists/${id}/is-liked`);
            if (res && res.liked) setLiked(true);
        } catch (e) {
            // Likely not logged in, ignore
        }
    };

    const toggleLike = async () => {
        try {
            const res = await api.post(`/api/playlists/${id}/like`, {});
            if (res.error) {
                Alert.alert("Login Required", "Please login to like mixes.");
                return;
            }
            setLiked(res.liked);
            setLikeCount(res.count);
        } catch (e) {
            console.log("Like error", e);
        }
    };

    const handleSaveToLibrary = async () => {
        if (savingLibrary) return;
        setSavingLibrary(true);
        try {
            // 1. Clone to user's library
            const res = await api.post('/api/playlists', {
                name: playlist.name,
                description: `Saved from @${playlist.user.username}: ${playlist.description || ''}`,
                coverImage: playlist.coverImage,
                mood: playlist.mood,
                tracks: playlist.tracks,
                isPublic: false
            });

            if (res.error) {
                Alert.alert("Error", res.message || "Failed to save.");
            } else {
                // 2. Increment save count
                await api.post(`/api/playlists/${id}/save-count`, {});
                Alert.alert("Success", "Saved to your library!");
            }
        } catch (e) {
            Alert.alert("Error", "Network failed.");
        } finally {
            setSavingLibrary(false);
        }
    };

    const handleSaveToSpotify = async () => {
        if (!spotifyLinked) {
            Alert.alert("Spotify Not Connected", "Connect Spotify in settings to save.", [
                { text: "Cancel", style: "cancel" },
                { text: "Connect", onPress: loginWithSpotify }
            ]);
            return;
        }

        setSavingSpotify(true);
        try {
            const trackUris = playlist.tracks.map((t: any) => t.uri).filter((uri: any) => uri);
            const res = await api.post('/spotify/playlist', {
                name: `VibeMixer: ${playlist.name}`,
                description: playlist.description,
                trackUris,
                coverImageUrl: playlist.coverImage
            });

            if (res.error) {
                Alert.alert("Error", res.message || "Failed to save.");
            } else {
                Alert.alert("Success", "Saved to your Spotify!", [
                    { text: "Open Spotify", onPress: () => Linking.openURL(res.external_urls.spotify) },
                    { text: "OK" }
                ]);
            }
        } catch (e) {
            Alert.alert("Error", "Network failed.");
        } finally {
            setSavingSpotify(false);
        }
    };

    const playOnSpotify = (url: string) => {
        Linking.openURL(url).catch(() => Alert.alert("Error", "Could not open Spotify"));
    };

    const playOnYouTube = (trackName: string, artistName: string) => {
        const query = encodeURIComponent(`${trackName} ${artistName}`);
        Linking.openURL(`https://www.youtube.com/results?search_query=${query}`);
    };

    if (loading) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <LinearGradient colors={['#1a1a2e', '#000']} style={StyleSheet.absoluteFill} />
                <FontAwesome name="circle-o-notch" size={40} color="#8B5CF6" />
            </View>
        );
    }

    if (!playlist) return null;

    const renderHeader = () => (
        <View style={styles.headerContainer}>
            {/* Back Button */}
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                <FontAwesome name="arrow-left" size={20} color="white" />
                <Text style={styles.backText}>Back</Text>
            </TouchableOpacity>

            <View style={styles.heroContent}>
                <Image
                    source={{ uri: playlist.coverImage || 'https://via.placeholder.com/400' }}
                    style={styles.heroImage}
                />

                <View style={styles.infoColumn}>
                    <Text style={styles.title}>{playlist.name}</Text>

                    <View style={styles.metaRow}>
                        <View style={styles.tag}><Text style={styles.tagText}>{playlist.mood || 'Mix'}</Text></View>
                        <Text style={styles.metaText}>{new Date(playlist.createdAt).toLocaleDateString()}</Text>
                    </View>

                    {/* Action Bar */}
                    <View style={styles.actionBar}>
                        <TouchableOpacity style={styles.iconButton} onPress={toggleLike}>
                            <FontAwesome name={liked ? "heart" : "heart-o"} size={24} color={liked ? "#EF4444" : "white"} />
                            <Text style={styles.iconLabel}>{likeCount}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.iconButton} onPress={handleSaveToLibrary}>
                            <FontAwesome name="bookmark-o" size={24} color="white" />
                            <Text style={styles.iconLabel}>Save</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.spotifyButton} onPress={handleSaveToSpotify} disabled={savingSpotify}>
                            <FontAwesome name="spotify" size={20} color="white" style={{ marginRight: 8 }} />
                            <Text style={{ color: 'white', fontWeight: 'bold' }}>
                                {savingSpotify ? "..." : "Save to Spotify"}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.description}>{playlist.description}</Text>
                </View>
            </View>

            {/* Author Card */}
            <TouchableOpacity
                style={styles.authorCard}
                activeOpacity={0.8}
                onPress={() => router.push(`/user/${playlist.user?.username}`)}
            >
                <View style={[styles.avatarPlaceholder, playlist.user?.avatarUrl && { backgroundColor: 'transparent' }]}>
                    {playlist.user?.avatarUrl ? (
                        <Image source={{ uri: playlist.user.avatarUrl }} style={styles.avatarImage} />
                    ) : (
                        <Text style={styles.avatarText}>{playlist.user?.username?.[0] || 'U'}</Text>
                    )}
                </View>
                <View>
                    <Text style={styles.curatedBy}>CURATED BY</Text>
                    <Text style={styles.authorName}>@{playlist.user?.username || 'user'}</Text>
                </View>
                <FontAwesome name="chevron-right" size={14} color="#666" style={{ marginLeft: 'auto' }} />
            </TouchableOpacity>

            <Text style={styles.sectionTitle}>Tracks ({playlist.tracks?.length || 0})</Text>
        </View>
    );

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#1a1033', '#000000']}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 0.5 }}
            />

            <FlatList
                data={playlist.tracks}
                keyExtractor={(item, index) => item.id || index.toString()}
                ListHeaderComponent={renderHeader}
                renderItem={({ item, index }) => (
                    <View style={styles.trackItem}>
                        <Text style={styles.trackIndex}>{index + 1}</Text>
                        <Image source={{ uri: item.album?.images?.[0]?.url }} style={styles.trackImage} />
                        <View style={{ flex: 1, marginRight: 10 }}>
                            <Text style={styles.trackName} numberOfLines={1}>{item.name}</Text>
                            <Text style={styles.trackArtist}>{item.artists?.[0]?.name}</Text>
                        </View>

                        {/* Play Actions */}
                        <View style={styles.playActions}>
                            <TouchableOpacity onPress={() => playOnYouTube(item.name, item.artists?.[0]?.name)} style={{ padding: 5 }}>
                                <FontAwesome name="youtube-play" size={24} color="#FF0000" />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => playOnSpotify(item.external_urls?.spotify)} style={{ padding: 5 }}>
                                <FontAwesome name="spotify" size={24} color="#1DB954" />
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
                contentContainerStyle={{ paddingBottom: 40 }}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'black',
    },
    headerContainer: {
        padding: 20,
        paddingTop: 60,
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    backText: {
        color: 'white',
        fontSize: 16,
        marginLeft: 10,
    },
    heroContent: {
        flexDirection: 'column',
        marginBottom: 20,
    },
    heroImage: {
        width: '100%',
        aspectRatio: 1,
        borderRadius: 12,
        marginBottom: 20,
    },
    infoColumn: {
        gap: 12,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: 'white',
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 5,
    },
    tag: {
        backgroundColor: 'rgba(139, 92, 246, 0.2)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    tagText: { color: '#A78BFA', fontSize: 12, fontWeight: 'bold' },
    metaText: { color: '#888', fontSize: 13 },

    actionBar: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 15,
        marginVertical: 10,
    },
    iconButton: {
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
    },
    iconLabel: {
        color: '#ccc',
        fontSize: 10,
    },

    spotifyButton: {
        flexDirection: 'row',
        backgroundColor: '#1DB954',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 25,
        alignItems: 'center',
        marginLeft: 'auto',
    },
    description: {
        color: '#aaa',
        fontSize: 15,
        lineHeight: 22,
    },

    authorCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#111',
        padding: 15,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#333',
        marginBottom: 25,
    },
    avatarPlaceholder: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#1a1a2e',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
        borderWidth: 1,
        borderColor: '#8B5CF6'
    },
    avatarImage: { width: 40, height: 40, borderRadius: 20 },
    avatarText: { color: '#8B5CF6', fontWeight: 'bold' },
    curatedBy: { color: '#666', fontSize: 10, fontWeight: 'bold', marginBottom: 2 },
    authorName: { color: 'white', fontSize: 16, fontWeight: 'bold' },

    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: 'white', marginBottom: 15 },

    trackItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#111',
    },
    trackIndex: { color: '#444', width: 30, fontSize: 14, fontWeight: 'bold' },
    trackImage: { width: 40, height: 40, borderRadius: 4, marginRight: 12 },
    trackName: { color: 'white', fontSize: 15, fontWeight: '500', marginBottom: 2 },
    trackArtist: { color: '#888', fontSize: 13 },
    playActions: { flexDirection: 'row', gap: 10 },
});
