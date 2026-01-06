
import { StyleSheet, Image, FlatList, TouchableOpacity, ScrollView, Dimensions, Alert, Linking } from 'react-native';
import { Text, View } from '@/components/Themed';
import React, { useState, useEffect } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Colors from '@/constants/Colors';
import { api } from '@/constants/api';
import Animated, { FadeInDown } from 'react-native-reanimated';

export default function PublicProfileScreen() {
    const { username } = useLocalSearchParams();
    const router = useRouter();

    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (username) fetchPublicProfile();
    }, [username]);

    const fetchPublicProfile = async () => {
        try {
            const res = await api.get(`/api/user/public/${username}`);
            if (res && res.user) {
                setProfile(res.user);
            } else {
                Alert.alert("Error", "User not found or profile is private.");
                router.back();
            }
        } catch (e) {
            Alert.alert("Error", "Failed to load profile.");
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <LinearGradient colors={['#000000', '#1a1033']} style={StyleSheet.absoluteFill} />
                <FontAwesome name="circle-o-notch" size={40} color="#8B5CF6" />
            </View>
        );
    }

    if (!profile) return null;

    const renderHeader = () => (
        <View style={styles.header}>
            <View style={styles.navBar}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <FontAwesome name="arrow-left" size={20} color="white" />
                </TouchableOpacity>
                <Image source={require('@/assets/images/icon.png')} style={{ width: 100, height: 30, resizeMode: 'contain', opacity: 0.5 }} />
            </View>

            {/* Profile Card */}
            <View style={styles.profileCard}>
                <View style={styles.cardRow}>
                    <View style={styles.avatarContainer}>
                        {profile.avatarUrl ? (
                            <Image source={{ uri: profile.avatarUrl }} style={styles.avatarImage} />
                        ) : (
                            <Text style={styles.avatarText}>{profile.username?.[0].toUpperCase()}</Text>
                        )}
                    </View>

                    <View style={styles.infoCol}>
                        <Text style={styles.username}>@{profile.username}</Text>
                        <View style={styles.badge}><Text style={styles.badgeText}>VIBE CURATOR</Text></View>
                        <Text style={styles.bio}>{profile.bio || "No bio yet."}</Text>
                    </View>

                    <View style={styles.statsCol}>
                        <View style={styles.statBox}>
                            <Text style={styles.statNum}>{profile.playlists?.length || 0}</Text>
                            <Text style={styles.statLabel}>PUBLIC MIXES</Text>
                        </View>
                        <TouchableOpacity style={styles.msgButton}>
                            <FontAwesome name="envelope" size={12} color="black" style={{ marginRight: 6 }} />
                            <Text style={styles.msgText}>Message</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

            {/* Top Vibes */}
            <View style={styles.sectionHeader}>
                <FontAwesome name="bar-chart" size={16} color="#A78BFA" />
                <Text style={styles.sectionTitle}>Top Vibes</Text>
            </View>

            <View style={styles.vibeBox}>
                <View style={styles.tagsRow}>
                    {/* Placeholder logic for top vibes if backend doesn't send specific tags yet */}
                    {['#Chill', '#Late Night', '#Indie'].map(tag => (
                        <View key={tag} style={styles.tagPill}>
                            <Text style={styles.tagPillText}>{tag}</Text>
                        </View>
                    ))}
                </View>
                <Text style={styles.vibeSub}>Based on recently created playlists.</Text>
            </View>

            <View style={[styles.sectionHeader, { marginTop: 30 }]}>
                <FontAwesome name="music" size={16} color="white" />
                <Text style={styles.sectionTitle}>Public Mixes</Text>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#000000', '#1a1033']}
                style={StyleSheet.absoluteFill}
                start={{ x: 0.5, y: 1 }}
                end={{ x: 0.5, y: 0 }}
            />

            <FlatList
                data={profile.playlists || []}
                keyExtractor={(item) => item.id}
                ListHeaderComponent={renderHeader}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={styles.mixCard}
                        onPress={() => router.push(`/playlist/${item.id}`)}
                    >
                        <Image source={{ uri: item.coverImage || 'https://via.placeholder.com/150' }} style={styles.mixImage} />
                        <View style={styles.mixInfo}>
                            <Text style={styles.mixTitle} numberOfLines={1}>{item.name}</Text>
                            <Text style={styles.mixDesc} numberOfLines={2}>{item.description}</Text>
                            <View style={styles.mixMeta}>
                                <FontAwesome name="clock-o" size={12} color="#666" />
                                <Text style={styles.mixDate}> {new Date(item.createdAt).toLocaleDateString()}</Text>
                            </View>
                        </View>
                        <FontAwesome name="angle-right" size={20} color="#333" style={{ marginRight: 10 }} />
                    </TouchableOpacity>
                )}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyText}>This user hasn't published any mixes yet.</Text>
                    </View>
                }
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
    header: {
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    navBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 60,
        marginBottom: 30,
    },
    backBtn: { padding: 5 },

    profileCard: {
        backgroundColor: '#111',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#333',
        padding: 20,
        marginBottom: 30,
    },
    cardRow: {
        flexDirection: 'row',
        gap: 15,
    },
    avatarContainer: {
        width: 80, height: 80,
        borderRadius: 40,
        backgroundColor: '#1a1a2e',
        borderWidth: 2,
        borderColor: '#8B5CF6',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden'
    },
    avatarImage: { width: '100%', height: '100%' },
    avatarText: { fontSize: 30, fontWeight: 'bold', color: 'white' },

    infoCol: { flex: 1, justifyContent: 'center' },
    username: { fontSize: 18, fontWeight: 'bold', color: 'white' },
    badge: { backgroundColor: 'rgba(139, 92, 246, 0.2)', alignSelf: 'flex-start', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginVertical: 6 },
    badgeText: { color: '#A78BFA', fontSize: 10, fontWeight: 'bold' },
    bio: { color: '#ccc', fontSize: 13 },

    statsCol: { alignItems: 'flex-end', justifyContent: 'space-between' },
    statBox: { alignItems: 'center', backgroundColor: '#1a1a1a', padding: 10, borderRadius: 10, width: 90, borderWidth: 1, borderColor: '#333' },
    statNum: { fontSize: 20, fontWeight: 'bold', color: 'white' },
    statLabel: { fontSize: 9, color: '#888', fontWeight: 'bold' },

    msgButton: { marginTop: 10, flexDirection: 'row', alignItems: 'center', backgroundColor: '#A78BFA', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8 },
    msgText: { color: 'black', fontWeight: 'bold', fontSize: 12 },

    sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 15 },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: 'white' },

    vibeBox: {
        borderWidth: 1, borderColor: '#333', borderRadius: 15, padding: 20,
    },
    tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 10 },
    tagPill: { borderWidth: 1, borderColor: '#666', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
    tagPillText: { color: 'white', fontWeight: 'bold', fontSize: 12 },
    vibeSub: { color: '#666', fontSize: 12 },

    mixCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#111',
        borderRadius: 12,
        padding: 10,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: '#222',
        marginHorizontal: 20,
    },
    mixImage: { width: 60, height: 60, borderRadius: 8, marginRight: 15 },
    mixInfo: { flex: 1 },
    mixTitle: { color: 'white', fontWeight: 'bold', fontSize: 16 },
    mixDesc: { color: '#888', fontSize: 12, marginTop: 2 },
    mixMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
    mixDate: { color: '#666', fontSize: 12 },

    emptyState: {
        borderStyle: 'dashed', borderWidth: 1, borderColor: '#333',
        borderRadius: 15, padding: 40, alignItems: 'center', marginHorizontal: 20
    },
    emptyText: { color: '#666' }
});
