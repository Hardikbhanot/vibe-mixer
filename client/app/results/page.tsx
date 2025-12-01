"use client";

import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function ResultsPage() {
    return (
        <div className="relative flex h-auto min-h-screen w-full flex-col group/design-root overflow-x-hidden antialiased">
            {/* Top App Bar */}
            <header className="flex items-center p-4 pb-2 justify-between sticky top-0 z-10 bg-background-light dark:bg-background-dark/80 backdrop-blur-sm">
                <Link
                    href="/generate"
                    className="text-white flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-white/10 transition-colors"
                >
                    <span className="material-symbols-outlined text-2xl">arrow_back</span>
                </Link>
                <h1 className="text-white text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center">
                    VibeMixer
                </h1>
                <div className="flex size-10 shrink-0 items-center justify-end">
                    <ThemeToggle />
                </div>
            </header>

            <main className="flex-1 px-4 py-6 max-w-xl mx-auto w-full">
                {/* Headline Text */}
                <div className="text-center pb-8">
                    <h2 className="text-white tracking-light text-[32px] font-bold leading-tight">
                        Your Vibe is Ready!
                    </h2>
                </div>

                <div className="flex flex-col gap-6">
                    {/* Spotify Card */}
                    <div className="flex flex-col items-stretch justify-start rounded-xl bg-white/5 p-4">
                        <div
                            className="w-full bg-center bg-no-repeat aspect-square bg-cover rounded-lg mb-4"
                            style={{
                                backgroundImage:
                                    'url("https://lh3.googleusercontent.com/aida-public/AB6AXuCj3u29lXI-vpHKt_Jnjc9iRuQE7bKzWJuErl3rpCR0ATOmpLk9Eq-Yfkp3l0Xf6fVDtFb3PvEyTd40yfRQ5IClgkx_FIDzlH0u9CLBouv6t0vHP5D_-1zkO5KeciFKB6QqrQSjjxQLF_xJGG38yD5PKoX55oapoJXKfJgviHYbBHEeAwcKf8jg3RfX4bp-Dt9zlmJ8blguw7XepZu9e_ss1sm0YKszbiz3DzBeAOTvuPG2qc5nIz_vz0LX7X1CbW_kilaRV9JxlWPR")',
                            }}
                        ></div>
                        <div className="flex w-full min-w-72 grow flex-col items-stretch justify-center gap-2">
                            <p className="text-white text-xl font-bold leading-tight tracking-[-0.015em]">
                                Spotify Playlist
                            </p>
                            <p className="text-neutral-400 text-base font-normal leading-normal">
                                20 Calm Focus Tracks
                            </p>
                            <button className="flex mt-2 min-w-[84px] max-w-[480px] w-full cursor-pointer items-center justify-center overflow-hidden rounded-full h-12 px-4 bg-spotify text-white text-base font-bold leading-normal tracking-wide transition-transform hover:scale-105">
                                <span className="truncate">Open in Spotify</span>
                            </button>
                        </div>
                    </div>

                    {/* YouTube Card */}
                    <div className="flex flex-col items-stretch justify-start rounded-xl bg-white/5 p-4">
                        <div
                            className="w-full bg-center bg-no-repeat aspect-square bg-cover rounded-lg mb-4"
                            style={{
                                backgroundImage:
                                    'url("https://lh3.googleusercontent.com/aida-public/AB6AXuD6LUSKJ00ffdejWKtcEJg6i9JY2WX_l35hPv3ReFabiSnN_NZZoMfrOczzuAW9770ahAtV0Tq2ZAwaeRSwS82HT8jlDQRgKQmRfHCHKXRJl9Da-_VifINMddMfIdi1zoM-6LpxBprK-K5ty7g6JkQSGWJyW2oI3wxRlCZRsZM6HGpab3QMbUgT3I7eQBMfmGsveekv_YY9VxNH1JgzzM8a-tg15IWRZD2Q7ZikU4gQNnvZjX6__JbJyR9sI-FV3a6rtUIAQ-tHnHpI")',
                            }}
                        ></div>
                        <div className="flex w-full min-w-72 grow flex-col items-stretch justify-center gap-2">
                            <p className="text-white text-xl font-bold leading-tight tracking-[-0.015em]">
                                YouTube Playlist
                            </p>
                            <p className="text-neutral-400 text-base font-normal leading-normal">
                                A curated video playlist for focus
                            </p>
                            <button className="flex mt-2 min-w-[84px] max-w-[480px] w-full cursor-pointer items-center justify-center overflow-hidden rounded-full h-12 px-4 bg-youtube text-white text-base font-bold leading-normal tracking-wide transition-transform hover:scale-105">
                                <span className="truncate">Watch on YouTube</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Optional AI Cover Art Grid */}
                <div className="mt-12">
                    <h3 className="text-neutral-300 text-lg font-bold text-center mb-4">
                        AI Generated Cover Art
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-3 items-center">
                            <div
                                className="w-full bg-center bg-no-repeat aspect-square bg-cover rounded-lg"
                                style={{
                                    backgroundImage:
                                        'url("https://lh3.googleusercontent.com/aida-public/AB6AXuDO6ZTZWWM6wmqtQ2nnYnltbyxUN8pbw9SVHGux_d6qOF_d77vZDED6s7wOsxcVfXIldBGUv8311vq3VmEz7VDEf4EUyczKz5MMNfRClhIiGQytolQuUylUaUsvx13p9YYlJP7oPOPnj8td_Jn_vysk-mYp5mpmP_FwFN1UItpe0TgSZ0gcfkpWQFJc27Xf4xZXOrXxVqYgwgZ1VAGErjD3T20ku7BIzNftPSWjsOtgPpMUuRIRbcz4aw6rgNOJPNiMVhBiVFKdlFea")',
                                }}
                            ></div>
                            <button className="flex items-center gap-2 text-neutral-400 hover:text-white transition-colors">
                                <span className="material-symbols-outlined text-lg">
                                    download
                                </span>
                                <span className="text-sm">Download</span>
                            </button>
                        </div>
                        <div className="flex flex-col gap-3 items-center">
                            <div
                                className="w-full bg-center bg-no-repeat aspect-square bg-cover rounded-lg"
                                style={{
                                    backgroundImage:
                                        'url("https://lh3.googleusercontent.com/aida-public/AB6AXuAyFdPfHN3Aq3FpPUSz-m8q3I4pnh2M8iUAITGnePfAkira4RGug-EG-L4FRSDGd30BrioDeVTzLUER3LZfP1F72TM1HRwMctyMrM9fJ9EnNn_E6mR8Ys19yi4YLK1T8k90dwaCTrOrmRQU7_ZSg2JPpVPPld6tTZgxq3Vh0zFcaRhFgiUX9EZLU02MaYH9tSwrR6UHMcbiCjYjDamrhBJOk7e90CU6dXrarUJlJHOn0wMYft1ouvPSQ2_KA4cfl6w887oQhnMKvI_W")',
                                }}
                            ></div>
                            <button className="flex items-center gap-2 text-neutral-400 hover:text-white transition-colors">
                                <span className="material-symbols-outlined text-lg">
                                    download
                                </span>
                                <span className="text-sm">Download</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* New Vibe Button */}
                <div className="pt-12 pb-6 text-center">
                    <Link
                        href="/generate"
                        className="cursor-pointer text-vibemixer-purple text-base font-bold leading-normal tracking-wide hover:underline"
                    >
                        Generate a new Vibe
                    </Link>
                </div>
            </main>
        </div>
    );
}
