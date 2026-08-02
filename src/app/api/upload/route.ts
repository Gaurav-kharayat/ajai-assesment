import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUserId } from "@/lib/auth";

const MAX_SIZE_BYTES = 1_000_000; // 1MB
const ALLOWED_EXTENSIONS = [".txt", ".md"];

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// Deliberately small markdown -> HTML converter. Only covers the subset
// that maps cleanly onto our TipTap document model (headings, bold,
// italic, bullet lists, paragraphs). Not a general-purpose parser -
// see README for the stated file-type/formatting limits.
function markdownToHtml(md: string): string {
  const lines = md.replace(/\r\n/g, "\n").split("\n");
  const html: string[] = [];
  let inList = false;

  const inline = (text: string) =>
    escapeHtml(text)
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.+?)\*/g, "<em>$1</em>");

  for (const rawLine of lines) {
    const line = rawLine.trim();
    const heading = /^(#{1,3})\s+(.*)$/.exec(line);
    const listItem = /^[-*]\s+(.*)$/.exec(line);

    if (listItem) {
      if (!inList) {
        html.push("<ul>");
        inList = true;
      }
      html.push(`<li>${inline(listItem[1])}</li>`);
      continue;
    }
    if (inList) {
      html.push("</ul>");
      inList = false;
    }

    if (heading) {
      const level = heading[1].length;
      html.push(`<h${level}>${inline(heading[2])}</h${level}>`);
    } else if (line.length === 0) {
      // blank line -> paragraph break, skip
    } else {
      html.push(`<p>${inline(line)}</p>`);
    }
  }
  if (inList) html.push("</ul>");

  return html.join("") || "<p></p>";
}

function plainTextToHtml(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .split("\n")
    .filter((l) => l.length > 0)
    .map((l) => `<p>${escapeHtml(l)}</p>`)
    .join("") || "<p></p>";
}

export async function POST(req: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");

  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }
  if (file.size === 0) {
    return NextResponse.json({ error: "File is empty" }, { status: 400 });
  }
  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json({ error: "File exceeds 1MB limit" }, { status: 400 });
  }

  const name = file.name || "upload.txt";
  const ext = name.slice(name.lastIndexOf(".")).toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return NextResponse.json(
      { error: `Unsupported file type "${ext}". Only .txt and .md are supported.` },
      { status: 400 }
    );
  }

  const text = await file.text();
  const content = ext === ".md" ? markdownToHtml(text) : plainTextToHtml(text);
  const title = name.replace(/\.[^.]+$/, "") || "Imported document";

  const doc = await prisma.document.create({
    data: { title, content, ownerId: userId },
  });

  return NextResponse.json({ document: doc }, { status: 201 });
}
