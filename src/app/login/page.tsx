"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type User = { id: string; name: string; email: string };

export default function LoginPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/auth/login")
      .then((r) => r.json())
      .then((d) => setUsers(d.users ?? []))
      .catch(() => setError("Could not load users. Did you run `npm run db:seed`?"))
      .finally(() => setLoading(false));
  }, []);

  async function loginAs(userId: string) {
    setError(null);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? "Login failed");
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <div className="page" style={{ maxWidth: 440, paddingTop: 80 }}>
      <div className="brand" style={{ marginBottom: 24, fontSize: 20 }}>
        <span className="brand-badge">A</span> Ajaia Docs
      </div>
      <div className="card">
        <h3 style={{ marginTop: 0 }}>Log in as</h3>
        <p className="doc-meta" style={{ marginBottom: 16 }}>
          This demo uses seeded accounts instead of real authentication. Pick a user to
          continue.
        </p>
        {error && <div className="error-banner">{error}</div>}
        {loading && <p className="doc-meta">Loading users…</p>}
        <div className="user-pick">
          {users.map((u) => (
            <button key={u.id} onClick={() => loginAs(u.id)}>
              <div style={{ fontWeight: 600 }}>{u.name}</div>
              <div className="doc-meta">{u.email}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
