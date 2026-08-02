"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import ShareModal from "@/components/ShareModal";

// TipTap touches the DOM directly; load client-side only.
const Editor = dynamic(() => import("@/components/Editor"), { ssr: false });

type Me = { id: string; name: string; email: string };
type DocShare = { userId: string; permission: string; user: { name: string; email: string } };
type Doc = {
  id: string;
  title: string;
  content: string;
  ownerId: string;
  owner: { id: string; name: string; email: string };
  shares: DocShare[];
};

export default function DocumentPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [me, setMe] = useState<Me | null>(null);
  const [doc, setDoc] = useState<Doc | null>(null);
  const [title, setTitle] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notFoundOrForbidden, setNotFoundOrForbidden] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [shareOpen, setShareOpen] = useState(false);

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestContent = useRef<string>("");

  const load = useCallback(async () => {
    const meRes = await fetch("/api/auth/me").then((r) => r.json());
    if (!meRes.user) {
      router.push("/login");
      return;
    }
    setMe(meRes.user);

    const res = await fetch(`/api/documents/${id}`);
    if (res.status === 404) {
      setNotFoundOrForbidden("This document doesn't exist.");
      return;
    }
    if (res.status === 403) {
      setNotFoundOrForbidden("You don't have access to this document.");
      return;
    }
    const d = await res.json();
    if (!res.ok) {
      setError(d.error ?? "Failed to load document");
      return;
    }
    setDoc(d.document);
    setTitle(d.document.title);
    latestContent.current = d.document.content;
  }, [id, router]);

  useEffect(() => {
    load();
  }, [load]);

  const isOwner = !!(me && doc && me.id === doc.ownerId);
  const myShare = doc?.shares.find((s) => s.userId === me?.id);
  const canEdit = isOwner || myShare?.permission === "edit";

  function scheduleSave(patch: { title?: string; content?: string }) {
    setSaveStatus("saving");
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/documents/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(patch),
        });
        const d = await res.json();
        if (!res.ok) throw new Error(d.error ?? "Save failed");
        setSaveStatus("saved");
      } catch (e: any) {
        setError(e.message);
        setSaveStatus("idle");
      }
    }, 500);
  }

  function handleTitleChange(v: string) {
    setTitle(v);
    scheduleSave({ title: v });
  }

  function handleContentChange(html: string) {
    latestContent.current = html;
    scheduleSave({ content: html });
  }

  async function deleteDoc() {
    if (!confirm("Delete this document? This cannot be undone.")) return;
    const res = await fetch(`/api/documents/${id}`, { method: "DELETE" });
    if (res.ok) router.push("/");
  }

  if (notFoundOrForbidden) {
    return (
      <div className="page">
        <div className="error-banner">{notFoundOrForbidden}</div>
        <button onClick={() => router.push("/")}>Back to documents</button>
      </div>
    );
  }

  if (!doc || !me) return <div className="page">Loading…</div>;

  return (
    <>
      <div className="topbar">
        <button onClick={() => router.push("/")}>← Documents</button>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span className="save-status">
            {saveStatus === "saving" ? "Saving…" : saveStatus === "saved" ? "All changes saved" : ""}
          </span>
          {!canEdit && <span className="badge view">View only</span>}
          {isOwner && <button onClick={() => setShareOpen(true)}>Share</button>}
          {isOwner && (
            <button className="danger" onClick={deleteDoc}>
              Delete
            </button>
          )}
        </div>
      </div>

      <div className="page">
        {error && <div className="error-banner">{error}</div>}

        <input
          className="title-input"
          value={title}
          disabled={!canEdit}
          onChange={(e) => handleTitleChange(e.target.value)}
        />
        <div className="doc-meta" style={{ marginBottom: 12 }}>
          Owned by {doc.owner.name}
          {doc.shares.length > 0 && ` · shared with ${doc.shares.length} ${doc.shares.length === 1 ? "person" : "people"}`}
        </div>

        <Editor content={doc.content} editable={canEdit} onChange={handleContentChange} />
      </div>

      {shareOpen && (
        <ShareModal
          documentId={doc.id}
          shares={doc.shares}
          onClose={() => setShareOpen(false)}
          onChanged={load}
        />
      )}
    </>
  );
}
