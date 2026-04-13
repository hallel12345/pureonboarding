import type { Metadata } from "next";
import { DM_Sans, Playfair_Display } from "next/font/google";
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
            <Link href="/" className="brand-mark">
              <span className="brand-dot">PP</span>
              Pure Pest Solutions
            </Link>
            <span className="brand-tag">Onboarding Portal</span>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
