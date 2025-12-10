import Link from 'next/link';
import { Header } from '@/components/Header';

export default function PrivacyPolicy() {
    return (
        <div className="min-h-screen flex flex-col bg-background-light dark:bg-background-dark text-foreground">
            <Header />
            <main className="flex-1 max-w-3xl mx-auto px-4 py-8">
                <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
                <p className="mb-4 text-sm text-muted-foreground">Last updated: December 10, 2025</p>

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
                        <li><strong>Usage Data:</strong> We use Google Analytics to understand how visitors interact with our website (e.g., pages visited, session duration).</li>
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

                <section className="mb-6">
                    <h2 className="text-xl font-semibold mb-2">4. Third-Party Services</h2>
                    <p className="mb-2">Our service integrates with the following third-party services:</p>
                    <ul className="list-disc list-inside ml-4 space-y-1">
                        <li><strong>Spotify:</strong> Data provided to Spotify is subject to the <a href="https://www.spotify.com/legal/privacy-policy/" target="_blank" className="text-primary hover:underline">Spotify Privacy Policy</a>.</li>
                        <li><strong>Google Privacy Policy:</strong> Data provided to YouTube is subject to the <a href="https://policies.google.com/privacy" target="_blank" className="text-primary hover:underline">Google Privacy Policy</a>.</li>
                        <li><strong>YouTube Terms of Service:</strong> By using VibeMixer, you are agreeing to be bound by the <a href="https://www.youtube.com/t/terms" target="_blank" className="text-primary hover:underline">YouTube Terms of Service</a>.</li>
                    </ul>
                </section>

                <section className="mb-6">
                    <h2 className="text-xl font-semibold mb-2">5. User Rights and Revocation</h2>
                    <p className="mb-2">
                        You can revoke VibeMixer's access to your data at any time via your account settings on the respective platforms:
                    </p>
                    <ul className="list-disc list-inside ml-4 space-y-1">
                        <li><a href="https://www.spotify.com/account/apps/" target="_blank" className="text-primary hover:underline">Spotify Apps Settings</a></li>
                        <li><a href="https://myaccount.google.com/permissions" target="_blank" className="text-primary hover:underline">Google Security Settings (for YouTube)</a></li>
                    </ul>
                    <p className="mt-2">
                        If you have questions or wish to delete any temporary data we might hold, please contact us at: <a href="mailto:support@vibemixer.hbhanot.tech" className="text-primary hover:underline">support@vibemixer.hbhanot.tech</a>
                    </p>
                </section>

                <div className="pt-8 mb-10">
                    <Link href="/" className="text-sm font-medium hover:text-primary transition-colors">
                        &larr; Back to Home
                    </Link>
                </div>
            </main>
        </div>
    );
}
