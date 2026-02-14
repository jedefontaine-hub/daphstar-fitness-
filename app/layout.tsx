import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

import Providers from "@/components/Providers";
import { ServiceWorkerRegistration } from "@/components/ServiceWorkerRegistration";
import GlobalProfileButton from "@/components/GlobalProfileButton";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Daphstar Fitness",
  description: "Book fitness classes at your retirement village",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Daphstar Fitness",
  },
  icons: {
    icon: "/favicon.png",
    apple: "/icons/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#0d9488",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} antialiased bg-slate-50 text-slate-900`}
      >
        <Providers>
          {children}
          <GlobalProfileButton />
        </Providers>
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}
