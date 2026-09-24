"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { THEME_COOKIE, THEME_MAX_AGE, parseTheme } from "@/lib/theme";

/** Not behind the session: the theme is not sensitive and applies on the login page too. */
export async function setTheme(value: unknown) {
  const theme = parseTheme(value);
  (await cookies()).set(THEME_COOKIE, theme, {
    sameSite: "lax",
    path: "/",
    maxAge: THEME_MAX_AGE,
    secure: process.env.NODE_ENV === "production",
  });
  revalidatePath("/", "layout");
}
