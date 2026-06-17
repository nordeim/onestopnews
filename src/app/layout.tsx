import type { Metadata } from "next";
import { Newsreader, Instrument_Sans } from "next/font/google";
import localFont from "next/font/local";
import { RevealProvider } from "@/shared/components/providers/RevealProvider";
import "./globals.css";

const newsreader = Newsreader({
  variable: "--font-editorial",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const instrumentSans = Instrument_Sans({
  variable: "--font-ui",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const commitMono = localFont({
  src: "../../public/fonts/commit-mono-400.woff2",
  variable: "--font-mono",
  weight: "400",
  style: "normal",
  display: "swap",
});

export const metadata: Metadata = {
  title: { template: "%s — OneStopNews", default: "OneStopNews — Your Briefing Room" },
  description:
    "Topic-first news aggregation with source-cited AI summaries. Every story, organized by what it's about — not who published it.",
  metadataBase: new URL("http://localhost:3000"),
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${newsreader.variable} ${instrumentSans.variable} ${commitMono.variable}`} suppressHydrationWarning>
      <body className="bg-paper-50 text-ink-600 font-ui antialiased">
        <RevealProvider>
          {children}
        </RevealProvider>
      </body>
    </html>
  );
}
