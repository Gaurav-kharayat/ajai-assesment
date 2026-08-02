"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Doc = {
  id: string;
  title: string;
  updatedAt: string;
  ownerId: string;
  owner: { name: string; email: string };
  shares: { userId: string; permission: string; user: { name: string; email: string } }[];
};
type Me = { id: string; name: string; email: string };

function formatDate(d: string) {
  return new Date(d).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function Dashboard() {
  const [me, setMe] = useState<Me | null>(null);
  const [owned, setOwned] = useState<Doc[]>([]);
  const [shared, setShared] = useState<Doc[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const router = useRouter();

  async function loadAll() {
    const meRes = await fetch("/api/auth/me").then((r) => r.json());
    if (!meRes.user) {
      router.push("/login");
      return;
    }
    setMe(meRes.user);

    const docsRes = await fetch("/api/documents");
    if (docsRes.ok) {
      const d = await docsRes.json();
      setOwned(d.owned ?? []);
      setShared(d.shared ?? []);
    }
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function createDoc() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Untitled document" }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? "Could not create document");
      router.push(`/documents/${d.document.id}`);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: form });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? "Upload failed");
      router.push(`/documents/${d.document.id}`);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  }

  async function logout() {
    await fetch("/api/auth/login", { method: "DELETE" });
    router.push("/login");
  }

  if (!me) return <div className="page">Loading…</div>;

  return (
    <>
      <div className="topbar">
        <div className="brand">
          <span className="brand-badge">A</span> Ajaia Docs
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span className="doc-meta">
            {me.name} · {me.email}
          </span>
          <button onClick={logout}>Switch user</button>
        </div>
      </div>

      <div className="page">
        {error && <div className="error-banner">{error}</div>}

        <div style={{ display: "flex", gap: 10 }}>
          <button className="primary" onClick={createDoc} disabled={busy}>
            + New document
          </button>
          <button onClick={() => fileInput.current?.click()} disabled={busy}>
            Upload .txt / .md
          </button>
          <input
            ref={fileInput}
            type="file"
            accept=".txt,.md"
            style={{ display: "none" }}
            onChange={handleUpload}
          />
        </div>

        <div className="section-title">My documents</div>
        {owned.length === 0 && <p className="doc-meta">No documents yet — create one above.</p>}
        <div className="doc-grid">
          {owned.map((doc) => (
            <div key={doc.id} className="doc-tile" onClick={() => router.push(`/documents/${doc.id}`)}>
              <span className="badge owner">Owned by you</span>
              <div className="doc-title">{doc.title}</div>
              <div className="doc-meta">
                Updated {formatDate(doc.updatedAt)}
                {doc.shares.length > 0 && ` · shared with ${doc.shares.length}`}
              </div>
            </div>
          ))}
        </div>

        <div className="section-title">Shared with me</div>
        {shared.length === 0 && <p className="doc-meta">Nothing has been shared with you yet.</p>}
        <div className="doc-grid">
          {shared.map((doc) => {
            const myShare = doc.shares.find((s) => s.userId === me.id);
            return (
              <div key={doc.id} className="doc-tile" onClick={() => router.push(`/documents/${doc.id}`)}>
                <span className={`badge shared`}>Shared by {doc.owner.name}</span>
                <div className="doc-title">{doc.title}</div>
                <div className="doc-meta">
                  Updated {formatDate(doc.updatedAt)} · {myShare?.permission === "view" ? "view only" : "can edit"}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
