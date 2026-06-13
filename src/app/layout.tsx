import type { Metadata } from "next";
import { Newsreader, Instrument_Sans } from "next/font/google";
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
    <html lang="en" className={`${newsreader.variable} ${instrumentSans.variable}`} suppressHydrationWarning>
      <body className="bg-paper-50 text-ink-600 font-ui antialiased">
        {children}
      </body>
    </html>
  );
}
