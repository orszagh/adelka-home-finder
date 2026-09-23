import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin", "latin-ext"],
});

export const metadata: Metadata = {
  title: "Adelka · Domček pri mori",
  description: "Hľadanie domčeka pri mori v Taliansku",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0e7490",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="sk" className={`${geistSans.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <header className="sticky top-0 z-[1000] border-b border-slate-200 bg-white/95 backdrop-blur">
          <nav className="mx-auto flex max-w-screen-2xl items-center gap-4 px-4 py-3">
            <Link href="/" className="mr-auto flex items-center gap-2 font-semibold text-sea-800">
              <span aria-hidden className="text-xl">🏖️</span>
              <span>Domček pri mori</span>
            </Link>
            <Link href="/" className="rounded-full px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100">
              Ponuky
            </Link>
            <Link href="/ulozene" className="rounded-full px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100">
              Uložené
            </Link>
          </nav>
        </header>
        {children}
      </body>
    </html>
  );
}
