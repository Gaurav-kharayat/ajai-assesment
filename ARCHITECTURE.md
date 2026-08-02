# Architecture note

## What I prioritized

Given a 4-6 hour box, I optimized for a **coherent, end-to-end product
loop** over depth in any single area: log in → see your docs → create/edit
one → import a file → share it → have a second user open it with the right
permissions → refresh and see it all persisted. I'd rather every piece of
that loop work correctly than have one impressive feature (e.g. real-time
co-editing) sitting next to rough edges everywhere else.

Concretely, that meant:

1. **A real data model with real permission checks**, not a UI mockup. The
   owner/edit/view distinction is enforced server-side on every API route
   (`GET`/`PUT`/`DELETE` on a document, and the share endpoints), not just
   hidden in the client. A view-only user hitting the PUT endpoint directly
   gets a 403, not just a disabled button in the UI.
2. **Isolating the two things most likely to change**: auth (`src/lib/auth.ts`)
   and permission logic (`src/lib/permissions.ts`). The latter is pure,
   dependency-free, and unit tested — it's the one piece of business logic
   in the app where a bug (e.g. a view-only user able to edit) would be a
   real product/security problem, so it's the one thing I made sure was
   independently verifiable rather than "tested by clicking around."
3. **Autosave over explicit save buttons**, because that's the mental model
   Google Docs trained everyone on, and a "Save" button that people forget
   to click is a worse failure mode for a docs product than a debounce
   timer.

## What I explicitly cut, and why

- **Real authentication.** Building password hashing, sessions, or wiring
  up an OAuth provider would have eaten a third of the time budget on
  something that isn't the point of the exercise. I used seeded users + a
  plain cookie instead, isolated behind one module so it's a swap-in, not a
  rewrite, later.
- **.docx import.** Parsing real `.docx` (a zip of XML) well enough to
  preserve formatting is its own multi-hour task. I support `.txt` and
  `.md` instead and say so clearly in the UI and README, which felt more
  honest than a half-working `.docx` importer that mangles formatting.
- **Real-time collaborative editing (OT/CRDT).** This is the single biggest
  feature Google Docs is known for, and it's also by far the most
  expensive to build correctly (conflict resolution, presence, cursors).
  Building a fake version would be worse than not attempting it. What's
  here is "shared access with last-write-wins persistence," which is an
  honest, working subset — not simultaneous co-editing.
- **Granular/enterprise ACLs** (link sharing, org-wide permissions,
  expiring invites). The spec asked for owner + grantable access +
  owned-vs-shared visibility, which is what's implemented; I didn't expand
  scope beyond that.
- **Rich activity/version history.** Documents overwrite in place. Given
  the time box, I'd rather have solid current-state persistence than a
  half-built history feature.

## If I had another day

In rough priority order: (1) Postgres + a hosted deploy instead of local
SQLite, since that's the main thing standing between this and a reviewable
public URL; (2) basic conflict handling for simultaneous edits (even just
"last save wins with a warning if the doc changed underneath you," short of
full CRDT); (3) `.docx` import via a library like `mammoth`; (4) link-based
sharing in addition to per-user email sharing; (5) document version
history / undo beyond the editor's in-session undo stack.

## Notable tradeoffs in the current code

- Document content is stored as **HTML** (TipTap's native format) rather
  than a structured JSON doc model. Simpler to persist and render, but
  means server-side content validation is limited to "did we receive a
  string" rather than schema-validating the document shape. Acceptable
  for this scope since only the two roles who already have edit access to
  a document (owner + edit-collaborators) can write to it.
- Sharing is **by exact email match against seeded users** — there's no
  invite-by-email-for-a-nonexistent-user flow, which a real product would
  need.
- SQLite is fine for a single-instance demo but doesn't handle concurrent
  writers well at scale; noted in the README as the first thing to swap
  for a real deployment.
