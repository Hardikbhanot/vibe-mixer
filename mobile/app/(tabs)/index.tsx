import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ScrollView,
  Image,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeInDown,
  FadeInRight,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { Text, View } from '@/components/Themed';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/constants/api';

const { width } = Dimensions.get('window');

// Curated Vibe Collections (App Content)
const SPOTLIGHT_VIBES = [
  {
    id: 'tokyo',
    tag: '🌆 Tokyo Midnight',
    title: 'Neon Expressway',
    subtitle: 'Kavinsky • The Midnight • Gunship',
    genre: 'Synthwave & Retrowave',
    bpm: 128,
    energy: '89%',
    valence: 'Euphoric',
    matchScore: '99.4%',
    cover:
      'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=500&h=500&fit=crop',
    gradient: ['#7C3AED', '#06B6D4'] as const,
    tracks: [
      {
        id: 'tokyo_1',
        name: 'Nightcall',
        artist: 'Kavinsky',
        artists: [{ name: 'Kavinsky' }],
        album: {
          name: 'OutRun',
          images: [
            {
              url: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=500&h=500&fit=crop',
            },
          ],
        },
        duration_ms: 259000,
        uri: 'spotify:search:Nightcall Kavinsky',
        external_urls: {
          spotify: 'https://open.spotify.com/search/Nightcall%20Kavinsky',
          youtube: 'https://www.youtube.com/results?search_query=Nightcall+Kavinsky',
        },
        ai_reason: 'Cinematic synth bassline with vocoder harmonies.',
        confidence_score: 99,
        match_type: 'RAG Vector Match',
      },
      {
        id: 'tokyo_2',
        name: 'Sunset',
        artist: 'The Midnight',
        artists: [{ name: 'The Midnight' }],
        album: {
          name: 'Endless Summer',
          images: [
            {
              url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=500&h=500&fit=crop',
            },
          ],
        },
        duration_ms: 326000,
        uri: 'spotify:search:Sunset The Midnight',
        external_urls: {
          spotify: 'https://open.spotify.com/search/Sunset%20The%20Midnight',
          youtube: 'https://www.youtube.com/results?search_query=Sunset+The+Midnight',
        },
        ai_reason: 'Euphoric saxophone solos over 80s analog synth arpeggios.',
        confidence_score: 98,
        match_type: 'Harmonic Cohesion',
      },
      {
        id: 'tokyo_3',
        name: 'Tech Noir',
        artist: 'Gunship',
        artists: [{ name: 'Gunship' }],
        album: {
          name: 'GUNSHIP',
          images: [
            {
              url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500&h=500&fit=crop',
            },
          ],
        },
        duration_ms: 297000,
        uri: 'spotify:search:Tech Noir Gunship',
        external_urls: {
          spotify: 'https://open.spotify.com/search/Tech%20Noir%20Gunship',
          youtube: 'https://www.youtube.com/results?search_query=Tech+Noir+Gunship',
        },
        ai_reason: 'Cyberpunk noir atmosphere with driving bass.',
        confidence_score: 97,
        match_type: 'RAG Vector Match',
      },
    ],
  },
  {
    id: 'lofi',
    tag: '☕ Rainy Sunday',
    title: 'Kyoto Petrichor',
    subtitle: 'idealism • WYS • Jinsang',
    genre: 'Cozy Lo-Fi Chillhop',
    bpm: 78,
    energy: '32%',
    valence: 'Peaceful',
    matchScore: '98.7%',
    cover:
      'https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=500&h=500&fit=crop',
    gradient: ['#D97706', '#E11D48'] as const,
    tracks: [
      {
        id: 'lofi_1',
        name: 'nagashi',
        artist: 'idealism',
        artists: [{ name: 'idealism' }],
        album: {
          name: 'rainy day memories',
          images: [
            {
              url: 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=500&h=500&fit=crop',
            },
          ],
        },
        duration_ms: 165000,
        uri: 'spotify:search:nagashi idealism',
        external_urls: {
          spotify: 'https://open.spotify.com/search/nagashi%20idealism',
          youtube: 'https://www.youtube.com/results?search_query=nagashi+idealism',
        },
        ai_reason: 'Tender acoustic piano loops washed in tape flutter.',
        confidence_score: 99,
        match_type: 'RAG Vector Match',
      },
    ],
  },
  {
    id: 'cyberpunk',
    tag: '⚡ Phonk Workout',
    title: 'Overclocked Pulse',
    subtitle: 'Kordhell • DVRST • Pharmacist',
    genre: 'Drift Phonk & 808s',
    bpm: 142,
    energy: '98%',
    valence: 'Aggressive',
    matchScore: '99.8%',
    cover:
      'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=500&h=500&fit=crop',
    gradient: ['#8B5CF6', '#10B981'] as const,
    tracks: [
      {
        id: 'cyber_1',
        name: 'Murder In My Mind',
        artist: 'KORDHELL',
        artists: [{ name: 'KORDHELL' }],
        album: {
          name: 'Murder In My Mind',
          images: [
            {
              url: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=500&h=500&fit=crop',
            },
          ],
        },
        duration_ms: 145000,
        uri: 'spotify:search:Murder In My Mind KORDHELL',
        external_urls: {
          spotify: 'https://open.spotify.com/search/Murder%20In%20My%20Mind%20KORDHELL',
          youtube:
            'https://www.youtube.com/results?search_query=Murder+In+My+Mind+KORDHELL',
        },
        ai_reason: 'Distorted 808 cowbells and driving momentum.',
        confidence_score: 99,
        match_type: 'RAG Vector Match',
      },
    ],
  },
  {
    id: 'sunset',
    tag: '🌅 Sunset Groove',
    title: 'Balearic Horizon',
    subtitle: 'Keinemusik • Black Coffee',
    genre: 'Melodic Afro House',
    bpm: 122,
    energy: '74%',
    valence: 'Euphoric Warmth',
    matchScore: '97.9%',
    cover:
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=500&h=500&fit=crop',
    gradient: ['#EA580C', '#DB2777'] as const,
    tracks: [
      {
        id: 'sunset_1',
        name: 'Move',
        artist: 'Adam Port, Stryv, Malachiii',
        artists: [{ name: 'Adam Port' }, { name: 'Stryv' }],
        album: {
          name: 'Move',
          images: [
            {
              url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=500&h=500&fit=crop',
            },
          ],
        },
        duration_ms: 178000,
        uri: 'spotify:search:Move Adam Port Stryv',
        external_urls: {
          spotify: 'https://open.spotify.com/search/Move%20Adam%20Port',
          youtube: 'https://www.youtube.com/results?search_query=Move+Adam+Port',
        },
        ai_reason: 'Sun-drenched afro-house chords with uplifting percussion.',
        confidence_score: 99,
        match_type: 'RAG Vector Match',
      },
    ],
  },
];

