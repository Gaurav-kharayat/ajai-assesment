import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUserId } from "@/lib/auth";
import { canEdit, canView } from "@/lib/permissions";

async function loadDoc(id: string) {
  return prisma.document.findUnique({
    where: { id },
    include: { owner: true, shares: { include: { user: true } } },
  });
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const doc = await loadDoc(params.id);
  if (!doc) return NextResponse.json({ error: "Document not found" }, { status: 404 });
  if (!canView(doc, userId)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  return NextResponse.json({ document: doc });
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const doc = await loadDoc(params.id);
  if (!doc) return NextResponse.json({ error: "Document not found" }, { status: 404 });
  if (!canEdit(doc, userId)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => null);
  if (!body || (body.title === undefined && body.content === undefined)) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  if (body.title !== undefined && !String(body.title).trim()) {
    return NextResponse.json({ error: "Title cannot be empty" }, { status: 400 });
  }

  const updated = await prisma.document.update({
    where: { id: params.id },
    data: {
      ...(body.title !== undefined ? { title: String(body.title).trim() } : {}),
      ...(body.content !== undefined ? { content: String(body.content) } : {}),
    },
  });

  return NextResponse.json({ document: updated });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const doc = await loadDoc(params.id);
  if (!doc) return NextResponse.json({ error: "Document not found" }, { status: 404 });
  if (doc.ownerId !== userId) {
    return NextResponse.json({ error: "Only the owner can delete this document" }, { status: 403 });
  }

  await prisma.document.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
