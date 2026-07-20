import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.SITE_URL || "https://backgroundly.app"),
  title: { default: "Free Image Background Remover", template: "%s | Backgroundly" },
  description: "Remove image backgrounds online in seconds. No sign-up, no watermark, and no image storage.",
  openGraph: { title: "Free Image Background Remover", description: "Clean cutouts in one click. Free, private, and watermark-free.", type: "website", images: [{ url: "/og.png", width: 1792, height: 936, alt: "Backgroundly removes an image background in one click" }] },
  twitter: { card: "summary_large_image", title: "Free Image Background Remover", description: "Clean cutouts in one click. Free, private, and watermark-free.", images: ["/og.png"] },
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body className={`${geistSans.variable} ${geistMono.variable}`}>{children}</body></html>;
}
