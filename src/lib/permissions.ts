// Pure permission logic, deliberately kept free of DB/Next.js imports so it
// can be unit tested in isolation (see tests/permissions.test.ts).

export type Share = { userId: string; permission: "view" | "edit" };
export type DocLike = { ownerId: string; shares: Share[] };

export type AccessLevel = "owner" | "edit" | "view" | "none";

export function getAccessLevel(doc: DocLike, userId: string | null): AccessLevel {
  if (!userId) return "none";
  if (doc.ownerId === userId) return "owner";
  const share = doc.shares.find((s) => s.userId === userId);
  if (!share) return "none";
  return share.permission === "edit" ? "edit" : "view";
}

export function canView(doc: DocLike, userId: string | null): boolean {
  return getAccessLevel(doc, userId) !== "none";
}

export function canEdit(doc: DocLike, userId: string | null): boolean {
  const level = getAccessLevel(doc, userId);
  return level === "owner" || level === "edit";
}

export function canManageSharing(doc: DocLike, userId: string | null): boolean {
  return getAccessLevel(doc, userId) === "owner";
}
