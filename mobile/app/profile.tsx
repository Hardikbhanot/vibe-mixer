
import { StyleSheet, Dimensions, ScrollView, TouchableOpacity, Image, TextInput, Switch, FlatList } from 'react-native';
import { Text, View } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useAuth } from '@/context/AuthContext';
import { Stack, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useState } from 'react';

// MOCK DATA
const MY_MIXES = [
    { id: '1', title: 'Whisker Waves', date: '04/01/2026', image: 'https://i.pinimg.com/736x/87/14/55/8714556a52021ba3a55c8e7a833a988d.jpg' },
    { id: '2', title: 'CodeWave', date: '03/01/2026', image: 'https://i.pinimg.com/736x/21/09/21/210921a97d812678003f56d95393160a.jpg' },
    { id: '3', title: 'Rainy Day Reveries', date: '10/12/2025', image: 'https://i.pinimg.com/736x/e4/c4/2b/e4c42b93cc521d966d482613ebdc0436.jpg' },
];

const SWIPE_HISTORY = [
    { id: '1', title: 'Ishq Naya Sa', artist: 'Ami Mishra', action: 'LIKE' },
    { id: '2', title: 'Waiting', artist: 'leverfall', action: 'LIKE' },
    { id: '3', title: 'Good Luck, Babe!', artist: 'Chappell Roan', action: 'DISLIKE' },
];

