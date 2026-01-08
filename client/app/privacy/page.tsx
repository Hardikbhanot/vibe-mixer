import Link from 'next/link';
import { Header } from '@/components/Header';

export default function PrivacyPolicy() {
    return (
        <div className="min-h-screen flex flex-col bg-background-light dark:bg-background-dark text-foreground">
            <Header />
            <main className="flex-1 max-w-3xl mx-auto px-4 py-8">
                <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
                <p className="mb-4 text-sm text-muted-foreground">Last updated: January 2026</p>

                {/* ... Sections 1, 2, 3 remain the same ... */}
                
                <section className="mb-6">
                    <h2 className="text-xl font-semibold mb-2">1. Introduction</h2>
                    <p className="mb-2">
                        Welcome to VibeMixer ("we," "our," or "us"). We respect your privacy and are committed to protecting existing user data.
                        This Privacy Policy explains how we handle your data when you use our AI Playlist Generator application.
                    </p>
                </section>

                <section className="mb-6">
                    <h2 className="text-xl font-semibold mb-2">2. Data We Collect</h2>
                    <p className="mb-2">We collect the following types of information:</p>
                    <ul className="list-disc list-inside ml-4 space-y-1">
                        <li><strong>Spotify & YouTube Data:</strong> When you connect your accounts, we access your public profile and permission to create playlists on your behalf. We do not store your credentials.</li>
                        <li><strong>Usage Data:</strong> We use Google Analytics to understand how visitors interact with our website.</li>
                        <li><strong>Cookies:</strong> We use cookies to maintain your session and authentication state.</li>
                    </ul>
                </section>

                <section className="mb-6">
                    <h2 className="text-xl font-semibold mb-2">3. How We Use Your Data</h2>
                    <p className="mb-2">We use your data solely to:</p>
                    <ul className="list-disc list-inside ml-4 space-y-1">
                        <li>Generate and save playlists to your Spotify or YouTube account.</li>
                        <li>Improve the functionality and user experience of VibeMixer.</li>
                    </ul>
                    <p className="mt-2">We DO NOT sell your personal data to third parties.</p>
                </section>

                {/* ⚠️ NEW: Required by Google (AI Disclosure) */}
                <section className="mb-6 bg-yellow-500/10 p-4 rounded-lg border border-yellow-500/20">
                    <h2 className="text-xl font-semibold mb-2 text-yellow-600 dark:text-yellow-400">4. AI Processing & Third-Party Sharing</h2>
                    <p className="mb-2">
                        To provide our AI-powered features (e.g., analyzing vibes, generating playlists), we briefly process text descriptors of your musical preferences using third-party AI providers.
                    </p>
                    <p className="mb-2 font-semibold">Specific Disclosures:</p>
                    <ul className="list-disc list-inside ml-4 space-y-1">
                        <li>
                            <strong>AI Service Provider:</strong> We use <strong>Groq Inc.</strong> to process text prompts for playlist generation. 
                        </li>
                        <li>
                            <strong>Data Minimization:</strong> We only send <strong>anonymized</strong> song titles, artist names, and "vibe" descriptors to the AI. We <strong>never</strong> send your Personally Identifiable Information (PII), Google Account IDs, or email addresses to the AI model.
                        </li>
                        <li>
                            <strong>No Training Policy:</strong> Data sent to our AI providers is used <strong>solely for inference</strong> (generating the response) and is <strong>not used to train generalized AI models</strong>.
                        </li>
                    </ul>
                </section>

                {/* ⚠️ NEW: Required by Google (Security) */}
                <section className="mb-6">
                    <h2 className="text-xl font-semibold mb-2">5. Data Protection Mechanisms</h2>
                    <p className="mb-2">We employ industry-standard security measures to protect your sensitive data:</p>
                    <ul className="list-disc list-inside ml-4 space-y-1">
                        <li><strong>Encryption in Transit:</strong> All data transmitted between your browser, our servers, and third-party APIs (Google, Spotify, Groq) is encrypted using <strong>TLS/SSL (HTTPS)</strong>.</li>
                        <li><strong>Encryption at Rest:</strong> Sensitive tokens (like OAuth Access Tokens) are stored in secure, HttpOnly cookies or encrypted databases and are never exposed to the client-side code.</li>
                        <li><strong>Ephemeral Processing:</strong> User data used for AI analysis is processed in-memory and is not permanently stored on our AI processing servers.</li>
                    </ul>
                </section>

                <section className="mb-6">
                    <h2 className="text-xl font-semibold mb-2">6. Third-Party Services</h2>
                    <p className="mb-2">Our service integrates with the following third-party services:</p>
                    <ul className="list-disc list-inside ml-4 space-y-1">
                        <li><strong>Spotify:</strong> Data provided to Spotify is subject to the <a href="https://www.spotify.com/legal/privacy-policy/" target="_blank" className="text-primary hover:underline">Spotify Privacy Policy</a>.</li>
                        <li><strong>Google Services:</strong> Data accessed via YouTube API is subject to the <a href="https://policies.google.com/privacy" target="_blank" className="text-primary hover:underline">Google Privacy Policy</a>.</li>
                    </ul>
                </section>
                
                 <section className="mb-6">
                    <h2 className="text-xl font-semibold mb-2">7. User Rights and Revocation</h2>
                     <p className="mb-2">You can revoke access to your data at any time:</p>
                     <ul className="list-disc list-inside ml-4 space-y-1">
                        <li><a href="https://myaccount.google.com/permissions" target="_blank" className="text-primary hover:underline">Google Security Settings</a></li>
                    </ul>
                </section>

                <div className="pt-8 mb-10">
                    <Link href="/" className="text-sm font-medium hover:text-primary transition-colors">
                        ← Back to Home
                    </Link>
                </div>
            </main>
        </div>
    );
}
