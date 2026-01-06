
import { StyleSheet, Dimensions, ScrollView, TouchableOpacity, Image, TextInput, Switch, FlatList, ActivityIndicator, ImageBackground, Alert } from 'react-native';
import { Text, View } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useAuth } from '@/context/AuthContext';
import { Stack, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useState, useEffect } from 'react';
import { api } from '@/constants/api';

// Types (matching web)
interface SwipeRecord {
    id: string;
    songName: string;
    artistName: string;
    action: 'LIKE' | 'DISLIKE' | 'SUPERLIKE';
    created_at: string;
}

interface SavedPlaylist {
    id: number;
    name: string;
    description: string;
    coverImage: string;
    createdAt: string;
    isPublic: boolean;
}

interface ProfileData {
    username: string;
    bio: string;
    isPublic: boolean;
    isMatchable: boolean;
    avatarUrl: string;
    vibeTags?: string[];
}

export default function ProfileScreen() {
    const { user, logout } = useAuth();
    const router = useRouter();
    const theme = Colors['dark'];

    const [activeTab, setActiveTab] = useState<'mixes' | 'history' | 'settings'>('mixes');
    const [isLoading, setIsLoading] = useState(true);

    // Dynamic Data
    const [history, setHistory] = useState<SwipeRecord[]>([]);
    const [playlists, setPlaylists] = useState<SavedPlaylist[]>([]);
    const [profileData, setProfileData] = useState<ProfileData>({
        username: '',
        bio: '',
        isPublic: false,
        isMatchable: false,
        avatarUrl: '',
    });

    // Loading States
    const [isSaving, setIsSaving] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    useEffect(() => {
        if (user) {
            loadAllData();
        }
    }, [user]);

    const loadAllData = async () => {
        setIsLoading(true);
        try {
            await Promise.all([
                fetchProfile(),
                fetchPlaylists(),
                fetchHistory()
            ]);
        } catch (e) {
            console.error("Failed to load profile data", e);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchProfile = async () => {
        const res = await api.get('/api/user/profile');
        if (res && res.user) {
            setProfileData({
                username: res.user.username || '',
                bio: res.user.bio || '',
                isPublic: res.user.isPublic || false,
                isMatchable: res.user.isMatchable || false,
                avatarUrl: res.user.avatarUrl || '',
                vibeTags: res.user.vibeTags || []
            });
        }
    };

    const fetchPlaylists = async () => {
        const res = await api.get('/api/playlists');
        if (Array.isArray(res)) {
            setPlaylists(res);
        }
    };

    const fetchHistory = async () => {
        const res = await api.get('/api/user/history');
        if (res && res.history) {
            setHistory(res.history);
        }
    };

    const handleSaveSettings = async () => {
        setIsSaving(true);
        try {
            const res = await api.put('/api/user/profile', profileData);
            if (res && !res.error) {
                Alert.alert("Success", "Profile updated!");
            } else {
                Alert.alert("Error", res.message || "Failed to update profile");
            }
        } catch (e) {
            Alert.alert("Error", "Network error");
        } finally {
            setIsSaving(false);
        }
    };

    const analyzeVibe = async () => {
        setIsAnalyzing(true);
        try {
            // Need to verify this endpoint exists on backend
            // For now, assuming it works like web
            const res = await api.post('/ai/profile-vibe', {}); // Assuming POST
            if (res && res.bio) {
                setProfileData(prev => ({ ...prev, bio: res.bio }));
            } else {
                Alert.alert("Info", "AI analysis unavailable strictly on mobile yet.");
            }
        } catch (e) {
            console.log("AI Vibe check failed", e);
        } finally {
            setIsAnalyzing(false);
        }
    };

    const deleteSwipe = async (id: string) => {
        try {
            const res = await api.delete(`/api/user/history/${id}`);
            if (res && !res.error) {
                setHistory(prev => prev.filter(h => h.id !== id));
            }
        } catch (e) {
            console.error(e);
        }
    }

    // --- RENDERERS ---

    const renderHeader = () => (
        <View style={styles.header}>
            <LinearGradient colors={['rgba(0,0,0,0.8)', '#000']} style={StyleSheet.absoluteFill} />

            <View style={styles.avatarContainer}>
                {profileData.avatarUrl ? (
                    <Image source={{ uri: profileData.avatarUrl }} style={styles.avatarImage} />
                ) : (
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>{user?.email?.charAt(0).toUpperCase()}</Text>
                    </View>
                )}
                {/* Edit Icon Badge */}
                <View style={styles.editBadge}>
                    <FontAwesome name="camera" size={12} color="white" />
                </View>
            </View>

            <Text style={styles.name}>{profileData.username || user?.email?.split('@')[0]}</Text>
            <Text style={styles.role}>{profileData.bio || "Vibe Curator"}</Text>

            {/* Tags */}
            {profileData.vibeTags && (
                <View style={styles.tagRow}>
                    {profileData.vibeTags.slice(0, 3).map((tag, i) => (
                        <View key={i} style={styles.tag}><Text style={styles.tagText}>{tag}</Text></View>
                    ))}
                </View>
            )}

            <View style={styles.statsRow}>
                <View style={styles.stat}>
                    <Text style={styles.statValue}>{playlists.length}</Text>
                    <Text style={styles.statLabel}>MIXES</Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.stat}>
                    <Text style={styles.statValue}>{history.length}</Text>
                    <Text style={styles.statLabel}>SWIPES</Text>
                </View>
            </View>

            <TouchableOpacity onPress={logout} style={styles.signOutBtn}>
                <FontAwesome name="sign-out" size={16} color="#ef4444" />
                <Text style={styles.signOut}>Sign Out</Text>
            </TouchableOpacity>

            {/* TABS */}
            <View style={styles.tabContainer}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'mixes' && styles.activeTab]}
                    onPress={() => setActiveTab('mixes')}
                >
                    <Text style={[styles.tabText, activeTab === 'mixes' && styles.activeTabText]}>My Mixes</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'history' && styles.activeTab]}
                    onPress={() => setActiveTab('history')}
                >
                    <Text style={[styles.tabText, activeTab === 'history' && styles.activeTabText]}>History</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'settings' && styles.activeTab]}
                    onPress={() => setActiveTab('settings')}
                >
                    <Text style={[styles.tabText, activeTab === 'settings' && styles.activeTabText]}>Settings</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    const renderMixes = () => (
        <View style={styles.grid}>
            {playlists.length === 0 ? (
                <View style={styles.emptyState}>
                    <Text style={styles.emptyText}>No mixes yet.</Text>
                    <TouchableOpacity onPress={() => router.push('/(tabs)/generate')} style={styles.createBtn}>
                        <Text style={styles.createBtnText}>Create Vibe</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                playlists.map(mix => (
                    <View key={mix.id} style={styles.mixCard}>
                        <Image source={{ uri: mix.coverImage || 'https://via.placeholder.com/300' }} style={styles.mixImage} />
                        <LinearGradient colors={['transparent', 'rgba(0,0,0,0.9)']} style={styles.mixOverlay}>
                            <View style={styles.mixHeader}>
                                {mix.isPublic ? (
                                    <View style={[styles.badge, { backgroundColor: '#A855F7' }]}><Text style={styles.badgeText}>PUBLIC</Text></View>
                                ) : (
                                    <View style={[styles.badge, { backgroundColor: '#333' }]}><Text style={styles.badgeText}>PRIVATE</Text></View>
                                )}
                            </View>
                            <View>
                                <Text style={styles.mixTitle} numberOfLines={1}>{mix.name}</Text>
                                <Text style={styles.mixDesc} numberOfLines={2}>{mix.description}</Text>
                            </View>
                        </LinearGradient>
                    </View>
                ))
            )}
        </View>
    );

    const renderHistory = () => (
        <View style={{ padding: 20 }}>
            <View style={styles.statsDashboard}>
                <View style={[styles.dashCard, { borderColor: 'rgba(74, 222, 128, 0.2)' }]}>
                    <Text style={[styles.dashValue, { color: '#4ade80' }]}>{history.filter(h => h.action === 'LIKE').length}</Text>
                    <Text style={styles.dashLabel}>LIKES</Text>
                </View>
                <View style={[styles.dashCard, { borderColor: 'rgba(96, 165, 250, 0.2)' }]}>
                    <Text style={[styles.dashValue, { color: '#60a5fa' }]}>{history.filter(h => h.action === 'SUPERLIKE').length}</Text>
                    <Text style={styles.dashLabel}>SUPERS</Text>
                </View>
                <View style={[styles.dashCard, { borderColor: 'rgba(248, 113, 113, 0.2)' }]}>
                    <Text style={[styles.dashValue, { color: '#f87171' }]}>{history.filter(h => h.action === 'DISLIKE').length}</Text>
                    <Text style={styles.dashLabel}>PASS</Text>
                </View>
            </View>

            {history.map(item => (
                <View key={item.id} style={styles.historyRow}>
                    <View style={{ flex: 1, marginRight: 10 }}>
                        <Text style={styles.historyTitle} numberOfLines={1}>{item.songName}</Text>
                        <Text style={styles.historyArtist} numberOfLines={1}>{item.artistName}</Text>
                    </View>
                    {item.action === 'LIKE' ? (
                        <View style={[styles.actionBadge, { backgroundColor: 'rgba(74, 222, 128, 0.1)' }]}>
                            <Text style={{ color: '#4ade80', fontSize: 10, fontWeight: 'bold' }}>LIKE</Text>
                        </View>
                    ) : item.action === 'SUPERLIKE' ? (
                        <View style={[styles.actionBadge, { backgroundColor: 'rgba(96, 165, 250, 0.1)' }]}>
                            <Text style={{ color: '#60a5fa', fontSize: 10, fontWeight: 'bold' }}>SUPER</Text>
                        </View>
                    ) : (
                        <View style={[styles.actionBadge, { backgroundColor: 'rgba(248, 113, 113, 0.1)' }]}>
                            <Text style={{ color: '#f87171', fontSize: 10, fontWeight: 'bold' }}>PASS</Text>
                        </View>
                    )}
                    <TouchableOpacity onPress={() => deleteSwipe(item.id)} style={{ padding: 5 }}>
                        <FontAwesome name="close" size={14} color="#666" style={{ marginLeft: 10 }} />
                    </TouchableOpacity>
                </View>
            ))}
        </View>
    );

    const renderSettings = () => (
        <View style={{ padding: 20 }}>
            <Text style={styles.sectionTitle}>Edit Profile</Text>

            <Text style={styles.label}>Username</Text>
            <TextInput
                style={styles.input}
                value={profileData.username}
                onChangeText={(t) => setProfileData(p => ({ ...p, username: t }))}
                placeholderTextColor="#666"
            />

            <View style={{ marginVertical: 20 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
                    <Text style={styles.label}>Bio</Text>
                    <TouchableOpacity style={styles.aiButton} onPress={analyzeVibe} disabled={isAnalyzing}>
                        <FontAwesome name="magic" size={12} color="#A855F7" style={{ marginRight: 5 }} />
                        <Text style={{ color: '#A855F7', fontSize: 12, fontWeight: 'bold' }}>
                            {isAnalyzing ? "Analyzing..." : "AI Vibe Check"}
                        </Text>
                    </TouchableOpacity>
                </View>
                <TextInput
                    style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
                    value={profileData.bio}
                    onChangeText={(t) => setProfileData(p => ({ ...p, bio: t }))}
                    multiline
                    placeholderTextColor="#666"
                />
            </View>

            <View style={styles.switchRow}>
                <View style={{ width: '80%' }}>
                    <Text style={styles.switchLabel}>Public Profile</Text>
                    <Text style={styles.switchSub}>Allow others to see your mixes.</Text>
                </View>
                <Switch
                    value={profileData.isPublic}
                    onValueChange={(v) => setProfileData(p => ({ ...p, isPublic: v }))}
                    trackColor={{ true: '#A855F7', false: '#333' }}
                />
            </View>

            <View style={styles.switchRow}>
                <View style={{ width: '80%' }}>
                    <Text style={styles.switchLabel}>Vibe Match</Text>
                    <Text style={styles.switchSub}>Allow others to match with you.</Text>
                </View>
                <Switch
                    value={profileData.isMatchable}
                    onValueChange={(v) => setProfileData(p => ({ ...p, isMatchable: v }))}
                    trackColor={{ true: '#A855F7', false: '#333' }}
                />
            </View>

            <TouchableOpacity
                style={[styles.saveButton, isSaving && { opacity: 0.7 }]}
                onPress={handleSaveSettings}
                disabled={isSaving}
            >
                {isSaving ? <ActivityIndicator color="white" /> : <Text style={styles.saveText}>Save Changes</Text>}
            </TouchableOpacity>

        </View>
    );

    if (isLoading && !profileData.username) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color="#A855F7" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />
            <LinearGradient colors={['#1a1033', '#000000']} style={StyleSheet.absoluteFill} />

            <ScrollView stickyHeaderIndices={[0]}>
                {renderHeader()}

                {activeTab === 'mixes' && renderMixes()}
                {activeTab === 'history' && renderHistory()}
                {activeTab === 'settings' && renderSettings()}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'black',
    },
    header: {
        backgroundColor: '#000', // Opaque for sticky
        alignItems: 'center',
        paddingTop: 60,
        paddingBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#1a1a1a'
    },
    avatarContainer: {
        marginBottom: 15,
        position: 'relative',
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#1a1a2e',
        borderWidth: 2,
        borderColor: '#A855F7',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarImage: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 2,
        borderColor: '#A855F7',
    },
    avatarText: {
        fontSize: 40,
        fontWeight: 'bold',
        color: 'white',
    },
    editBadge: {
        position: 'absolute', bottom: 0, right: 0,
        backgroundColor: '#A855F7', padding: 8, borderRadius: 15,
        borderWidth: 2, borderColor: '#000'
    },
    name: {
        fontSize: 24,
        fontWeight: 'bold',
        color: 'white',
        marginBottom: 4,
    },
    role: {
        color: '#888',
        fontSize: 14,
        marginBottom: 15,
        paddingHorizontal: 20,
        textAlign: 'center'
    },
    tagRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
    tag: { backgroundColor: 'rgba(168, 85, 247, 0.1)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    tagText: { color: '#A855F7', fontSize: 10, fontWeight: 'bold' },

    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 30,
        marginBottom: 20,
    },
    divider: { width: 1, height: 30, backgroundColor: '#333' },
    stat: {
        alignItems: 'center',
    },
    statValue: {
        color: 'white',
        fontSize: 22,
        fontWeight: 'bold',
    },
    statLabel: {
        color: '#666',
        fontSize: 10,
        fontWeight: 'bold',
        marginTop: 2,
        letterSpacing: 1
    },
    signOutBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
        marginBottom: 20,
    },
    signOut: {
        color: '#ef4444',
        fontSize: 14,
        fontWeight: '600',
    },
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: '#111',
        borderRadius: 16,
        padding: 4,
        width: '90%'
    },
    tab: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 12,
    },
    activeTab: {
        backgroundColor: '#222',
    },
    tabText: {
        color: '#666',
        fontSize: 14,
        fontWeight: '600',
    },
    activeTabText: {
        color: '#fff',
    },
    grid: {
        padding: 20,
        gap: 20,
    },
    mixCard: {
        backgroundColor: '#111',
        borderRadius: 16,
        overflow: 'hidden',
        height: 200,
    },
    mixImage: {
        width: '100%',
        height: '100%',
    },
    mixOverlay: {
        position: 'absolute',
        top: 0, bottom: 0, left: 0, right: 0,
        padding: 15,
        justifyContent: 'space-between'
    },
    mixHeader: { flexDirection: 'row', justifyContent: 'flex-end' },
    badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
    badgeText: { color: 'white', fontSize: 10, fontWeight: 'bold' },
    mixTitle: { color: 'white', fontWeight: 'bold', fontSize: 18, marginBottom: 2 },
    mixDesc: { color: '#ccc', fontSize: 12 },

    emptyState: { alignItems: 'center', padding: 40, gap: 15 },
    emptyText: { color: '#666' },
    createBtn: { backgroundColor: '#A855F7', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20 },
    createBtnText: { color: 'white', fontWeight: 'bold' },

    // History
    statsDashboard: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 20,
    },
    dashCard: {
        flex: 1,
        backgroundColor: 'rgba(255,255,255,0.05)',
        padding: 12,
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 1,
    },
    dashValue: { fontSize: 20, fontWeight: 'bold', marginBottom: 2 },
    dashLabel: { color: '#888', fontSize: 10, fontWeight: 'bold' },
    historyRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#111',
        padding: 12,
        borderRadius: 12,
        marginBottom: 8,
    },
    historyTitle: { color: 'white', fontWeight: 'bold', fontSize: 14 },
    historyArtist: { color: '#888', fontSize: 12 },
    actionBadge: { marginLeft: 'auto', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },

    // Settings
    sectionTitle: { color: 'white', fontSize: 20, fontWeight: 'bold', marginBottom: 20 },
    label: { color: '#888', fontSize: 12, marginBottom: 8, fontWeight: 'bold', textTransform: 'uppercase' },
    input: {
        backgroundColor: '#111',
        borderWidth: 1,
        borderColor: '#333',
        color: 'white',
        borderRadius: 12,
        padding: 15,
        fontSize: 16,
    },
    aiButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(168, 85, 247, 0.1)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
    switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, backgroundColor: '#111', padding: 15, borderRadius: 12 },
    switchLabel: { color: 'white', fontWeight: 'bold', fontSize: 16, marginBottom: 2 },
    switchSub: { color: '#666', fontSize: 12 },
    saveButton: { backgroundColor: '#A855F7', padding: 18, borderRadius: 16, alignItems: 'center', marginTop: 20 },
    saveText: { color: 'white', fontWeight: 'bold', fontSize: 16 },

});