export default function ProfileScreen() {
    const { user, logout } = useAuth();
    const theme = Colors['dark'];
    const [activeTab, setActiveTab] = useState<'mixes' | 'history' | 'settings'>('mixes');

    // Settings State
    const [username, setUsername] = useState('hardik.bhanot1');
    const [bio, setBio] = useState('The developer');
    const [isPublic, setIsPublic] = useState(true);
    const [isVibeMatch, setIsVibeMatch] = useState(true);

    const renderHeader = () => (
        <View style={styles.header}>
            <View style={styles.avatarContainer}>
                <View style={styles.avatar}>
                    <Text style={styles.avatarText}>H</Text>
                </View>
            </View>
            <Text style={styles.name}>{user?.email || 'hardik.bhanot1@gmail.com'}</Text>
            <Text style={styles.role}>Vibe Curator</Text>

            <View style={styles.statsRow}>
                <View style={styles.stat}>
                    <Text style={styles.statValue}>4</Text>
                    <Text style={styles.statLabel}>MIXES</Text>
                </View>
                <View style={styles.stat}>
                    <Text style={styles.statValue}>41</Text>
                    <Text style={styles.statLabel}>SWIPES</Text>
                </View>
            </View>

            <TouchableOpacity onPress={logout}>
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
                    <Text style={[styles.tabText, activeTab === 'history' && styles.activeTabText]}>Swipe History</Text>
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
            {MY_MIXES.map(mix => (
                <View key={mix.id} style={styles.mixCard}>
                    <Image source={{ uri: mix.image }} style={styles.mixImage} />
                    <View style={styles.mixOverlay}>
                        <View style={styles.dateBadge}><Text style={styles.dateText}>{mix.date}</Text></View>
                        <TouchableOpacity style={styles.editBtn}>
                            <FontAwesome name="pencil" size={12} color="white" />
                        </TouchableOpacity>
                    </View>
                    <View style={styles.mixInfo}>
                        <Text style={styles.mixTitle}>{mix.title}</Text>
                        <Text style={styles.mixDesc} numberOfLines={2}>A curated mix of tracks...</Text>
                    </View>
                </View>
            ))}
        </View>
    );

    const renderHistory = () => (
        <View style={{ padding: 20 }}>
            <View style={styles.statsDashboard}>
                <View style={styles.dashCard}>
                    <Text style={[styles.dashValue, { color: '#4ade80' }]}>10</Text>
                    <Text style={styles.dashLabel}>LIKES</Text>
                </View>
                <View style={styles.dashCard}>
                    <Text style={[styles.dashValue, { color: '#60a5fa' }]}>0</Text>
                    <Text style={styles.dashLabel}>SUPERLIKES</Text>
                </View>
                <View style={styles.dashCard}>
                    <Text style={[styles.dashValue, { color: '#f87171' }]}>31</Text>
                    <Text style={styles.dashLabel}>DISLIKES</Text>
                </View>
            </View>

            {SWIPE_HISTORY.map(item => (
                <View key={item.id} style={styles.historyRow}>
                    <View>
                        <Text style={styles.historyTitle}>{item.title}</Text>
                        <Text style={styles.historyArtist}>{item.artist}</Text>
                    </View>
                    {item.action === 'LIKE' ? (
                        <View style={[styles.actionBadge, { backgroundColor: 'rgba(74, 222, 128, 0.1)' }]}>
                            <Text style={{ color: '#4ade80', fontSize: 10, fontWeight: 'bold' }}>LIKE</Text>
                        </View>
                    ) : (
                        <View style={[styles.actionBadge, { backgroundColor: 'rgba(248, 113, 113, 0.1)' }]}>
                            <Text style={{ color: '#f87171', fontSize: 10, fontWeight: 'bold' }}>DISLIKE</Text>
                        </View>
                    )}
                    <TouchableOpacity><FontAwesome name="close" size={14} color="#666" style={{ marginLeft: 10 }} /></TouchableOpacity>
                </View>
            ))}
        </View>
    );

    const renderSettings = () => (
        <View style={{ padding: 20 }}>
            <Text style={styles.sectionTitle}>Profile Settings</Text>

            <Text style={styles.label}>Username (Unique)</Text>
            <TextInput style={styles.input} value={username} onChangeText={setUsername} />

            <View style={{ marginVertical: 20 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
                    <Text style={styles.label}>Bio</Text>
                    <TouchableOpacity style={styles.aiButton}>
                        <FontAwesome name="magic" size={12} color="#A855F7" style={{ marginRight: 5 }} />
                        <Text style={{ color: '#A855F7', fontSize: 12, fontWeight: 'bold' }}>AI Vibe Check</Text>
                    </TouchableOpacity>
                </View>
                <TextInput
                    style={[styles.input, { height: 80 }]}
                    value={bio}
                    onChangeText={setBio}
                    multiline
                />
                <Text style={styles.helper}>Click "AI Vibe Check" to generate a bio based on your stats.</Text>
            </View>

            <View style={styles.switchRow}>
                <View style={{ width: '80%' }}>
                    <Text style={styles.switchLabel}>Public Profile</Text>
                    <Text style={styles.switchSub}>Allow others to see your mixes.</Text>
                </View>
                <Switch value={isPublic} onValueChange={setIsPublic} trackColor={{ true: '#A855F7', false: '#333' }} />
            </View>

            <View style={styles.switchRow}>
                <View style={{ width: '80%' }}>
                    <Text style={styles.switchLabel}>Vibe Match</Text>
                    <Text style={styles.switchSub}>Allow others to match with you.</Text>
                </View>
                <Switch value={isVibeMatch} onValueChange={setIsVibeMatch} trackColor={{ true: '#A855F7', false: '#333' }} />
            </View>

            <TouchableOpacity style={styles.saveButton}>
                <Text style={styles.saveText}>Save Changes</Text>
            </TouchableOpacity>

        </View>
    );

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />
            <LinearGradient colors={['#000000', '#050505']} style={StyleSheet.absoluteFill} />

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
        backgroundColor: 'black', // Opaque for sticky
        alignItems: 'center',
        paddingTop: 60,
        paddingBottom: 20,
    },
    avatarContainer: {
        marginBottom: 15,
    },
    avatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#1a1a2e',
        borderWidth: 1,
        borderColor: '#A855F7',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        fontSize: 32,
        fontWeight: 'bold',
        color: 'white',
    },
    name: {
        fontSize: 20,
        fontWeight: 'bold',
        color: 'white',
        marginBottom: 5,
    },
    role: {
        color: '#888',
        fontSize: 14,
        marginBottom: 20,
    },
    statsRow: {
        flexDirection: 'row',
        gap: 40,
        marginBottom: 20,
    },
    stat: {
        alignItems: 'center',
    },
    statValue: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
    statLabel: {
        color: '#666',
        fontSize: 10,
        fontWeight: 'bold',
        marginTop: 5,
    },
    signOut: {
        color: '#ef4444',
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 20,
    },
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: '#111',
        borderRadius: 12,
        padding: 4,
    },
    tab: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 8,
    },
    activeTab: {
        backgroundColor: '#222',
    },
    tabText: {
        color: '#888',
        fontSize: 14,
        fontWeight: '600',
    },
    activeTabText: {
        color: '#A855F7',
    },
    grid: {
        padding: 20,
        gap: 20,
    },
    mixCard: {
        backgroundColor: '#111',
        borderRadius: 12,
        overflow: 'hidden',
    },
    mixImage: {
        width: '100%',
        height: 200,
    },
    mixOverlay: {
        position: 'absolute',
        top: 10,
        left: 10,
        right: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    dateBadge: {
        backgroundColor: 'rgba(0,0,0,0.6)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    dateText: { color: 'white', fontSize: 10 },
    editBtn: {
        width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center', alignItems: 'center',
    },
    mixInfo: {
        padding: 15,
    },
    mixTitle: { color: 'white', fontWeight: 'bold', fontSize: 16, marginBottom: 5 },
    mixDesc: { color: '#888', fontSize: 12 },

    // History
    statsDashboard: {
        flexDirection: 'row',
        gap: 15,
        marginBottom: 30,
    },
    dashCard: {
        flex: 1,
        backgroundColor: '#111',
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#222',
    },
    dashValue: { fontSize: 24, fontWeight: 'bold', marginBottom: 5 },
    dashLabel: { color: '#666', fontSize: 10, fontWeight: 'bold' },
    historyRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#111',
        padding: 15,
        borderRadius: 10,
        marginBottom: 10,
    },
    historyTitle: { color: 'white', fontWeight: 'bold', fontSize: 14 },
    historyArtist: { color: '#888', fontSize: 12 },
    actionBadge: { marginLeft: 'auto', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },

    // Settings
    sectionTitle: { color: 'white', fontSize: 18, fontWeight: 'bold', marginBottom: 20 },
    label: { color: '#ccc', fontSize: 14, marginBottom: 10 },
    input: {
        backgroundColor: '#0a0a0a',
        borderWidth: 1,
        borderColor: '#333',
        color: 'white',
        borderRadius: 8,
        padding: 12,
        fontSize: 14,
    },
    aiButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(168, 85, 247, 0.1)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    helper: { color: '#666', fontSize: 12, marginTop: 8 },
    switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    switchLabel: { color: 'white', fontWeight: 'bold', fontSize: 14 },
    switchSub: { color: '#666', fontSize: 12 },
    saveButton: { backgroundColor: '#A855F7', padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 10 },
    saveText: { color: 'white', fontWeight: 'bold', fontSize: 16 },

});
