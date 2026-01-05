
import { StyleSheet, Dimensions, ScrollView, TouchableOpacity } from 'react-native';
import { Text, View } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { Stack, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import FontAwesome from '@expo/vector-icons/FontAwesome';

const MOCK_MATCHES = [
    {
        id: '1',
        username: '@hb123',
        initial: 'h',
        matchPercent: 25,
        artists: ['Radiohead', 'Daft Punk'],
    },
    {
        id: '2',
        username: '@hb1223',
        initial: 'h',
        matchPercent: 25,
        artists: ['Daft Punk', 'Taylor Swift'],
    },
    {
        id: '3',
        username: '@we.sdnhs123',
        initial: 'w',
        matchPercent: 25,
        artists: ['Kanye West', 'Frank Ocean'],
    },
];

export default function MatchScreen() {
    const router = useRouter(); // Although not used for nav in this simple view
    const theme = Colors['dark'];

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ headerShown: true, title: 'Matches', headerStyle: { backgroundColor: 'black' }, headerTintColor: 'white' }} />
            {/* Global Background */}
            <LinearGradient
                colors={['#000000', '#0a0a0a']}
                style={StyleSheet.absoluteFill}
            />

            <ScrollView contentContainerStyle={styles.scrollContent}>

                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.title}>Vibe Match</Text>
                    <Text style={styles.subtitle}>
                        We analyzed your music taste. Here are the people who vibe on your frequency. 🌊
                    </Text>
                </View>

                {/* Grid of Matches */}
                {MOCK_MATCHES.map((match) => (
                    <View key={match.id} style={styles.card}>
                        <LinearGradient
                            colors={['#1a0b2e', '#111']} // Dark purple fade to black
                            style={StyleSheet.absoluteFill}
                        />

                        {/* Match Badge */}
                        <View style={styles.matchBadge}>
                            <Text style={styles.matchText}>{match.matchPercent}%</Text>
                            <Text style={styles.matchLabel}> MATCH</Text>
                        </View>

                        {/* Avatar */}
                        <View style={styles.avatarContainer}>
                            <View style={styles.avatar}>
                                <Text style={styles.avatarLetter}>{match.initial}</Text>
                            </View>
                        </View>

                        <Text style={styles.username}>{match.username}</Text>
                        <Text style={styles.bio}>No bio yet.</Text>

                        {/* Divider */}
                        <View style={styles.divider} />

                        <Text style={styles.sectionLabel}>YOU BOTH LIKE</Text>

                        <View style={styles.tagsRow}>
                            {match.artists.map((artist, idx) => (
                                <View key={idx} style={styles.artistTag}>
                                    <Text style={styles.artistText}>{artist}</Text>
                                </View>
                            ))}
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
        paddingTop: 40,
        paddingBottom: 100,
    },
    header: {
        alignItems: 'center',
        marginBottom: 40,
    },
    title: {
        fontSize: 36,
        fontWeight: 'bold',
        color: '#d946ef', // Pinkish purple
        marginBottom: 15,
        textAlign: 'center',
    },
    subtitle: {
        color: 'rgba(255,255,255,0.7)',
        textAlign: 'center',
        fontSize: 16,
        lineHeight: 22,
        maxWidth: 300,
    },
    card: {
        width: '100%',
        borderRadius: 20, // Rounded corners
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'white', // White border as seen in screenshot
        marginBottom: 20,
        padding: 20,
        alignItems: 'center',
        backgroundColor: '#151515',
    },
    matchBadge: {
        position: 'absolute',
        top: 15,
        right: 15,
        backgroundColor: 'black',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#333',
    },
    matchText: {
        color: '#4ade80', // Green
        fontWeight: 'bold',
        fontSize: 12,
    },
    matchLabel: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 10,
        fontWeight: '600',
    },
    avatarContainer: {
        marginTop: 20,
        marginBottom: 15,
    },
    avatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#A855F7', // Purple avatar bg
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarLetter: {
        color: 'white',
        fontSize: 32,
        fontWeight: 'bold',
    },
    username: {
        color: 'white',
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 5,
    },
    bio: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 14,
        marginBottom: 20,
    },
    divider: {
        width: '100%',
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.2)',
        marginBottom: 20,
    },
    sectionLabel: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 10,
        fontWeight: 'bold',
        letterSpacing: 1,
        marginBottom: 15,
    },
    tagsRow: {
        flexDirection: 'row',
        gap: 10,
        flexWrap: 'wrap',
        justifyContent: 'center',
    },
    artistTag: {
        backgroundColor: '#2e1065', // Dark purple
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
    },
    artistText: {
        color: '#A855F7',
        fontSize: 12,
        fontWeight: 'bold',
    },
});
