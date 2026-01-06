
import { useState } from 'react';
import { StyleSheet, TextInput, Image, KeyboardAvoidingView, Platform, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Text, View } from '@/components/Themed';
import { useRouter, Link } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { LinearGradient } from 'expo-linear-gradient';
import FontAwesome from '@expo/vector-icons/FontAwesome';

export default function RegisterScreen() {
    const router = useRouter();
    const { register, loginWithSpotify, loginWithGoogle } = useAuth();
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleRegister = async () => {
        setError('');

        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        if (password.length < 8) {
            setError("Password must be at least 8 characters");
            return;
        }

        setLoading(true);
        const result = await register(email, password);
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
            style={[styles.container, { backgroundColor: '#0a0a0a' }]}
        >
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <FontAwesome name="arrow-left" size={20} color="white" />
                    <Text style={styles.headerTitle}>Home</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.content}>
                {/* Toggle Header */}
                <View style={styles.toggleContainer}>
                    <Link href="/login" asChild>
                        <TouchableOpacity style={styles.toggleBtn}>
                            <Text style={styles.toggleBtnText}>Log In</Text>
                        </TouchableOpacity>
                    </Link>
                    <TouchableOpacity style={styles.toggleBtnActive}>
                        <Text style={styles.toggleBtnTextActive}>Sign Up</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.mainContainer}>
                    <Text style={styles.title}>Join VibeMixer</Text>
                    <Text style={styles.subtitle}>Create an account to start swiping and refining</Text>

                    <View style={styles.form}>
                        {/* Email Input */}
                        <View style={styles.inputGroup}>
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
                        </View>

                        {/* Password Input */}
                        <View style={styles.inputGroup}>
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
                            <Text style={styles.hint}>Must contain 1 number, 1 uppercase, 1 lowercase.</Text>
                        </View>

                        {/* Confirm Password Input */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>CONFIRM PASSWORD</Text>
                            <View style={[styles.inputContainer, { borderColor: '#333', backgroundColor: '#1a1a1a' }]}>
                                <TextInput
                                    placeholder="........"
                                    placeholderTextColor="#666"
                                    style={[styles.input, { color: 'white' }]}
                                    secureTextEntry={!showPassword}
                                    value={confirmPassword}
                                    onChangeText={setConfirmPassword}
                                />
                            </View>
                        </View>

                        {error ? <Text style={styles.errorText}>{error}</Text> : null}

                        <TouchableOpacity onPress={handleRegister} disabled={loading} style={styles.buttonContainer}>
                            <LinearGradient
                                colors={['#8B5CF6', '#7C3AED']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.button}
                            >
                                {loading ? <ActivityIndicator color="white" /> : <Text style={styles.buttonText}>Create Account</Text>}
                            </LinearGradient>
                        </TouchableOpacity>

                        <View style={styles.dividerContainer}>
                            <View style={styles.divider} />
                            <Text style={styles.dividerText}>OR CONTINUE WITH</Text>
                            <View style={styles.divider} />
                        </View>

                        <View style={styles.socialRow}>
                            <TouchableOpacity style={styles.socialBtn} onPress={loginWithSpotify}>
                                <FontAwesome name="spotify" size={24} color="#1DB954" style={{ marginRight: 10 }} />
                                <Text style={styles.socialBtnText}>Spotify</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.socialBtn} onPress={loginWithGoogle}>
                                <FontAwesome name="google" size={24} color="#DB4437" style={{ marginRight: 10 }} />
                                <Text style={styles.socialBtnText}>Google</Text>
                            </TouchableOpacity>
                        </View>

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
        marginBottom: 30, // Slightly less for register
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
        backgroundColor: '#111',
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
        color: '#8B5CF6',
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 14,
        textAlign: 'center',
        color: 'rgba(255,255,255,0.7)',
        marginBottom: 30,
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
    hint: {
        fontSize: 11,
        color: '#888',
        marginTop: 4,
    },
    eyeIcon: {
        padding: 10,
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
        paddingBottom: 40,
    },
    socialBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#1a1a1a',
        paddingVertical: 15,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#333',
    },
    socialBtnText: {
        color: '#ccc',
        fontWeight: '600',
    },
});
