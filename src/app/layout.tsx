import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";
import DiscordWidget from "@/components/DiscordWidget";
import DonateButton from "@/components/DonateButton";
import { config } from "@/lib/jongu-config";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: config.seo.title,
  description: config.seo.description,
  keywords: config.seo.keywords,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          {children}
          {config.features.discord.enabled && config.features.discord.showWidget && (
            <DiscordWidget serverId={config.features.discord.serverId} />
          )}
          {config.features.donations.enabled && (
            <div className="fixed bottom-4 left-4 z-50">
              <DonateButton 
                stripeLink={config.features.donations.stripeLink}
                buttonText={config.features.donations.buttonText}
              />
            </div>
          )}
        </AuthProvider>
      </body>
    </html>
  );
}
