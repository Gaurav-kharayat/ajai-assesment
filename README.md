# Ajaia Docs

A lightweight collaborative document editor: create/edit rich-text documents,
import `.txt`/`.md` files, share documents between users, and persist
everything in SQLite. Built with Next.js (App Router), Prisma, and TipTap.

## Stack

- **Framework:** Next.js 14 (App Router, API routes)
- **Editor:** TipTap (ProseMirror) — bold/italic/underline, H1-H3 headings,
  bullet/numbered lists
- **DB:** SQLite via Prisma (swap `DATABASE_URL` for Postgres with no schema
  changes if you want to deploy on Supabase/Neon/etc.)
- **Auth:** mocked — see "Auth model" below
- **Tests:** Vitest

## Setup & run

```bash
npm install
npm run setup      # creates the SQLite DB and seeds 3 demo users + 1 sample doc
npm run dev         # http://localhost:3000
```

You'll land on a login screen listing the seeded users. Pick one to continue.
No password is required — see "Auth model" below for why.

Seeded accounts (from `prisma/seed.ts`):
- `amara@ajaia.dev` — owns a sample document, shared with Ben (can edit)
- `ben@ajaia.dev`
- `chidi@ajaia.dev`

Open the app in two browser profiles (or one normal + one incognito window)
logged in as different users to see sharing in action.

## Run tests

```bash
npm test
```

Covers the permission logic (`src/lib/permissions.ts`) that decides who can
view, edit, or manage sharing on a document — owner / edit-collaborator /
view-only-collaborator / no-access, including the null-user case.

## Features

**Document creation & editing** — create a doc, rename it inline, edit rich
text (bold, italic, underline, H1/H2, paragraph, bulleted/numbered lists).
Content autosaves ~500ms after you stop typing; title autosaves on change.
Reopening a document loads the last saved HTML content.

**File upload** — upload a `.txt` or `.md` file from the dashboard to create
a new document from it. **Only `.txt` and `.md` are supported** (stated in
the UI's file picker and enforced server-side); `.docx` was cut for scope
reasons (see ARCHITECTURE.md). Markdown import supports `#`/`##`/`###`
headings, `**bold**`, `*italic*`, and `-`/`*` bullet lists — it's a small
hand-written converter, not a full CommonMark parser. Max file size 1MB.

**Sharing** — the document owner can share with any other seeded user by
email, at "can edit" or "can view" permission, and revoke access. The
dashboard visually separates "My documents" from "Shared with me", and a
shared document shows who owns it and whether you have edit or view-only
access. View-only users see a disabled editor and no title/share/delete
controls.

**Persistence** — SQLite database (`prisma/dev.db`) via Prisma. Documents,
users, and shares all persist across refreshes and restarts.

## Auth model (read this before judging the login flow)

There's no real authentication — you pick a seeded user from a list, and a
plain `httpOnly` cookie remembers that choice. This was a deliberate scope
cut: the assignment is about documents/editing/sharing/upload, not building
a secure auth system in a 4-6 hour window. All auth logic is isolated in
`src/lib/auth.ts`, so swapping in real sessions (NextAuth, Clerk, etc.) later
only means changing that one file and the login route — nothing else in the
app assumes anything about *how* `userId` was established.

## Project structure

```
prisma/schema.prisma        User / Document / DocumentShare models
prisma/seed.ts               demo users + sample document
src/lib/permissions.ts       pure access-control logic (unit tested)
src/lib/auth.ts              mock-auth cookie helpers
src/lib/db.ts                Prisma client singleton
src/app/api/...              REST-ish API routes (documents, share, upload, auth)
src/app/login                user picker
src/app/page.tsx             dashboard (owned / shared documents, create, upload)
src/app/documents/[id]       editor page (rename, edit, share, delete)
src/components/Editor.tsx    TipTap wrapper + autosave hook-up
src/components/Toolbar.tsx   formatting toolbar
src/components/ShareModal.tsx grant/revoke access UI
tests/permissions.test.ts    unit tests
```

See `ARCHITECTURE.md` for priorities, tradeoffs, and what I'd do next with
more time.

## Deployment

The app is a standard Next.js app and deploys cleanly to Vercel. The one
catch is the SQLite file: Vercel's filesystem is read-only/ephemeral in
production, so for a persistent deployment either (a) point `DATABASE_URL`
at a hosted Postgres instance (Supabase/Neon — Prisma schema needs zero
changes beyond the `provider`), or (b) use Vercel + a mounted volume/Turso
(libSQL) if you want to keep SQLite. Locally, `npm run dev` / `npm run build
&& npm start` both work against the bundled SQLite file with no extra setup.
