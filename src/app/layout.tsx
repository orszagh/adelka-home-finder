import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import { cookies } from "next/headers";
import Link from "next/link";
import { AppMenu } from "@/components/AppMenu";
import { getRepo } from "@/lib/db/repo";
import { formatSearchSettings, getSearchSettings } from "@/lib/search-settings";
import { hasSession } from "@/lib/session";
import { THEME_COOKIE, parseTheme } from "@/lib/theme";
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
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fbf6ee" },
    { media: "(prefers-color-scheme: dark)", color: "#0e1a21" },
  ],
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const theme = parseTheme((await cookies()).get(THEME_COOKIE)?.value);
  const menu = (await hasSession()) ? await menuData() : null;
  return (
    <html
      lang="sk"
      data-theme={theme === "system" ? undefined : theme}
      className={`${geistSans.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <header className="sticky top-0 z-[1000] border-b border-line bg-canvas">
          <div className="mx-auto flex max-w-screen-2xl items-center gap-4 px-4 py-2.5">
            <Link href="/" className="mr-auto flex min-h-11 items-center gap-2 font-semibold text-accent-ink">
              <span aria-hidden className="text-xl">🏖️</span>
              <span>Domček pri mori</span>
            </Link>
            {menu && <AppMenu savedCount={menu.savedCount} settingsLabel={menu.settingsLabel} theme={theme} />}
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}

/** What the menu shows next to its links; only for a signed-in Adelka. */
async function menuData() {
  const repo = getRepo();
  const [saved, settings] = await Promise.all([repo.listSaved(), getSearchSettings(repo)]);
  return { savedCount: saved.length, settingsLabel: formatSearchSettings(settings) };
}
