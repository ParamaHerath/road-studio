import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Road Studio — KML Road Network Editor",
  description:
    "Desktop-first web application for reviewing, selecting, combining, and editing KML road networks.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`dark h-full ${inter.variable}`}>
      <body className={`${inter.className} font-sans h-full bg-black text-zinc-100 antialiased overflow-hidden`}>
        {children}
      </body>
    </html>
  );
}
