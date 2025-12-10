
import Link from "next/link";
import { Header } from "@/components/Header";

export default function Home() {
    return (
        <div className="relative flex size-full min-h-screen flex-col bg-background-light dark:bg-background-dark group/design-root overflow-x-hidden antialiased transition-colors duration-300">
            <div className="layout-container flex h-full grow flex-col">
                <Header />

                <main className="flex flex-1 justify-center py-5 px-4">
                    <div className="layout-content-container flex flex-col max-w-[960px] flex-1">
                        <div className="@container">
                            <div className="@[480px]:p-4">
                                <div
                                    className="flex min-h-[480px] flex-col gap-6 bg-cover bg-center bg-no-repeat @[480px]:gap-8 @[480px]:rounded-xl items-start justify-end px-4 pb-10 @[480px]:px-10"
                                    style={{
                                        backgroundImage:
                                            'linear-gradient(rgba(0, 0, 0, 0.2) 0%, rgba(0, 0, 0, 0.6) 100%), url("https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=2070&auto=format&fit=crop")',
                                    }}
                                >
                                    <div className="flex flex-col gap-2 text-left">
                                        <h2 className="text-white text-4xl font-black leading-tight tracking-[-0.033em] sm:text-5xl">
                                            Discover your next favorite vibe
                                        </h2>
                                        <p className="text-white/80 text-base font-normal leading-normal max-w-md">
                                            AI-powered playlists tailored to your mood, activity, and taste.
                                        </p>
                                    </div>
                                    <Link href="/generate">
                                        <button className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-full h-10 px-6 bg-gradient-to-r from-primary to-secondary text-white text-sm font-bold leading-normal tracking-[0.015em] hover:shadow-lg hover:shadow-primary/30 hover:scale-105 transition-all">
                                            <span className="truncate">Start Mixing</span>
                                        </button>
                                    </Link>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col gap-10 px-4 py-10 @container">
                            <h2 className="text-foreground text-[32px] font-bold leading-tight">
                                How it works
                            </h2>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                <div className="flex flex-col gap-4">
                                    <div className="p-4 rounded-2xl bg-surface-light dark:bg-surface-dark w-fit">
                                        <span className="material-symbols-outlined text-4xl text-primary">sentiment_satisfied</span>
                                    </div>
                                    <div>
                                        <h3 className="text-foreground text-lg font-bold leading-tight">
                                            Describe your mood
                                        </h3>
                                        <p className="text-muted-foreground text-sm font-normal leading-normal mt-2">
                                            Tell us how you're feeling or what you're doing. "Late night coding", "Sunday morning coffee", or "Gym pump".
                                        </p>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-4">
                                    <div className="p-4 rounded-2xl bg-surface-light dark:bg-surface-dark w-fit">
                                        <span className="material-symbols-outlined text-4xl text-primary">graphic_eq</span>
                                    </div>
                                    <div>
                                        <h3 className="text-foreground text-lg font-bold leading-tight">
                                            AI Curation
                                        </h3>
                                        <p className="text-muted-foreground text-sm font-normal leading-normal mt-2">
                                            Our AI analyzes your prompt and selects the perfect tracks, balancing popularity and hidden gems.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-4">
                                    <div className="p-4 rounded-2xl bg-surface-light dark:bg-surface-dark w-fit">
                                        <span className="material-symbols-outlined text-4xl text-primary">library_music</span>
                                    </div>
                                    <div>
                                        <h3 className="text-foreground text-lg font-bold leading-tight">
                                            Export to Spotify & YouTube
                                        </h3>
                                        <p className="text-muted-foreground text-sm font-normal leading-normal mt-2">
                                            Save your new playlist directly to your Spotify or YouTube library with one click.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-center py-10">
                            <Link href="/generate" className="w-full max-w-sm">
                                <button
                                    className="flex w-full max-w-sm cursor-pointer items-center justify-center overflow-hidden rounded-full h-14 px-5 bg-gradient-to-r from-primary to-secondary text-white text-base font-bold leading-normal tracking-[0.015em] hover:shadow-xl hover:shadow-primary/40 hover:scale-[1.02] transition-all"
                                >
                                    <span className="truncate">Create a Playlist Now</span>
                                </button>
                            </Link>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}

