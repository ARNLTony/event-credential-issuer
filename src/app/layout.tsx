import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Event Credential Issuer",
  description:
    "Issue verifiable event attendance credentials to EUDI Wallets. Create events, share QR codes, and let attendees receive W3C Verifiable Credentials directly in their digital wallets.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen`}
      >
        <header className="border-b border-white/10">
          <nav className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
            <Link href="/" className="flex items-center gap-2">
              <Image
                src="/logo.svg"
                alt="Event Credential Issuer logo"
                width={32}
                height={32}
                className="h-8 w-8"
              />
              <span className="text-accent text-xl font-bold tracking-tight">
                ECI
              </span>
              <span className="hidden text-sm font-medium text-foreground/70 sm:inline">
                Event Credential Issuer
              </span>
            </Link>
            <div className="flex items-center gap-6">
              <Link
                href="/events/create"
                className="text-sm font-medium text-muted transition-colors hover:text-foreground"
              >
                Create Event
              </Link>
            </div>
          </nav>
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}
