"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, SESSION_MAX_AGE, constantTimeEqual, safeNextPath, sessionToken } from "@/lib/auth";

export type LoginState = { error: string | null };

export async function login(_state: LoginState, formData: FormData): Promise<LoginState> {
  const expected = process.env.APP_PASSWORD;  const password = formData.get("password");
  if (!expected || typeof password !== "string" || !constantTimeEqual(password, expected)) {
    // Slows down guessing without affecting the real user.
    await new Promise((resolve) => setTimeout(resolve, 800));
    return { error: "Nesprávne heslo." };
  }

  (await cookies()).set(SESSION_COOKIE, await sessionToken(expected), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
  redirect(safeNextPath(formData.get("next")));
}
