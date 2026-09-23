import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, isAuthConfigured, isValidSession } from "@/lib/auth";

const LOGIN_PATH = "/prihlasenie";

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (!isAuthConfigured()) {
    if (process.env.NODE_ENV !== "production") return NextResponse.next();
    return new NextResponse(
      "Appka je zamknutá: vo Verceli nastav premennú APP_PASSWORD (Settings → Environment Variables) a nasaď znova.",
      { status: 503, headers: { "Content-Type": "text/plain; charset=utf-8" } },
    );
  }

  if (pathname === LOGIN_PATH) return NextResponse.next();
  if (await isValidSession(request.cookies.get(SESSION_COOKIE)?.value)) return NextResponse.next();

  if (pathname.startsWith("/api/") || request.method !== "GET") {
    return NextResponse.json({ error: "Najprv sa prihlás." }, { status: 401 });
  }
  const login = new URL(LOGIN_PATH, request.url);
  login.searchParams.set("next", pathname + search);
  return NextResponse.redirect(login);
}

export const config = {
  // Cron has its own bearer secret; mock photos must load inside notification emails.
  matcher: ["/((?!api/cron|mock-photo|_next/static|_next/image|favicon.ico).*)"],
};
