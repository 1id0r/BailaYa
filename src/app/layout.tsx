import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from './providers';
import Navigation from '@/components/Navigation';
import PWAInstallBanner from '@/components/PWAInstallBanner';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BailaCheck - Latin Dance Events",
  description: "Discover and check-in to Latin dance events in your area",
  keywords: ["latin dance", "salsa", "bachata", "merengue", "events", "dance community"],
  authors: [{ name: "BailaCheck Team" }],
  creator: "BailaCheck",
  publisher: "BailaCheck",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "BailaCheck",
  },
  applicationName: "BailaCheck",
  icons: {
    icon: [
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  openGraph: {
    title: "BailaCheck - Latin Dance Events",
    description: "Discover and check-in to Latin dance events in your area",
    type: "website",
    url: "https://bailacheck.app", // Replace with your domain
    siteName: "BailaCheck",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "BailaCheck - Latin Dance Events"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "BailaCheck - Latin Dance Events",
    description: "Discover and check-in to Latin dance events in your area",
    images: ["/twitter-image.png"],
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    viewportFit: "cover"
  },
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#8b5cf6" },
    { media: "(prefers-color-scheme: dark)", color: "#8b5cf6" }
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased h-full bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100`}
      >
        <Providers>
          <Navigation />
          {children}
          <PWAInstallBanner />
        </Providers>
      </body>
    </html>
  );
}
