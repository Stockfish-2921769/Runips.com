import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { AuthProvider } from "@/components/AuthProvider";
import { LanguageProvider } from "@/i18n/LanguageProvider";
import ReleaseNotice from '@/components/ReleaseNotice';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "RunIPS — Waseda IPS Student Guide",
  description: "An unofficial Waseda University IPS guide for supervisor ratings, lab experiences, student reviews, and durable Community topics.",
};

// The API lives on its own subdomain, so the browser cannot discover it from
// the HTML — it only learns the origin exists once React has hydrated and the
// first query fires. That puts a full DNS + TCP + TLS handshake (~270ms from
// East Asia) on the critical path *after* the JS has already downloaded.
// Preconnecting starts that handshake while the HTML is still parsing, in
// parallel with fetching the bundle, so the first query pays one round trip
// instead of four.
const API_ORIGIN = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').origin;
  } catch {
    // No configured API at build time (local checkout without env): emit
    // nothing rather than a broken hint.
    return '';
  }
})();

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-CN"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        {API_ORIGIN && (
          <>
            <link rel="preconnect" href={API_ORIGIN} crossOrigin="anonymous" />
            {/* Falls back to at least resolving the name on browsers that
                ignore or drop the preconnect hint. */}
            <link rel="dns-prefetch" href={API_ORIGIN} />
          </>
        )}
      </head>
      <body className="min-h-full flex flex-col">
        <LanguageProvider>
          <AuthProvider>
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
            <ReleaseNotice />
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