const QUICK_MOODS = [
  { label: '⚡ High Energy', prompt: 'High energy electronic festival bangers with driving bass' },
  { label: '☕ Lo-Fi Study', prompt: 'Cozy rainy day lo-fi hip hop with warm jazz piano' },
  { label: '🌆 Night Drive', prompt: 'Late night synthwave highway cruise through Tokyo rain' },
  { label: '🏋️ Workout Phonk', prompt: 'Aggressive drift phonk workout with heavy 808 cowbells' },
  { label: '🌅 Sunset House', prompt: 'Warm melodic afro house sunset grooves on Ibiza beach' },
  { label: '🇮🇳 Desi Melodies', prompt: 'Soulful Punjabi indie acoustic and modern Hindi vibe' },
];

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [activeSpotlight, setActiveSpotlight] = useState(SPOTLIGHT_VIBES[0]);
  const [userMixes, setUserMixes] = useState<any[]>([]);

  // Rotating vinyl animation
  const vinylRotation = useSharedValue(0);
  useEffect(() => {
    vinylRotation.value = withRepeat(
      withTiming(360, { duration: 7000, easing: Easing.linear }),
      -1,
      false
    );
  }, []);

  const vinylStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${vinylRotation.value}deg` }],
  }));

  // Equalizer waveform animations
  const wave1 = useSharedValue(0.4);
  const wave2 = useSharedValue(0.8);
  const wave3 = useSharedValue(1.0);
  const wave4 = useSharedValue(0.5);

  useEffect(() => {
    wave1.value = withRepeat(withSequence(withTiming(0.9, { duration: 420 }), withTiming(0.3, { duration: 420 })), -1, true);
    wave2.value = withRepeat(withSequence(withTiming(0.3, { duration: 520 }), withTiming(1.0, { duration: 520 })), -1, true);
    wave3.value = withRepeat(withSequence(withTiming(0.6, { duration: 460 }), withTiming(1.0, { duration: 460 })), -1, true);
    wave4.value = withRepeat(withSequence(withTiming(1.0, { duration: 600 }), withTiming(0.4, { duration: 600 })), -1, true);
  }, []);

  const waveStyle1 = useAnimatedStyle(() => ({ height: `${wave1.value * 20}px` as any }));
  const waveStyle2 = useAnimatedStyle(() => ({ height: `${wave2.value * 20}px` as any }));
  const waveStyle3 = useAnimatedStyle(() => ({ height: `${wave3.value * 20}px` as any }));
  const waveStyle4 = useAnimatedStyle(() => ({ height: `${wave4.value * 20}px` as any }));

  // Load recent mixes if user is logged in
  useEffect(() => {
    if (user) {
      api.get('/api/playlists').then((res) => {
        if (Array.isArray(res)) {
          setUserMixes(res.slice(0, 5));
        }
      }).catch(() => {});
    }
  }, [user]);

  // Open playlist directly
  const openSpotlightMix = (vibe: typeof SPOTLIGHT_VIBES[0]) => {
    const payload = {
      playlist_name: `${vibe.title} • ${vibe.genre}`,
      description: `Curated ${vibe.genre} featuring ${vibe.subtitle}. Built by VibeMixer Neural DJ.`,
      coverImage: vibe.cover,
      tracks: vibe.tracks,
      total_duration_mins: Math.round(
        vibe.tracks.reduce((acc, t) => acc + t.duration_ms, 0) / 60000
      ),
    };
    router.push({
      pathname: '/generated-playlist',
      params: { data: JSON.stringify(payload) },
    });
  };

  const getTimeGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#070709', '#0D081F', '#070709']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* APP HEADER */}
        <View style={styles.appHeader}>
          <View style={styles.headerLeft}>
            <LinearGradient
              colors={['#8B5CF6', '#EC4899']}
              style={styles.logoIconCircle}
            >
              <FontAwesome name="music" size={15} color="white" />
            </LinearGradient>
            <View>
              <Text style={styles.greetingText}>{getTimeGreeting()}</Text>
              <Text style={styles.brandTitle}>VibeMixer</Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={() => router.push('/profile')}
            style={styles.avatarButton}
            activeOpacity={0.8}
          >
            <View style={styles.avatarBadge}>
              <Text style={styles.avatarInitial}>
                {user?.email ? user.email.charAt(0).toUpperCase() : 'V'}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* PROMPT SEARCH BAR (APP STYLE) */}
        <TouchableOpacity
          onPress={() => router.push('/generate')}
          activeOpacity={0.9}
          style={styles.searchBarContainer}
        >
          <View style={styles.searchBarInner}>
            <FontAwesome name="magic" size={16} color="#A855F7" style={{ marginRight: 10 }} />
            <Text style={styles.searchPlaceholder}>
              Describe any mood, scenario or activity...
            </Text>
            <View style={styles.aiTag}>
              <Text style={styles.aiTagText}>AI</Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* QUICK MOOD PILLS */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.moodPillsRow}
        >
          {QUICK_MOODS.map((item, idx) => (
            <TouchableOpacity
              key={idx}
              onPress={() => router.push('/generate')}
              activeOpacity={0.8}
              style={styles.moodPill}
            >
              <Text style={styles.moodPillText}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* FEATURED SPOTLIGHT MIX (NATIVE MUSIC CARD) */}
        <View style={styles.sectionBlock}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionTitleRow}>
              <View style={styles.liveIndicatorDot} />
              <Text style={styles.sectionTitle}>FEATURED VIBE</Text>
            </View>
            <View style={styles.ragBadge}>
              <Text style={styles.ragBadgeText}>{activeSpotlight.matchScore} RAG</Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={() => openSpotlightMix(activeSpotlight)}
            activeOpacity={0.92}
            style={styles.spotlightCard}
          >
            <LinearGradient
              colors={['rgba(255,255,255,0.07)', 'rgba(255,255,255,0.02)']}
              style={StyleSheet.absoluteFill}
            />

            <View style={styles.spotlightContent}>
              {/* Cover Art with Vinyl Peek */}
              <View style={styles.albumArtContainer}>
                {/* Rotating Vinyl Disc behind artwork */}
                <Animated.View style={[styles.vinylDisc, vinylStyle]}>
                  <View style={styles.vinylCenterLabel} />
                </Animated.View>
                {/* Front Album Artwork */}
                <Image source={{ uri: activeSpotlight.cover }} style={styles.albumImage} />
              </View>

              {/* Mix Details */}
              <View style={styles.spotlightDetails}>
                <View style={styles.genreTagPill}>
                  <Text style={styles.genreTagText}>{activeSpotlight.genre}</Text>
                </View>

                <Text style={styles.spotlightTitle} numberOfLines={1}>
                  {activeSpotlight.title}
                </Text>
                <Text style={styles.spotlightSubtitle} numberOfLines={1}>
                  {activeSpotlight.subtitle}
                </Text>

                {/* Telemetry Row with Waveform */}
                <View style={styles.spotlightMetaRow}>
                  <View style={styles.metaBadge}>
                    <Text style={styles.metaBadgeText}>{activeSpotlight.bpm} BPM</Text>
                  </View>
                  <View style={styles.metaBadge}>
                    <Text style={styles.metaBadgeText}>{activeSpotlight.valence}</Text>
                  </View>

                  {/* Mini Waveform */}
                  <View style={styles.waveformBars}>
                    <Animated.View style={[styles.waveBar, waveStyle1]} />
                    <Animated.View style={[styles.waveBar, waveStyle2]} />
                    <Animated.View style={[styles.waveBar, waveStyle3]} />
                    <Animated.View style={[styles.waveBar, waveStyle4]} />
                  </View>
                </View>
              </View>
            </View>

            {/* Bottom Play Action Bar */}
            <View style={styles.spotlightActionRow}>
              <View style={styles.playButtonPill}>
                <FontAwesome name="play" size={12} color="#000" style={{ marginRight: 6 }} />
                <Text style={styles.playButtonText}>Play Full Mix</Text>
              </View>

              <View style={styles.streamingBadges}>
                <Text style={styles.streamingSpotifyText}>● Spotify</Text>
                <Text style={styles.streamingYoutubeText}>● YouTube</Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* QUICK APP SHORTCUTS (2x2 GRID) */}
        <View style={styles.sectionBlock}>
          <Text style={styles.sectionTitle}>DISCOVERY SUITE</Text>
          <View style={styles.shortcutsGrid}>
            {/* Shortcut 1: Studio */}
            <TouchableOpacity
              onPress={() => router.push('/generate')}
              activeOpacity={0.85}
              style={styles.shortcutCard}
            >
              <View style={[styles.shortcutIconBox, { backgroundColor: 'rgba(139, 92, 246, 0.2)' }]}>
                <FontAwesome name="sliders" size={18} color="#C4B5FD" />
              </View>
              <Text style={styles.shortcutTitle}>Harmonic Studio</Text>
              <Text style={styles.shortcutSub}>Craft by Valence & BPM</Text>
            </TouchableOpacity>

            {/* Shortcut 2: Taste Deck */}
            <TouchableOpacity
              onPress={() => router.push('/swipe')}
              activeOpacity={0.85}
              style={styles.shortcutCard}
            >
              <View style={[styles.shortcutIconBox, { backgroundColor: 'rgba(244, 63, 94, 0.2)' }]}>
                <FontAwesome name="fire" size={18} color="#FB7185" />
              </View>
              <Text style={styles.shortcutTitle}>Taste Deck</Text>
              <Text style={styles.shortcutSub}>Swipe to train AI profile</Text>
            </TouchableOpacity>

            {/* Shortcut 3: Regional Radar */}
            <TouchableOpacity
              onPress={() => router.push('/map')}
              activeOpacity={0.85}
              style={styles.shortcutCard}
            >
              <View style={[styles.shortcutIconBox, { backgroundColor: 'rgba(16, 185, 129, 0.2)' }]}>
                <FontAwesome name="map-marker" size={18} color="#34D399" />
              </View>
              <Text style={styles.shortcutTitle}>India Radar</Text>
              <Text style={styles.shortcutSub}>State-by-state soundscapes</Text>
            </TouchableOpacity>

            {/* Shortcut 4: Community */}
            <TouchableOpacity
              onPress={() => router.push('/discover')}
              activeOpacity={0.85}
              style={styles.shortcutCard}
            >
              <View style={[styles.shortcutIconBox, { backgroundColor: 'rgba(6, 182, 212, 0.2)' }]}>
                <FontAwesome name="globe" size={18} color="#06B6D4" />
              </View>
              <Text style={styles.shortcutTitle}>Community</Text>
              <Text style={styles.shortcutSub}>Trending public vibes</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* CURATED SOUNDSCAPES CAROUSEL */}
        <View style={styles.sectionBlock}>
          <Text style={styles.sectionTitle}>CURATED SOUNDSCAPES</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.carouselContainer}
          >
            {SPOTLIGHT_VIBES.map((vibe) => (
              <TouchableOpacity
                key={vibe.id}
                onPress={() => {
                  setActiveSpotlight(vibe);
                  openSpotlightMix(vibe);
                }}
                activeOpacity={0.85}
                style={styles.carouselCard}
              >
                <Image source={{ uri: vibe.cover }} style={styles.carouselImage} />
                <LinearGradient
                  colors={['transparent', 'rgba(0,0,0,0.85)']}
                  style={styles.carouselOverlay}
                >
                  <Text style={styles.carouselTag}>{vibe.tag}</Text>
                  <Text style={styles.carouselTitle} numberOfLines={1}>
                    {vibe.title}
                  </Text>
                  <Text style={styles.carouselSub} numberOfLines={1}>
                    {vibe.genre}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* USER SAVED MIXES (OR GET STARTED CARD) */}
        {userMixes.length > 0 ? (
          <View style={styles.sectionBlock}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>YOUR RECENT MIXES</Text>
              <TouchableOpacity onPress={() => router.push('/profile')}>
                <Text style={styles.seeAllText}>See all</Text>
              </TouchableOpacity>
            </View>
            {userMixes.map((mix) => (
              <TouchableOpacity
                key={mix.id}
                onPress={() => router.push('/profile')}
                activeOpacity={0.8}
                style={styles.recentMixRow}
              >
                <Image
                  source={{ uri: mix.coverImage || 'https://via.placeholder.com/100' }}
                  style={styles.recentMixImage}
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.recentMixTitle} numberOfLines={1}>{mix.name}</Text>
                  <Text style={styles.recentMixDesc} numberOfLines={1}>{mix.description || 'Custom mix'}</Text>
                </View>
                <FontAwesome name="angle-right" size={18} color="#71717A" />
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <TouchableOpacity
            onPress={() => router.push('/generate')}
            activeOpacity={0.9}
            style={styles.getStartedBanner}
          >
            <LinearGradient
              colors={['rgba(139, 92, 246, 0.2)', 'rgba(6, 182, 212, 0.1)']}
              style={StyleSheet.absoluteFill}
            />
            <View style={{ flex: 1 }}>
              <Text style={styles.bannerTitle}>Craft Your First Vibe</Text>
              <Text style={styles.bannerSub}>Describe a moment or upload a photo to start.</Text>
            </View>
            <View style={styles.bannerBtn}>
              <FontAwesome name="arrow-right" size={14} color="#FFFFFF" />
            </View>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#070709',
  },
  scrollContent: {
    paddingTop: 50,
    paddingBottom: 40,
  },
  appHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  greetingText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#A1A1AA',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  brandTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  avatarButton: {
    padding: 2,
  },
  avatarBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1E1B2E',
    borderWidth: 1.5,
    borderColor: '#A855F7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    color: '#C4B5FD',
    fontWeight: 'bold',
    fontSize: 15,
  },
  searchBarContainer: {
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  searchBarInner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchPlaceholder: {
    flex: 1,
    color: '#A1A1AA',
    fontSize: 13,
  },
  aiTag: {
    backgroundColor: 'rgba(139, 92, 246, 0.25)',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  aiTagText: {
    color: '#C4B5FD',
    fontSize: 10,
    fontWeight: 'bold',
  },
  moodPillsRow: {
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 24,
  },
  moodPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  moodPillText: {
    color: '#E4E4E7',
    fontSize: 12,
    fontWeight: '600',
  },
  sectionBlock: {
    marginBottom: 26,
    paddingHorizontal: 16,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  liveIndicatorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#A1A1AA',
    letterSpacing: 1,
    marginBottom: 10,
  },
  seeAllText: {
    fontSize: 12,
    color: '#A855F7',
    fontWeight: '600',
  },
  ragBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  ragBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#34D399',
    fontFamily: 'Courier',
  },
  spotlightCard: {
    backgroundColor: '#111019',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.09)',
    padding: 16,
    overflow: 'hidden',
  },
  spotlightContent: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'center',
    marginBottom: 14,
  },
  albumArtContainer: {
    width: 90,
    height: 90,
    position: 'relative',
    justifyContent: 'center',
  },
  vinylDisc: {
    position: 'absolute',
    right: -12,
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: '#000000',
    borderWidth: 1.5,
    borderColor: '#27272A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  vinylCenterLabel: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#7C3AED',
  },
  albumImage: {
    width: 80,
    height: 80,
    borderRadius: 14,
    zIndex: 2,
  },
  spotlightDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  genreTagPill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginBottom: 4,
  },
  genreTagText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#C4B5FD',
    textTransform: 'uppercase',
  },
  spotlightTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  spotlightSubtitle: {
    fontSize: 12,
    color: '#A1A1AA',
    marginBottom: 8,
  },
  spotlightMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  metaBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#E4E4E7',
  },
  waveformBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 3,
    height: 20,
    marginLeft: 4,
  },
  waveBar: {
    width: 3,
    backgroundColor: '#A855F7',
    borderRadius: 1.5,
  },
  spotlightActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
    paddingTop: 12,
  },
  playButtonPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  playButtonText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#000000',
  },
  streamingBadges: {
    flexDirection: 'row',
    gap: 10,
  },
  streamingSpotifyText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1DB954',
  },
  streamingYoutubeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#EF4444',
  },
  shortcutsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  shortcutCard: {
    width: (width - 42) / 2,
    backgroundColor: '#111019',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
    padding: 14,
  },
  shortcutIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  shortcutTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  shortcutSub: {
    fontSize: 11,
    color: '#71717A',
  },
  carouselContainer: {
    gap: 12,
  },
  carouselCard: {
    width: 140,
    height: 180,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#18181B',
  },
  carouselImage: {
    width: '100%',
    height: '100%',
  },
  carouselOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: 10,
  },
  carouselTag: {
    fontSize: 9,
    fontWeight: '700',
    color: '#C4B5FD',
    marginBottom: 2,
  },
  carouselTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  carouselSub: {
    fontSize: 10,
    color: '#A1A1AA',
  },
  recentMixRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111019',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    padding: 10,
    marginBottom: 8,
    gap: 12,
  },
  recentMixImage: {
    width: 44,
    height: 44,
    borderRadius: 10,
  },
  recentMixTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  recentMixDesc: {
    fontSize: 11,
    color: '#71717A',
    marginTop: 2,
  },
  getStartedBanner: {
    marginHorizontal: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
    backgroundColor: '#111019',
  },
  bannerTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  bannerSub: {
    fontSize: 12,
    color: '#A1A1AA',
  },
  bannerBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#8B5CF6',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
});
