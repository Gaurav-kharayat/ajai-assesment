import { describe, it, expect } from "vitest";
import { getAccessLevel, canView, canEdit, canManageSharing, DocLike } from "@/lib/permissions";

const doc: DocLike = {
  ownerId: "owner-1",
  shares: [
    { userId: "editor-1", permission: "edit" },
    { userId: "viewer-1", permission: "view" },
  ],
};

describe("getAccessLevel", () => {
  it("returns 'owner' for the document owner", () => {
    expect(getAccessLevel(doc, "owner-1")).toBe("owner");
  });

  it("returns 'edit' for a user shared with edit permission", () => {
    expect(getAccessLevel(doc, "editor-1")).toBe("edit");
  });

  it("returns 'view' for a user shared with view-only permission", () => {
    expect(getAccessLevel(doc, "viewer-1")).toBe("view");
  });

  it("returns 'none' for a user with no relationship to the document", () => {
    expect(getAccessLevel(doc, "stranger-1")).toBe("none");
  });

  it("returns 'none' when there is no authenticated user", () => {
    expect(getAccessLevel(doc, null)).toBe("none");
  });
});

describe("canView / canEdit / canManageSharing", () => {
  it("lets the owner view, edit, and manage sharing", () => {
    expect(canView(doc, "owner-1")).toBe(true);
    expect(canEdit(doc, "owner-1")).toBe(true);
    expect(canManageSharing(doc, "owner-1")).toBe(true);
  });

  it("lets an edit-collaborator view and edit, but not manage sharing", () => {
    expect(canView(doc, "editor-1")).toBe(true);
    expect(canEdit(doc, "editor-1")).toBe(true);
    expect(canManageSharing(doc, "editor-1")).toBe(false);
  });

  it("lets a view-only collaborator view but not edit or manage sharing", () => {
    expect(canView(doc, "viewer-1")).toBe(true);
    expect(canEdit(doc, "viewer-1")).toBe(false);
    expect(canManageSharing(doc, "viewer-1")).toBe(false);
  });

  it("blocks a stranger from viewing, editing, or managing sharing", () => {
    expect(canView(doc, "stranger-1")).toBe(false);
    expect(canEdit(doc, "stranger-1")).toBe(false);
    expect(canManageSharing(doc, "stranger-1")).toBe(false);
  });
});
