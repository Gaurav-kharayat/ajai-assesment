import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUserId } from "@/lib/auth";

export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const [owned, shared] = await Promise.all([
    prisma.document.findMany({
      where: { ownerId: userId },
      orderBy: { updatedAt: "desc" },
      include: { owner: true, shares: { include: { user: true } } },
    }),
    prisma.document.findMany({
      where: { shares: { some: { userId } } },
      orderBy: { updatedAt: "desc" },
      include: { owner: true, shares: { include: { user: true } } },
    }),
  ]);

  return NextResponse.json({ owned, shared });
}

export async function POST(req: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const title = typeof body?.title === "string" && body.title.trim() ? body.title.trim() : "Untitled document";
  const content = typeof body?.content === "string" ? body.content : "<p></p>";

  const doc = await prisma.document.create({
    data: { title, content, ownerId: userId },
  });

  return NextResponse.json({ document: doc }, { status: 201 });
}