
import { useState } from 'react';
import { StyleSheet, TextInput, ScrollView, TouchableOpacity, Switch, Image, Dimensions, Modal, FlatList, ActivityIndicator, Alert } from 'react-native';
import { Text, View } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import Slider from '@react-native-community/slider';
import { LinearGradient } from 'expo-linear-gradient';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { api } from '@/constants/api';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as ImagePicker from 'expo-image-picker';

const { width, height } = Dimensions.get('window');

const VIBE_TYPES = ['Offbeat', 'Popular', 'Mix'];
const AI_MODELS = [
    { id: 'llama-3-70b', name: 'Llama 3 70B (Fast - Efficient)' },
    { id: 'gpt-oss-120b', name: 'GPT-OSS 120B (Experimental - Smartest)' },
    { id: 'mixtral-8x7b', name: 'Mixtral 8x7B (Balanced)' },
];

export default function GenerateScreen() {
    const colorScheme = useColorScheme();
    const router = useRouter();
    const theme = Colors['dark']; // Force Dark Theme

    const [mood, setMood] = useState('');
    const [isAdvanced, setIsAdvanced] = useState(false);

    // Image Upload State
    const [imageUri, setImageUri] = useState<string | null>(null);
    const [isAnalyzingImage, setIsAnalyzingImage] = useState(false);

    // Loading State
    const [generating, setGenerating] = useState(false);

    // Sliders
    const [duration, setDuration] = useState(60); // Minutes
    const [energy, setEnergy] = useState(0.5);
    const [tempo, setTempo] = useState(0.75);
    const [valence, setValence] = useState(0.3);

    const [vibeType, setVibeType] = useState('Mix');

    // Model Selection
    const [selectedModel, setSelectedModel] = useState(AI_MODELS[1]); // Default to GPT-OSS
    const [modalVisible, setModalVisible] = useState(false);

    const pickImage = async () => {
        // Request permissions
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission needed', 'Sorry, we need camera roll permissions to make this happen!');
            return;
        }

        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1], // Square aspect ratio often better for covers
            quality: 0.5, // Compress a bit
        });

        if (!result.canceled) {
            setImageUri(result.assets[0].uri);
            analyzeImage(result.assets[0]);
        }
    };

    const analyzeImage = async (asset: any) => {
        setIsAnalyzingImage(true);
        try {
            const formData = new FormData();
            formData.append('image', {
                uri: asset.uri,
                name: 'upload.jpg',
                type: 'image/jpeg',
            } as any);

            const res = await api.upload('/ai/analyze-image', formData);
            if (res && res.mood) {
                setMood(res.mood);
            } else {
                Alert.alert("Analyze Failed", "Could not understand the image vibe.");
            }
        } catch (e) {
            Alert.alert("Error", "Network error during analysis.");
        } finally {
            setIsAnalyzingImage(false);
        }
    };


    const handleGenerate = async () => {
        if (!mood.trim()) {
            Alert.alert("Missing Vibe", "Please tell us what kind of vibe you're looking for!");
            return;
        }

        setGenerating(true);
        try {
            console.log("Generating with params:", { mood, duration, energy, model: selectedModel.id });
            const res = await api.post('/ai/analyze', {
                mood,
                duration,
                vibeType: vibeType.toLowerCase(),
                energy,
                tempo,
                valence,
                model: selectedModel.id
            });

            if (res.error) {
                Alert.alert("Error", res.message || "Failed to generate vibe. Try again.");
            } else {
                // Generate Pollinations Image if no user image, else use uploaded? 
                // Actually the backend endpoint returns a generated cover usually.
                // But let's mirror the logic: If user uploaded image, we might want to use that as cover?
                // For now, let's stick to the generated prompt or Pollinations.

                let coverImage = null;
                if (imageUri) {
                    coverImage = imageUri; // Use the user's uploaded image locally
                } else {
                    const pollPrompt = encodeURIComponent(`${mood} abstract album cover art high quality 4k`);
                    coverImage = `https://image.pollinations.ai/prompt/${pollPrompt}`;
                }

                // Navigate to the playlist page with data
                router.push({
                    pathname: '/generated-playlist',
                    params: { data: JSON.stringify({ ...res, coverImage }) }
                });
            }
        } catch (e) {
            console.error(e);
            Alert.alert("Error", "Something went wrong.");
        } finally {
            setGenerating(false);
        }
    };

    return (
        <View style={styles.container}>
            {/* Global Background */}
            <LinearGradient
                colors={['#000000', '#11052C', '#1E0B36']}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 1 }}
                style={StyleSheet.absoluteFill}
            />

            <ScrollView contentContainerStyle={styles.scrollContent}>

                {/* Header */}
                <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.header}>
                    <Text style={styles.title}>Craft Your Perfect Mix</Text>
                </Animated.View>

                {/* Upload Placeholder */}
                <Animated.View entering={FadeInDown.delay(200).springify()}>
                    <Text style={styles.label}>Start with a photo (Optional)</Text>
                    <TouchableOpacity style={styles.uploadBox} activeOpacity={0.8} onPress={pickImage} disabled={isAnalyzingImage}>
                        {isAnalyzingImage ? (
                            <ActivityIndicator color="white" />
                        ) : imageUri ? (
                            <Image source={{ uri: imageUri }} style={styles.previewImage} />
                        ) : (
                            <>
                                <FontAwesome name="image" size={24} color={theme.text} style={{ opacity: 0.7, marginBottom: 10 }} />
                                <Text style={styles.uploadTextBold}>Click to upload <Text style={styles.uploadText}>or drag and drop</Text></Text>
                                <Text style={styles.uploadSubText}>AI will describe the vibe for you</Text>
                            </>
                        )}
                    </TouchableOpacity>
                    {isAnalyzingImage && <Text style={{ color: '#ccc', textAlign: 'center', marginBottom: 10, fontSize: 12 }}>Analyzing vibe...</Text>}
                </Animated.View>

                {/* Text Input */}
                <Animated.View entering={FadeInDown.delay(300).springify()}>
                    <Text style={styles.label}>Tell VibeMixer your vibe</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="e.g., 'Rainy day coding music' or 'High-energy 90s hip-hop workout.'"
                        placeholderTextColor="rgba(255,255,255,0.4)"
                        value={mood}
                        onChangeText={setMood}
                        multiline
                    />
                </Animated.View>

                {/* Advanced Toggle */}
                <Animated.View entering={FadeInDown.delay(400).springify()} style={[styles.row, { marginVertical: 20 }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <View style={{ padding: 8, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 8, marginRight: 10 }}>
                            <FontAwesome name="sliders" size={16} color="white" />
                        </View>
                        <Text style={{ color: 'white', fontWeight: 'bold' }}>Advanced Mode</Text>
                    </View>
                    <Switch
                        value={isAdvanced}
                        onValueChange={setIsAdvanced}
                        trackColor={{ false: '#767577', true: theme.tint }}
                        thumbColor={'white'}
                    />
                </Animated.View>

                {isAdvanced && (
                    <Animated.View entering={FadeInDown.duration(300)}>
                        {/* Model Selector Trigger */}
                        <Text style={styles.label}>AI Model (Brain) 🧠</Text>
                        <TouchableOpacity style={styles.pickerContainer} onPress={() => setModalVisible(true)}>
                            <Text style={{ color: 'white' }}>{selectedModel.name}</Text>
                            <FontAwesome name="chevron-down" size={12} color="rgba(255,255,255,0.5)" />
                        </TouchableOpacity>
                        <Text style={styles.helperText}>GPT-OSS is smarter but may hit rate limits. We auto-fallback if it fails.</Text>

                        {/* Vibe Type Tabs */}
                        <Text style={[styles.label, { marginTop: 20 }]}>Vibe Type</Text>
                        <View style={styles.tabContainer}>
                            {VIBE_TYPES.map((type) => (
                                <TouchableOpacity
                                    key={type}
                                    style={[styles.tab, vibeType === type && { backgroundColor: theme.tint }]}
                                    onPress={() => setVibeType(type)}
                                >
                                    <Text style={[styles.tabText, vibeType === type && { color: 'white', fontWeight: 'bold' }]}>{type}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* Sliders */}
                        <View style={styles.sliderGroup}>
                            <View style={styles.sliderHeader}>
                                <Text style={styles.sliderLabel}>Duration</Text>
                                <Text style={styles.sliderValue}>{Math.round(duration)} mins</Text>
                            </View>
                            <Slider
                                style={{ width: '100%', height: 40 }}
                                minimumValue={10}
                                maximumValue={120}
                                value={duration}
                                onValueChange={setDuration}
                                minimumTrackTintColor="white"
                                maximumTrackTintColor="rgba(255,255,255,0.1)"
                                thumbTintColor="white"
                            />
                        </View>

                        <View style={styles.sliderGroup}>
                            <View style={styles.sliderHeader}>
                                <Text style={styles.sliderLabel}>Energy</Text>
                                <Text style={styles.sliderValue}>{Math.round(energy * 100)}%</Text>
                            </View>
                            <Slider
                                style={{ width: '100%', height: 40 }}
                                minimumValue={0}
                                maximumValue={1}
                                value={energy}
                                onValueChange={setEnergy}
                                minimumTrackTintColor="white"
                                maximumTrackTintColor="rgba(255,255,255,0.1)"
                                thumbTintColor="white"
                            />
                        </View>
                    </Animated.View>
                )}

                {/* Generate Button */}
                <Animated.View entering={FadeInDown.delay(500).springify()}>
                    <TouchableOpacity
                        activeOpacity={0.8}
                        style={styles.generateButton}
                        onPress={handleGenerate}
                        disabled={generating || isAnalyzingImage}
                    >
                        <LinearGradient
                            colors={generating ? ['#444', '#555'] : [theme.tint, '#A78BFA']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.gradientButton}
                        >
                            {generating ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <Text style={styles.buttonText}>Generate My Mix</Text>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>
                </Animated.View>

            </ScrollView>

            {/* Model Selection Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Select AI Model</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <FontAwesome name="close" size={20} color="white" />
                            </TouchableOpacity>
                        </View>
                        <FlatList
                            data={AI_MODELS}
                            keyExtractor={item => item.id}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={[styles.modelOption, selectedModel.id === item.id && styles.selectedModelOption]}
                                    onPress={() => {
                                        setSelectedModel(item);
                                        setModalVisible(false);
                                    }}
                                >
                                    <Text style={[styles.modelText, selectedModel.id === item.id && { color: theme.tint, fontWeight: 'bold' }]}>
                                        {item.name}
                                    </Text>
                                    {selectedModel.id === item.id && <FontAwesome name="check" size={16} color={theme.tint} />}
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                </View>
            </Modal>
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
        fontSize: 28,
        fontWeight: 'bold',
        color: 'white',
    },
    label: {
        color: 'white',
        fontWeight: '600',
        marginBottom: 10,
        fontSize: 14,
    },
    uploadBox: {
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
        borderStyle: 'dashed',
        borderRadius: 12,
        height: 120,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 25,
        backgroundColor: 'rgba(255,255,255,0.02)',
        overflow: 'hidden',
    },
    previewImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover'
    },
    uploadTextBold: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 14,
        marginBottom: 4,
    },
    uploadText: {
        fontWeight: 'normal',
    },
    uploadSubText: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 12,
    },
    input: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 12,
        padding: 15,
        height: 100,
        textAlignVertical: 'top',
        color: 'white',
        fontSize: 16,
        marginBottom: 10,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#111',
        padding: 15,
        borderRadius: 12,
    },
    pickerContainer: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        padding: 15,
        borderRadius: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#8B5CF6',
    },
    helperText: {
        color: 'rgba(255,255,255,0.4)',
        fontSize: 12,
        marginTop: 8,
        marginBottom: 20,
    },
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 10,
        padding: 4,
        marginBottom: 20,
    },
    tab: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 8,
    },
    tabText: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 14,
        fontWeight: '500',
    },
    sliderGroup: {
        marginBottom: 15,
    },
    sliderHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 5,
    },
    sliderLabel: {
        color: 'white',
        fontWeight: '500',
    },
    sliderValue: {
        color: 'rgba(255,255,255,0.6)',
    },
    generateButton: {
        marginTop: 30,
        shadowColor: "#8B5CF6",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
    },
    gradientButton: {
        paddingVertical: 18,
        borderRadius: 30,
        alignItems: 'center',
    },
    buttonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0,0,0,0.7)',
    },
    modalContent: {
        backgroundColor: '#1a1a1a',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
        maxHeight: '50%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#333',
        paddingBottom: 15,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: 'white',
    },
    modelOption: {
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#222',
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    selectedModelOption: {
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
        paddingHorizontal: 10,
        borderRadius: 8,
        borderBottomWidth: 0,
    },
    modelText: {
        color: 'white',
        fontSize: 16,
    }
});
