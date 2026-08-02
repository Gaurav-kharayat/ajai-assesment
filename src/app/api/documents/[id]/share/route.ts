import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUserId } from "@/lib/auth";
import { canManageSharing } from "@/lib/permissions";

async function loadDoc(id: string) {
  return prisma.document.findUnique({
    where: { id },
    include: { shares: true },
  });
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const doc = await loadDoc(params.id);
  if (!doc) return NextResponse.json({ error: "Document not found" }, { status: 404 });
  if (!canManageSharing(doc, userId)) {
    return NextResponse.json({ error: "Only the owner can share this document" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const email = body?.email as string | undefined;
  const permission = body?.permission === "view" ? "view" : "edit";

  if (!email) return NextResponse.json({ error: "email is required" }, { status: 400 });

  const targetUser = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
  if (!targetUser) {
    return NextResponse.json({ error: "No user with that email exists" }, { status: 404 });
  }
  if (targetUser.id === doc.ownerId) {
    return NextResponse.json({ error: "This user already owns the document" }, { status: 400 });
  }

  const share = await prisma.documentShare.upsert({
    where: { documentId_userId: { documentId: doc.id, userId: targetUser.id } },
    update: { permission },
    create: { documentId: doc.id, userId: targetUser.id, permission },
    include: { user: true },
  });

  return NextResponse.json({ share }, { status: 201 });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const doc = await loadDoc(params.id);
  if (!doc) return NextResponse.json({ error: "Document not found" }, { status: 404 });
  if (!canManageSharing(doc, userId)) {
    return NextResponse.json({ error: "Only the owner can modify sharing" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const shareUserId = searchParams.get("userId");
  if (!shareUserId) return NextResponse.json({ error: "userId query param required" }, { status: 400 });

  await prisma.documentShare.deleteMany({ where: { documentId: doc.id, userId: shareUserId } });
  return NextResponse.json({ ok: true });
}
