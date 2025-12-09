import Link from 'next/link';
import { Header } from '@/components/Header';

export default function TermsOfService() {
    return (
        <div className="min-h-screen flex flex-col bg-background-light dark:bg-background-dark text-foreground">
            <Header />
            <main className="flex-1 max-w-3xl mx-auto px-4 py-8">
                <h1 className="text-3xl font-bold mb-6">Terms of Service</h1>
                <p className="mb-4 text-sm text-muted-foreground">Last updated: December 9, 2024</p>

                <section className="mb-6">
                    <h2 className="text-xl font-semibold mb-2">1. Acceptance of Terms</h2>
                    <p className="mb-2">
                        By accessing and using VibeMixer, you accept and agree to be bound by the terms and provision of this agreement.
                    </p>
                </section>

                <section className="mb-6">
                    <h2 className="text-xl font-semibold mb-2">2. Description of Service</h2>
                    <p className="mb-2">
                        VibeMixer is an AI-powered tool that generates music playlists based on user inputs (mood, activity, etc.) and allows exporting them to third-party platforms like Spotify and YouTube.
                    </p>
                </section>

                <section className="mb-6">
                    <h2 className="text-xl font-semibold mb-2">3. User Conduct</h2>
                    <p className="mb-2">
                        You agree to use VibeMixer only for lawful purposes. You are prohibited from using the service to:
                    </p>
                    <ul className="list-disc list-inside ml-4 space-y-1">
                        <li>Violate any applicable local, state, national, or international law.</li>
                        <li>Infringe upon the rights of others, including intellectual property rights.</li>
                        <li>Transmitting excessive automated requests (bots, scrapers) that disrupt the service.</li>
                    </ul>
                </section>

                <section className="mb-6">
                    <h2 className="text-xl font-semibold mb-2">4. Third-Party Integration</h2>
                    <p className="mb-2">
                        Our service interacts with Spotify and YouTube APIs. By using these features, you also agree to be bound by the:
                    </p>
                    <ul className="list-disc list-inside ml-4 space-y-1">
                        <li><a href="https://www.spotify.com/legal/end-user-agreement/" target="_blank" className="text-primary hover:underline">Spotify User Agreement</a></li>
                        <li><a href="https://www.youtube.com/t/terms" target="_blank" className="text-primary hover:underline">YouTube Terms of Service</a></li>
                    </ul>
                </section>

                <section className="mb-6">
                    <h2 className="text-xl font-semibold mb-2">5. Disclaimer of Warranties</h2>
                    <p className="mb-2">
                        The service is provided on an "as is" and "as available" basis. VibeMixer makes no warranties, expressed or implied, regarding the accuracy or reliability of the AI-generated content.
                    </p>
                </section>

                <section className="mb-6">
                    <h2 className="text-xl font-semibold mb-2">6. Limitation of Liability</h2>
                    <p className="mb-2">
                        In no event shall VibeMixer be liable for any indirect, incidental, special, consequential or punitive damages arising out of your use of the service.
                    </p>
                </section>

                <div className="pt-8 mb-10">
                    <Link href="/" className="text-sm font-medium hover:text-primary transition-colors">
                        &larr; Back to Home
                    </Link>
                </div>
            </main>
        </div >
    );
}
