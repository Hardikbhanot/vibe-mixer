import Link from 'next/link';
import { Header } from '@/components/Header';

export default function PrivacyPolicy() {
    return (
        <div className="min-h-screen flex flex-col bg-background-light dark:bg-background-dark text-foreground">
            <Header />
            <main className="flex-1 max-w-3xl mx-auto px-4 py-8">
                <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
                <p className="mb-4 text-sm text-muted-foreground">Last updated: January 8, 2026</p>

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
                    <p className="mb-2">We use your data solely to provide or improve user-facing features:</p>
                    <ul className="list-disc list-inside ml-4 space-y-1">
                        <li>To generate and save playlists to your Spotify or YouTube account.</li>
                        <li>To analyze musical preferences ("vibe") to provide relevant recommendations.</li>
                    </ul>
                    <p className="mt-2 text-sm text-muted-foreground">
                        We <strong>DO NOT</strong> use Google User Data for advertising, market research, or to train generalized Artificial Intelligence/Machine Learning models.
                    </p>
                </section>

                {/* ⚠️ CRITICAL SECTION FOR GOOGLE VERIFICATION */}
                <section className="mb-6 bg-yellow-500/10 p-4 rounded-lg border border-yellow-500/20">
                    <h2 className="text-xl font-semibold mb-2 text-yellow-600 dark:text-yellow-400">4. Sharing and Disclosure of Google User Data</h2>
                    <p className="mb-2">
                        We do not share, transfer, or disclose Google User Data with third parties except as necessary to provide the application's features. The entities we share data with are:
                    </p>
                    <ul className="list-disc list-inside ml-4 space-y-1">
                        <li>
                            <strong>AI Service Provider (Groq Inc.):</strong> We send anonymized text descriptors of songs to Groq for the sole purpose of generating playlist suggestions (Inference). We do not send personally identifiable information (PII) or Google User IDs to this provider.
                        </li>
                        <li>
                            <strong>Google Services (YouTube API):</strong> We interact with the YouTube API to facilitate playlist creation on your channel.
                        </li>
                    </ul>
                    <p className="mt-2 text-sm">
                        Our use and transfer to any other app of information received from Google APIs will adhere to the <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" className="text-primary hover:underline">Google API Services User Data Policy</a>, including the Limited Use requirements.
                    </p>
                </section>

                {/* ⚠️ CRITICAL SECTION FOR SECURITY */}
                <section className="mb-6">
                    <h2 className="text-xl font-semibold mb-2">5. Data Protection Mechanisms</h2>
                    <p className="mb-2">We employ strict security measures to protect your Sensitive Data:</p>
                    <ul className="list-disc list-inside ml-4 space-y-1">
                        <li><strong>Encryption in Transit:</strong> All data transmitted between your browser, our servers, and third-party APIs is encrypted using <strong>TLS/SSL (HTTPS)</strong>.</li>
                        <li><strong>Encryption at Rest:</strong> Authentication tokens (OAuth Access Tokens) are encrypted and stored in secure, HttpOnly cookies. They are never exposed to client-side scripts.</li>
                        <li><strong>Data Minimization:</strong> We only request the scopes necessary for the app's functionality and do not retain user data longer than necessary for the session.</li>
                    </ul>
                </section>

                <section className="mb-6">
                    <h2 className="text-xl font-semibold mb-2">6. Third-Party Policies</h2>
                    <p className="mb-2">Our service integrates with:</p>
                    <ul className="list-disc list-inside ml-4 space-y-1">
                        <li><strong>Spotify:</strong> <a href="https://www.spotify.com/legal/privacy-policy/" target="_blank" className="text-primary hover:underline">Spotify Privacy Policy</a>.</li>
                        <li><strong>Google/YouTube:</strong> <a href="https://policies.google.com/privacy" target="_blank" className="text-primary hover:underline">Google Privacy Policy</a>.</li>
                    </ul>
                </section>
                
                 <section className="mb-6">
                    <h2 className="text-xl font-semibold mb-2">7. User Rights and Revocation</h2>
                     <p className="mb-2">You can revoke VibeMixer's access to your data at any time via:</p>
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
