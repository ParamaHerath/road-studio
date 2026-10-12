import type { Metadata } from "next";
import "./globals.css";

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
    <html lang="en" className="dark h-full">
      <body className="h-full bg-slate-950 text-slate-100 antialiased overflow-hidden">
        {children}
      </body>
    </html>
  );
}
