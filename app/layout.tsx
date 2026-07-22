import type { Metadata } from "next";
import { Hanken_Grotesk, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { EnvironmentProvider } from "@/context/EnvironmentContext";
import { LastRequestProvider } from "@/context/LastRequestContext";
import { DevOptionsProvider } from "@/context/DevOptionsContext";
import { AccessGate } from "@/components/AccessGate";
import LastRequestBadge from "@/components/LastRequestBadge";

const hanken = Hanken_Grotesk({
  subsets: ["latin"],
  weight: ["400", "700", "800"],
  variable: "--font-hanken",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-inter",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "BLOOM DC | CORE_OS v2.4",
  description: "Bloom Data Center control interface",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${hanken.variable} ${inter.variable} ${mono.variable}`}>
      <head>
        {/* Material Symbols is icon-font based, not covered by next/font, so it stays a normal stylesheet link */}
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=block"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased overflow-hidden">
        {/* EnvironmentProvider is the preserved global store (env, ESP IPs, live status). */}
        <EnvironmentProvider>
          {/* DevOptionsProvider holds UI-only options like "send real request in SIM". */}
          <DevOptionsProvider>
            {/* LastRequestProvider tracks the most recent control URL for the on-screen badge. */}
            <LastRequestProvider>
              {/* AccessGate is the Bloom-styled 2FA entrance; it renders children once unlocked. */}
              <AccessGate>{children}</AccessGate>
              {/* Corner badge showing the exact URL each control sends (sits below the gate). */}
              <LastRequestBadge />
            </LastRequestProvider>
          </DevOptionsProvider>
        </EnvironmentProvider>
      </body>
    </html>
  );
}
