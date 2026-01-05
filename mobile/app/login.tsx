
import { useState } from 'react';
import { StyleSheet, TextInput, Image, KeyboardAvoidingView, Platform, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Text, View } from '@/components/Themed';
import { useRouter, Link } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { LinearGradient } from 'expo-linear-gradient';

export default function LoginScreen() {
    const router = useRouter();
    const { login } = useAuth();
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
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
            style={[styles.container, { backgroundColor: theme.background }]}
        >
            <View style={styles.content}>
                <Image source={{ uri: 'https://vibemixer.hbhanot.tech/logo.png' }} style={styles.logo} />
                <Text style={styles.title}>Welcome Back</Text>
                <Text style={styles.subtitle}>Sign in to sync your vibes.</Text>

                <View style={styles.form}>
                    <View style={[styles.inputContainer, { borderColor: theme.text + '20' }]}>
                        <TextInput
                            placeholder="Email"
                            placeholderTextColor={theme.text + '60'}
                            style={[styles.input, { color: theme.text }]}
                            autoCapitalize="none"
                            value={email}
                            onChangeText={setEmail}
                        />
                    </View>
                    <View style={[styles.inputContainer, { borderColor: theme.text + '20' }]}>
                        <TextInput
                            placeholder="Password"
                            placeholderTextColor={theme.text + '60'}
                            style={[styles.input, { color: theme.text }]}
                            secureTextEntry
                            value={password}
                            onChangeText={setPassword}
                        />
                    </View>

                    {error ? <Text style={styles.errorText}>{error}</Text> : null}

                    <TouchableOpacity onPress={handleLogin} disabled={loading} style={styles.buttonContainer}>
                        <LinearGradient
                            colors={[theme.tint, '#A78BFA']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.button}
                        >
                            {loading ? <ActivityIndicator color="white" /> : <Text style={styles.buttonText}>Sign In</Text>}
                        </LinearGradient>
                    </TouchableOpacity>

                    <Link href="/register" asChild>
                        <TouchableOpacity style={styles.linkButton}>
                            <Text style={[styles.linkText, { color: theme.text }]}>
                                Don't have an account? <Text style={{ color: theme.tint, fontWeight: 'bold' }}>Sign Up</Text>
                            </Text>
                        </TouchableOpacity>
                    </Link>
                </View>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        padding: 30,
    },
    logo: {
        width: 80,
        height: 80,
        alignSelf: 'center',
        marginBottom: 20,
        resizeMode: 'contain',
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 16,
        textAlign: 'center',
        opacity: 0.6,
        marginBottom: 40,
    },
    form: {
        gap: 15,
    },
    inputContainer: {
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 15,
        height: 55,
        justifyContent: 'center',
    },
    input: {
        fontSize: 16,
        height: '100%',
    },
    buttonContainer: {
        marginTop: 10,
        shadowColor: "#8B5CF6",
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.3,
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
        marginBottom: 10,
    },
    linkButton: {
        marginTop: 20,
        alignItems: 'center',
    },
    linkText: {
        fontSize: 14,
    },
});
