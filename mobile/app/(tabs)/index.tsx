
import { StyleSheet, Dimensions, TouchableOpacity, ScrollView } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInUp, FadeInDown } from 'react-native-reanimated';
import { Text, View } from '@/components/Themed';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

const { width } = Dimensions.get('window');

const STATS = [
  { value: '12k+', label: 'Vibes Generated' },
  { value: '850+', label: 'Active Users' },
  { value: '2.5M', label: 'Songs Curated' },
  { value: '1.2s', label: 'Avg. Response' },
];

const FEATURES = [
  {
    icon: 'music',
    title: 'AI Curation',
    description: "Describe a scenario like 'Late night drive in Tokyo' and get a perfectly sequenced playlist.",
    link: '/generate'
  },
  {
    icon: 'heart',
    title: 'Tinder for Music',
    description: "Swipe right on tracks you love to train your personal AI recommendation engine.",
    link: '/swipe'
  },
  {
    icon: 'map-marker',
    title: 'Indian Vibe Map',
    description: "Interactive musical map of India. Discover regional hits from Punjab to Kerala.",
    link: '/discover'
  },
  {
    icon: 'users',
    title: 'Community Feed',
    description: "See what others are listening to. Save their vibes or remix them for yourself.",
    link: '/discover'
  },
  {
    icon: 'comment',
    title: 'Social Messaging',
    description: "Connect with other curators. Chat about music, exchange tracks, and vibe together.",
    link: '/messages'
  },
  {
    icon: 'refresh',
    title: 'Dual Sync',
    description: "We integrate with both Spotify and YouTube, so you can listen wherever you want.",
    link: '/profile'
  }
];

export default function HomeScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = Colors['dark'];

  return (
    <View style={styles.container}>
      {/* Global Background */}
      <LinearGradient
        colors={['#000000', '#11052C', '#1E0B36']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <ScrollView contentContainerStyle={{ paddingBottom: 50 }} showsVerticalScrollIndicator={false}>

        {/* NAVBAR */}
        <View style={styles.navbar}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <FontAwesome name="music" size={20} color={theme.tint} style={{ marginRight: 8 }} />
            <Text style={styles.logoText}>VibeMixer</Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/profile')}>
            <FontAwesome name="user-circle" size={24} color="#ccc" />
          </TouchableOpacity>
        </View>

        {/* HERO SECTION */}
        <View style={styles.heroContent}>
          <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.tagContainer}>
            <LinearGradient
              colors={['rgba(139, 92, 246, 0.2)', 'rgba(59, 130, 246, 0.2)']}
              style={styles.tagGradient}
            >
              <FontAwesome name="magic" size={12} color={theme.tint} style={{ marginRight: 6 }} />
              <Text style={[styles.tagText, { color: theme.tint }]}>2.0 Now Live</Text>
            </LinearGradient>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(200).springify()}>
            <Text style={styles.heroTitle}>Your Mood.</Text>
            <Text style={[styles.heroTitle, { color: theme.tint }]}>Your Vibe.</Text>
            <Text style={styles.heroTitle}>Instantly.</Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(300).springify()}>
            <Text style={styles.heroSubtitle}>
              Stop scrolling and start vibing. Describe your moment—VibeMixer uses AI to curate the perfect playlist.
            </Text>
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(500).springify()} style={styles.buttonRow}>
            <TouchableOpacity onPress={() => router.push('/generate')} activeOpacity={0.8}>
              <LinearGradient
                colors={[theme.tint, '#A78BFA']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.primaryButton}
              >
                <FontAwesome name="bolt" size={18} color="white" style={{ marginRight: 8 }} />
                <Text style={styles.primaryButtonText}>Generate Vibe</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.push('/discover')} activeOpacity={0.7} style={styles.secondaryButton}>
              <Text style={styles.secondaryButtonText}>Explore Feed</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>

        {/* STATS SECTION */}
        <View style={styles.statsContainer}>
          {STATS.map((stat, index) => (
            <View key={index} style={styles.statItem}>
              <Text style={[styles.statValue, { color: theme.tint }]}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* FEATURES SECTION */}
        <View style={styles.featuresSection}>
          <Text style={styles.sectionHeader}>More than just a playlist generator.</Text>
          <Text style={styles.sectionSubHeader}>A complete ecosystem for music discovery and community.</Text>

          <View style={styles.grid}>
            {FEATURES.map((feature, index) => (
              <TouchableOpacity
                key={index}
                style={styles.featureCard}
                onPress={() => router.push(feature.link as any)}
                activeOpacity={0.9}
              >
                <View style={[styles.iconBox, { backgroundColor: 'rgba(139, 92, 246, 0.1)' }]}>
                  <FontAwesome name={feature.icon as any} size={20} color={theme.tint} />
                </View>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureDesc}>{feature.description}</Text>
                <View style={styles.linkRow}>
                  <Text style={[styles.linkText, { color: theme.tint }]}>Try it out</Text>
                  <FontAwesome name="arrow-right" size={12} color={theme.tint} style={{ marginLeft: 5 }} />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* FOOTER */}
        <View style={{ alignItems: 'center', marginTop: 40, opacity: 0.5 }}>
          <FontAwesome name="music" size={24} color="white" style={{ marginBottom: 10 }} />
          <Text style={{ color: 'white', fontWeight: 'bold' }}>VibeMixer Mobile</Text>
          <Text style={{ color: 'white', fontSize: 12 }}>© 2026 VibeMixer. All rights reserved.</Text>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  navbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    marginBottom: 20,
  },
  logoText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    letterSpacing: 0.5,
  },
  heroContent: {
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 50,
  },
  tagContainer: {
    marginBottom: 25,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
  },
  tagGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  tagText: {
    fontSize: 14,
    fontWeight: '600',
  },
  heroTitle: {
    fontSize: 42,
    fontWeight: '900',
    color: 'white',
    textAlign: 'center',
    lineHeight: 46,
    letterSpacing: -1,
  },
  heroSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    marginTop: 20,
    maxWidth: 300,
    lineHeight: 24,
  },
  buttonRow: {
    flexDirection: 'row',
    marginTop: 30,
    gap: 15,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 30,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  secondaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 30,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  featuresSection: {
    padding: 20,
    marginTop: 20,
  },
  sectionHeader: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 10,
  },
  sectionSubHeader: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    marginBottom: 30,
  },
  grid: {
    gap: 15,
  },
  featureCard: {
    backgroundColor: '#111', // Very dark card
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  featureTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  featureDesc: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 15,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  linkText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
