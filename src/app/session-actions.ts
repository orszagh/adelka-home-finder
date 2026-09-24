"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE } from "@/lib/auth";

/** Signs this device out. No session check: signing out must always work. */
export async function logout() {
  (await cookies()).delete(SESSION_COOKIE);
  redirect("/prihlasenie");
}
