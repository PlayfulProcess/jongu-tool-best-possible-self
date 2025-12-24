import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";
import { ThemeProvider } from "@/components/ThemeProvider";

export const metadata: Metadata = {
  title: "I Ching Reader | 易經",
  description: "Consult the ancient Book of Changes with AI-powered interpretation",
  keywords: ["I Ching", "Yi Jing", "Book of Changes", "divination", "oracle", "hexagram"],
  icons: {
    icon: '/Jongulogo.png',
    apple: '/Jongulogo.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className="antialiased font-sans"
        style={{
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Noto Sans", "Noto Sans SC", "Noto Sans TC", "PingFang SC", "Microsoft YaHei", sans-serif',
        }}
      >
        <ThemeProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
