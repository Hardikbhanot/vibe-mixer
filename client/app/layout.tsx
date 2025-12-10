import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";
import { DomainRedirect } from "@/components/DomainRedirect";
// 1. Import the GA Component
import { GoogleAnalytics } from '@next/third-parties/google';
import { Toaster } from "sonner";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

import { AuthProvider } from "@/context/AuthContext";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: "VibeMixer - Your AI Playlist Generator",
  description: "Let our AI curate the perfect playlist from Spotify and YouTube based on how you feel right now.",
  keywords: ["AI playlist generator", "Spotify playlist maker", "mood to music", "vibe mixer", "music recommendation", "YouTube playlist creator", "Indian vibe map", "music discovery"],
  authors: [{ name: "Hardik Bhanot" }],
  robots: "index, follow",
  openGraph: {
    title: "VibeMixer - AI Playlist Generator",
    description: "Turn your mood into a Spotify & YouTube playlist instantly.",
    url: "https://vibemixer.hbhanot.tech",
    siteName: "VibeMixer",
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: "VibeMixer Preview" }],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "VibeMixer - AI Playlist Generator",
    description: "Turn your mood into a Spotify & YouTube playlist instantly.",
    images: ['/og-image.png'],
  },
};

// ... imports

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" rel="stylesheet" />
      </head>
      <body
        className={`${spaceGrotesk.variable} font-display antialiased bg-background-light dark:bg-background-dark text-gray-900 dark:text-white transition-colors duration-300 flex flex-col min-h-screen`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <DomainRedirect />
            {children}
            <Footer />
            <Toaster position="top-center" richColors />
          </AuthProvider>
        </ThemeProvider>
      </body>
      {/* 2. Add Google Analytics with your ID */}
      <GoogleAnalytics gaId="G-4H7R4JH136" />
    </html>
  );
}
