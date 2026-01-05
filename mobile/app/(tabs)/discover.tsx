
import { StyleSheet, Dimensions, Image, TouchableOpacity, ScrollView } from 'react-native';
import { Text, View } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { LinearGradient } from 'expo-linear-gradient';
import FontAwesome from '@expo/vector-icons/FontAwesome';

const { width } = Dimensions.get('window');

const MOCK_VIBES = [
    {
        id: '1',
        title: 'Whisker Waves',
        author: '@hardik.bhanot1',
        date: '04/01/2026',
        description: 'A curated mix of electronic, indie, and hip-hop tracks to fuel your coding sessions with...',
        tracks: 13,
        type: 'Mix',
        image: 'https://i.pinimg.com/736x/87/14/55/8714556a52021ba3a55c8e7a833a988d.jpg',
    },
    {
        id: '2',
        title: 'Washroom Serenity',
        author: '@hardikbhanot12',
        date: '11/12/2025',
        description: 'A soothing blend of relaxing melodies and uplifting rhythms to accompany your washroom...',
        tracks: 13,
        type: 'Mix',
        image: 'https://i.pinimg.com/736x/e4/c4/2b/e4c42b93cc521d966d482613ebdc0436.jpg',
    },
    {
        id: '3',
        title: 'Code & Chill',
        author: '@hardik.bhanot1',
        date: '10/12/2025',
        description: 'A curated mix of electronic, indie, and Latin tracks to keep you focused and relaxed during...',
        tracks: 15,
        type: 'Mix',
        image: 'https://i.pinimg.com/736x/21/09/21/210921a97d812678003f56d95393160a.jpg',
    },
];

export default function DiscoverScreen() {
    const colorScheme = useColorScheme();
    const theme = Colors['dark'];

    return (
        <View style={styles.container}>
            {/* Global Background */}
            <LinearGradient
                colors={['#000000', '#0a0a0a']}
                style={StyleSheet.absoluteFill}
            />

            <ScrollView contentContainerStyle={styles.scrollContent}>

                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.title}>Community Vibes</Text>
                    <Text style={styles.subtitle}>
                        Explore mixes curated by the VibeMixer community. Listen, get inspired, and vibe along.
                    </Text>
                </View>

                {/* Grid */}
                {MOCK_VIBES.map((vibe) => (
                    <View key={vibe.id} style={styles.card}>
                        <Image source={{ uri: vibe.image }} style={styles.cardImage} />

                        {/* Overlay Badge */}
                        <View style={styles.authorBadge}>
                            <View style={styles.avatarPlaceholder}>
                                <Text style={styles.avatarText}>{vibe.author[1].toUpperCase()}</Text>
                            </View>
                            <Text style={styles.authorText}>{vibe.author}</Text>
                        </View>

                        <View style={styles.cardContent}>
                            <View style={styles.cardHeader}>
                                <Text style={styles.cardTitle}>{vibe.title}</Text>
                                <View style={styles.dateBadge}>
                                    <Text style={styles.dateText}>{vibe.date}</Text>
                                </View>
                            </View>

                            <Text style={styles.description}>{vibe.description}</Text>

                            <View style={styles.cardFooter}>
                                <View style={styles.tag}>
                                    <Text style={styles.tagText}>{vibe.tracks} Tracks</Text>
                                </View>
                                <Text style={[styles.tagText, { marginLeft: 10 }]}>{vibe.type}</Text>
                            </View>
                        </View>
                    </View>
                ))}

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
