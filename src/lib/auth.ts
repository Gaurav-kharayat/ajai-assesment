import { cookies } from "next/headers";
import { prisma } from "./db";

const COOKIE_NAME = "ajaia_user_id";

// This app uses seeded users + a plain cookie instead of real auth
// (password/OAuth). That's an explicit scope cut - see ARCHITECTURE.md.
// It's isolated to this one file so swapping in real auth later only
// means changing getCurrentUser()/login()/logout().

export async function getCurrentUserId(): Promise<string | null> {
  const store = cookies();
  return store.get(COOKIE_NAME)?.value ?? null;
}

export async function getCurrentUser() {
  const id = await getCurrentUserId();
  if (!id) return null;
  return prisma.user.findUnique({ where: { id } });
}

export function authCookieName() {
  return COOKIE_NAME;
}
