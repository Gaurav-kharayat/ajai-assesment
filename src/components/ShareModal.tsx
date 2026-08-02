"use client";

import { useState } from "react";

type ShareEntry = { userId: string; permission: string; user: { name: string; email: string } };

export default function ShareModal({
  documentId,
  shares,
  onClose,
  onChanged,
}: {
  documentId: string;
  shares: ShareEntry[];
  onClose: () => void;
  onChanged: () => void;
}) {
  const [email, setEmail] = useState("");
  const [permission, setPermission] = useState<"edit" | "view">("edit");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function share() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/documents/${documentId}/share`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, permission }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? "Could not share document");
      setEmail("");
      onChanged();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function revoke(userId: string) {
    await fetch(`/api/documents/${documentId}/share?userId=${userId}`, { method: "DELETE" });
    onChanged();
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>Share document</h3>
        {error && <div className="error-banner">{error}</div>}
        <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
          <input
            type="email"
            placeholder="person@ajaia.dev"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <select
            value={permission}
            onChange={(e) => setPermission(e.target.value as "edit" | "view")}
            style={{ borderRadius: 8, border: "1px solid var(--border)" }}
          >
            <option value="edit">Can edit</option>
            <option value="view">Can view</option>
          </select>
          <button className="primary" onClick={share} disabled={busy || !email}>
            Share
          </button>
        </div>

        <div className="section-title" style={{ marginTop: 16 }}>
          People with access
        </div>
        {shares.length === 0 && <p className="doc-meta">Not shared with anyone yet.</p>}
        {shares.map((s) => (
          <div key={s.userId} className="share-row">
            <div>
              <div>{s.user.name}</div>
              <div className="doc-meta">{s.user.email}</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span className={`badge ${s.permission === "view" ? "view" : "shared"}`}>
                {s.permission === "view" ? "Can view" : "Can edit"}
              </span>
              <button className="danger" onClick={() => revoke(s.userId)}>
                Remove
              </button>
            </div>
          </div>
        ))}

        <div style={{ textAlign: "right", marginTop: 16 }}>
          <button onClick={onClose}>Done</button>
        </div>
      </div>
    </div>
  );
}
