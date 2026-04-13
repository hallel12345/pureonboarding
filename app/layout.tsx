import type { Metadata } from "next";
import { DM_Sans, Playfair_Display } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Pure Pest Onboarding Portal",
  description: "Employee and technician onboarding portal for Pure Pest Solutions",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${dmSans.variable} ${playfair.variable}`}>
      <body>
        <header className="brand-bar">
          <div className="brand-bar-inner">
            <Link href="/" className="brand-mark" aria-label="Pure Pest Solutions home">
              <Image
                src="/logo-pure-pest.jpg"
                alt="Pure Pest Solutions"
                width={500}
                height={156}
                priority
                className="brand-logo"
              />
            </Link>
            <span className="brand-tag">
              <span className="brand-tag-accent" aria-hidden />
              Onboarding Portal
            </span>
          </div>
        </header>
        {children}
        <footer className="site-footer">
          <div className="site-footer-inner">
            <span>&copy; {new Date().getFullYear()} Pure Pest Solutions</span>
            <span className="muted small">Secure onboarding &middot; Encrypted uploads</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
