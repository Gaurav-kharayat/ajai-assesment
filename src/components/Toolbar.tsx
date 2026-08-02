"use client";

import type { Editor } from "@tiptap/react";

export default function Toolbar({ editor, readOnly }: { editor: Editor | null; readOnly: boolean }) {
  if (!editor) return null;

  const Btn = ({
    onClick,
    active,
    label,
    title,
  }: {
    onClick: () => void;
    active?: boolean;
    label: string;
    title: string;
  }) => (
    <button
      type="button"
      title={title}
      className={active ? "active" : ""}
      onMouseDown={(e) => e.preventDefault()} // keep editor selection/focus
      onClick={onClick}
      disabled={readOnly}
    >
      {label}
    </button>
  );

  return (
    <div className="toolbar">
      <Btn
        title="Bold"
        label="B"
        active={editor.isActive("bold")}
        onClick={() => editor.chain().focus().toggleBold().run()}
      />
      <Btn
        title="Italic"
        label="I"
        active={editor.isActive("italic")}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      />
      <Btn
        title="Underline"
        label="U"
        active={editor.isActive("underline")}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
      />
      <span style={{ width: 1, background: "#e1e3e6", margin: "2px 4px" }} />
      <Btn
        title="Heading 1"
        label="H1"
        active={editor.isActive("heading", { level: 1 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
      />
      <Btn
        title="Heading 2"
        label="H2"
        active={editor.isActive("heading", { level: 2 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      />
      <Btn
        title="Paragraph"
        label="¶"
        active={editor.isActive("paragraph")}
        onClick={() => editor.chain().focus().setParagraph().run()}
      />
      <span style={{ width: 1, background: "#e1e3e6", margin: "2px 4px" }} />
      <Btn
        title="Bulleted list"
        label="• List"
        active={editor.isActive("bulletList")}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      />
      <Btn
        title="Numbered list"
        label="1. List"
        active={editor.isActive("orderedList")}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      />
    </div>
  );
}
