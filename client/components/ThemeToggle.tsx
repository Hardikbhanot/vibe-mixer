"use client";

import * as React from "react";
import { useTheme } from "next-themes";

export function ThemeToggle() {
    const { setTheme, theme } = useTheme();
    const [mounted, setMounted] = React.useState(false);

    React.useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return (
            <button className="flex items-center justify-center size-10 rounded-full bg-white/10 text-white/60">
                <span className="material-symbols-outlined text-xl">dark_mode</span>
            </button>
        );
    }

    return (
        <button
            onClick={() => {
                console.log("Theme toggled", theme);
                setTheme(theme === "dark" ? "light" : "dark");
            }}
            className="flex items-center justify-center size-10 rounded-full hover:bg-white/10 transition-colors text-white/60 hover:text-white"
            title="Toggle theme"
        >
            <span className="material-symbols-outlined text-xl">
                {theme === "dark" ? "light_mode" : "dark_mode"}
            </span>
        </button>
    );
}
