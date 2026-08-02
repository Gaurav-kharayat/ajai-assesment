import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { authCookieName } from "@/lib/auth";

export async function GET() {
  // Used by the login page to populate the "log in as" list.
  const users = await prisma.user.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json({ users });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const userId = body?.userId as string | undefined;

  if (!userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const res = NextResponse.json({ user });
  res.cookies.set(authCookieName(), user.id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(authCookieName(), "", { path: "/", maxAge: 0 });
  return res;
}
