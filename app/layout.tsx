import type { Metadata } from "next";
import { Outfit, JetBrains_Mono, Rajdhani } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "./components/ThemeProvider";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  display: 'swap',
});

const rajdhani = Rajdhani({
  variable: "--font-rajdhani",
  weight: ['500', '600', '700'],
  subsets: ["latin"],
  display: 'swap',
});

export const metadata: Metadata = {
  title: "WORKTRACE ",
  description: "Advanced Operational Dashboard",
  icons: {
    icon: '/logo.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="dark">
      <body
        className={`${outfit.variable} ${jetbrainsMono.variable} ${rajdhani.variable} antialiased bg-[#050505] text-white`}
      >
        <div className="fixed inset-0 bg-grid opacity-20 pointer-events-none z-0"></div>
        <div className="scanlines"></div>
        <div className="scanline-bar"></div>

        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
