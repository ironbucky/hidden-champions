import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Spectral } from "next/font/google";
import "./globals.css";
import { PwaInstallPrompt } from "@/components/PwaInstallPrompt";
import { NavBar } from "@/components/NavBar";
import { MobileTabBar } from "@/components/MobileTabBar";
import { supabaseAuthAdapter } from "@/infrastructure/supabaseAuthAdapter";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const spectral = Spectral({
  variable: "--font-spectral",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "Hidden Champions — Lahore's hidden suppliers, findable here",
  description:
    "Find unfindable Pakistani suppliers. Request what you need, or champion the hidden workshops you know.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "Hidden Champions",
  },
};

export const viewport: Viewport = {
  themeColor: "#f3ead2",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await supabaseAuthAdapter.getSession();
  const isLoggedIn = !!session.userId;

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${spectral.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <NavBar isLoggedIn={isLoggedIn} />
        {children}
        <MobileTabBar isLoggedIn={isLoggedIn} />
        <PwaInstallPrompt />
      </body>
    </html>
  );
}
