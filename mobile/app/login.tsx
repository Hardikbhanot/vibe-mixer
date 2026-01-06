
import { useState } from 'react';
import { StyleSheet, TextInput, Image, KeyboardAvoidingView, Platform, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Text, View } from '@/components/Themed';
import { useRouter, Link } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { LinearGradient } from 'expo-linear-gradient';
import FontAwesome from '@expo/vector-icons/FontAwesome';

import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

export default function LoginScreen() {
    const router = useRouter();
    const { login, loginWithSpotify, loginWithGoogle } = useAuth();
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async () => {
        setError('');
        setLoading(true);
        const result = await login(email, password);
        setLoading(false);

        if (result.success) {
            router.dismiss(); // Close modal
        } else {
            setError(result.error);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={[styles.container, { backgroundColor: '#0a0a0a' }]} // Force dark background
        >
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <FontAwesome name="arrow-left" size={20} color="white" />
                    <Text style={styles.headerTitle}>Home</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.content}>
                {/* Toggle Header */}
                <Animated.View
                    entering={FadeInDown.delay(100).duration(600).springify()}
                    style={styles.toggleContainer}
                >
                    <TouchableOpacity style={styles.toggleBtnActive}>
                        <Text style={styles.toggleBtnTextActive}>Log In</Text>
                    </TouchableOpacity>
                    <Link href="/register" asChild>
                        <TouchableOpacity style={styles.toggleBtn}>
                            <Text style={styles.toggleBtnText}>Sign Up</Text>
                        </TouchableOpacity>
                    </Link>
                </Animated.View>

                <View style={styles.mainContainer}>
                    <Animated.View entering={FadeInDown.delay(200).duration(600).springify()}>
                        <Text style={styles.title}>Welcome Back</Text>
                        <Text style={styles.subtitle}>Enter your credentials to access your account</Text>
                    </Animated.View>

                    <View style={styles.form}>
                        {/* Email Input */}
                        <Animated.View entering={FadeInDown.delay(300).duration(600).springify()} style={styles.inputGroup}>
                            <Text style={styles.label}>EMAIL</Text>
                            <View style={[styles.inputContainer, { borderColor: '#333', backgroundColor: '#1a1a1a' }]}>
                                <TextInput
                                    placeholder="hello@example.com"
                                    placeholderTextColor="#666"
                                    style={[styles.input, { color: 'white' }]}
                                    autoCapitalize="none"
                                    value={email}
                                    onChangeText={setEmail}
                                    keyboardType="email-address"
                                />
                            </View>
                        </Animated.View>

                        {/* Password Input */}
                        <Animated.View entering={FadeInDown.delay(400).duration(600).springify()} style={styles.inputGroup}>
                            <Text style={styles.label}>PASSWORD</Text>
                            <View style={[styles.inputContainer, { borderColor: '#333', backgroundColor: '#1a1a1a' }]}>
                                <TextInput
                                    placeholder="........"
                                    placeholderTextColor="#666"
                                    style={[styles.input, { color: 'white' }]}
                                    secureTextEntry={!showPassword}
                                    value={password}
                                    onChangeText={setPassword}
                                />
                                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                                    <FontAwesome name={showPassword ? "eye" : "eye-slash"} size={20} color="white" />
                                </TouchableOpacity>
                            </View>
                        </Animated.View>

                        <Animated.View entering={FadeInDown.delay(500).duration(600).springify()}>
                            <TouchableOpacity style={styles.forgotPassword}>
                                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                            </TouchableOpacity>
                        </Animated.View>

                        {error ? <Text style={styles.errorText}>{error}</Text> : null}

                        <Animated.View entering={FadeInUp.delay(600).duration(600).springify()}>
                            <TouchableOpacity onPress={handleLogin} disabled={loading} style={styles.buttonContainer}>
                                <LinearGradient
                                    colors={['#8B5CF6', '#7C3AED']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={styles.button}
                                >
                                    {loading ? <ActivityIndicator color="white" /> : <Text style={styles.buttonText}>Sign In</Text>}
                                </LinearGradient>
                            </TouchableOpacity>
                        </Animated.View>

                        <Animated.View entering={FadeInUp.delay(700).duration(600).springify()}>
                            <View style={styles.dividerContainer}>
                                <View style={styles.divider} />
                                <Text style={styles.dividerText}>OR CONTINUE WITH</Text>
                                <View style={styles.divider} />
                            </View>
                        </Animated.View>

                        <Animated.View entering={FadeInUp.delay(800).duration(600).springify()} style={styles.socialRow}>
                            <TouchableOpacity style={styles.socialBtn} onPress={loginWithSpotify}>
                                <FontAwesome name="spotify" size={24} color="#1DB954" style={{ marginRight: 10 }} />
                                <Text style={styles.socialBtnText}>Spotify</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.socialBtn} onPress={loginWithGoogle}>
                                <FontAwesome name="google" size={24} color="#DB4437" style={{ marginRight: 10 }} />
                                <Text style={styles.socialBtnText}>Google</Text>
                            </TouchableOpacity>
                        </Animated.View>
                    </View>
                </View>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        paddingTop: 60,
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerTitle: {
        color: 'white',
        fontSize: 16,
        marginLeft: 10,
    },
    content: {
        flex: 1,
        paddingHorizontal: 20,
    },
    toggleContainer: {
        flexDirection: 'row',
        backgroundColor: '#1a1a1a',
        borderRadius: 12,
        padding: 4,
        marginBottom: 40,
    },
    toggleBtn: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        borderRadius: 10,
    },
    toggleBtnActive: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        backgroundColor: '#111', // Slightly darker/lighter for contrast
        borderRadius: 10,
    },
    toggleBtnText: {
        color: '#888',
        fontWeight: '600',
    },
    toggleBtnTextActive: {
        color: 'white',
        fontWeight: 'bold',
    },
    mainContainer: {
        flex: 1,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        textAlign: 'center',
        color: '#8B5CF6', // Purple Title
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 14,
        textAlign: 'center',
        color: 'rgba(255,255,255,0.7)',
        marginBottom: 40,
    },
    form: {
        gap: 20,
    },
    inputGroup: {
        gap: 8,
    },
    label: {
        color: 'white',
        fontSize: 12,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 0,
        borderRadius: 12,
        paddingHorizontal: 15,
        height: 55,
    },
    input: {
        flex: 1,
        fontSize: 16,
        height: '100%',
    },
    eyeIcon: {
        padding: 10,
    },
    forgotPassword: {
        alignSelf: 'flex-end',
    },
    forgotPasswordText: {
        color: '#8B5CF6',
        fontSize: 14,
    },
    buttonContainer: {
        marginTop: 10,
        shadowColor: "#8B5CF6",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 10,
        elevation: 5,
    },
    button: {
        height: 55,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    buttonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
    errorText: {
        color: '#FF6B6B',
        textAlign: 'center',
        marginTop: 10,
    },
    dividerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 20,
    },
    divider: {
        flex: 1,
        height: 1,
        backgroundColor: '#333',
    },
    dividerText: {
        color: '#888',
        fontSize: 12,
        marginHorizontal: 10,
        fontWeight: 'bold',
    },
    socialRow: {
        flexDirection: 'row',
        gap: 15,
    },
    socialBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#1a1a1a', // Dark button
        paddingVertical: 15,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#333', // Subtle border
    },
    socialBtnText: {
        color: '#ccc', // Lighter text
        fontWeight: '600',
    },
});
