import { describe, expect, it, vi } from "vitest";
import { SESSION_COOKIE } from "@/lib/auth";

const deleteCookie = vi.fn();
vi.mock("next/headers", () => ({ cookies: async () => ({ delete: deleteCookie }) }));
const redirect = vi.fn();
vi.mock("next/navigation", () => ({ redirect: (to: string) => redirect(to) }));

const { logout } = await import("./session-actions");

describe("logout", () => {
  it("forgets the session and goes to the login page", async () => {
    await logout();
    expect(deleteCookie).toHaveBeenCalledWith(SESSION_COOKIE);
    expect(redirect).toHaveBeenCalledWith("/prihlasenie");
  });
});
