
import { StyleSheet, Dimensions, Image, TouchableOpacity, ScrollView, FlatList } from 'react-native';
import { Text, View } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { Stack } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useState } from 'react';

const STATES = [
    { id: 'UP', name: 'Uttar Pradesh', color: '#ef4444' },
    { id: 'PB', name: 'Punjab', color: '#f59e0b' },
    { id: 'RJ', name: 'Rajasthan', color: '#eab308' },
    { id: 'KL', name: 'Kerala', color: '#10b981' },
    { id: 'WB', name: 'West Bengal', color: '#3b82f6' },
];

const MOCK_PLAYLIST = [
    { id: '1', title: 'Uttar Pradesh Folk Song "Saari..."', artist: 'Indian Desi Folk', image: 'https://i.ytimg.com/vi/abc/hqdefault.jpg' }, // Mock placeholders
    { id: '2', title: 'Saiyan Mile Larkaiya | MALINI AWASTHI', artist: 'Saibaba Studios', image: 'https://i.ytimg.com/vi/def/hqdefault.jpg' },
    { id: '3', title: 'Indian folk dances 🇮🇳', artist: 'Ed People', image: 'https://i.ytimg.com/vi/ghi/hqdefault.jpg' },
    { id: '4', title: 'Folk Melodies of Eastern Uttar Pradesh', artist: 'Anahad Foundation', image: 'https://i.ytimg.com/vi/jkl/hqdefault.jpg' },
    { id: '5', title: 'Banni Jhule Palna', artist: 'Guru Ashwani Nigam', image: 'https://i.ytimg.com/vi/mno/hqdefault.jpg' },
];

export default function IndiaMapScreen() {
    const [selectedState, setSelectedState] = useState(STATES[0]);

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ headerShown: true, title: 'Indian Vibe Map', headerStyle: { backgroundColor: 'black' }, headerTintColor: 'white' }} />

            {/* Global Background */}
            <LinearGradient colors={['#000000', '#111']} style={StyleSheet.absoluteFill} />

            <View style={{ flex: 1, flexDirection: 'column' }}>

                {/* Search Bar */}
                <View style={styles.searchContainer}>
                    <FontAwesome name="search" size={14} color="#666" style={{ marginRight: 10 }} />
                    <Text style={{ color: '#666' }}>Search your state...</Text>
                </View>

                {/* Map Placeholder / State List */}
                {/* On Mobile, a list of pills is better than a tiny map */}
                <View style={{ height: 60 }}>
                    <FlatList
                        data={STATES}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={{ paddingHorizontal: 15, alignItems: 'center' }}
                        keyExtractor={item => item.id}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                style={[styles.statePill, selectedState.id === item.id && { backgroundColor: '#333', borderColor: 'white' }]}
                                onPress={() => setSelectedState(item)}
                            >
                                <View style={[styles.dot, { backgroundColor: item.color }]} />
                                <Text style={{ color: 'white', fontWeight: '600' }}>{item.name}</Text>
                            </TouchableOpacity>
                        )}
                    />
                </View>

                {/* Playlist Panel */}
                <View style={styles.panel}>
                    <View style={styles.panelHeader}>
                        <Text style={styles.panelTitle}>{selectedState.name} Vibes</Text>
                        <TouchableOpacity style={styles.saveButton}>
                            <Text style={styles.saveButtonText}>Save Playlist</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Featured Video Mock */}
                    <View style={styles.videoPlayer}>
                        <Image source={{ uri: 'https://i.ytimg.com/vi/7v-v8dMphrw/maxresdefault.jpg' }} style={styles.videoThumbnail} />
                        <View style={styles.playOverlay}>
                            <FontAwesome name="play-circle" size={48} color="white" />
                        </View>
                        <View style={styles.videoInfo}>
                            <Text style={styles.videoTitle}>Uttar Pradesh Folk Song "Saari..."</Text>
                            <Text style={styles.videoArtist}>Kishor Kumar Mishra • Ragini Sarna</Text>
                        </View>
                    </View>

                    {/* Song List */}
                    <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
                        {MOCK_PLAYLIST.map((song, idx) => (
                            <TouchableOpacity key={idx} style={styles.songRow}>
                                <Image source={{ uri: 'https://img.youtube.com/vi/7v-v8dMphrw/default.jpg' }} style={styles.songThumb} />
                                <View style={{ flex: 1, justifyContent: 'center' }}>
                                    <Text style={styles.songTitle} numberOfLines={1}>{song.title}</Text>
                                    <Text style={styles.songArtist}>{song.artist}</Text>
                                </View>
                                <FontAwesome name="ellipsis-v" size={14} color="#666" />
                            </TouchableOpacity>
                        ))}
                    </ScrollView>


                </View>

            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'black',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#111',
        margin: 15,
        padding: 12,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#333',
    },
    statePill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#111',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        marginRight: 10,
        borderWidth: 1,
        borderColor: '#333',
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 8,
    },
    panel: {
        flex: 1,
        backgroundColor: '#111',
        margin: 10,
        borderRadius: 15,
        borderWidth: 1,
        borderColor: '#222',
        padding: 15,
    },
    panelHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    panelTitle: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
    saveButton: {
        backgroundColor: '#ef4444',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    saveButtonText: {
        color: 'white',
        fontSize: 12,
        fontWeight: 'bold',
    },
    videoPlayer: {
        width: '100%',
        height: 200,
        backgroundColor: 'black',
        borderRadius: 10,
        overflow: 'hidden',
        marginBottom: 15,
        justifyContent: 'center',
        alignItems: 'center',
    },
    videoThumbnail: {
        width: '100%',
        height: '100%',
        opacity: 0.8,
    },
    playOverlay: {
        position: 'absolute',
        justifyContent: 'center',
        alignItems: 'center',
    },
    videoInfo: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        width: '100%',
        padding: 10,
        backgroundColor: 'rgba(0,0,0,0.6)',
    },
    videoTitle: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 14,
    },
    videoArtist: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 12,
    },
    songRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
        backgroundColor: 'rgba(255,255,255,0.03)',
        padding: 8,
        borderRadius: 8,
    },
    songThumb: {
        width: 50,
        height: 35,
        borderRadius: 4,
        marginRight: 10,
        backgroundColor: '#333',
    },
    songTitle: {
        color: '#A78BFA',
        fontSize: 13,
        fontWeight: '600',
        marginBottom: 2,
    },
    songArtist: {
        color: '#888',
        fontSize: 11,
    }
});
