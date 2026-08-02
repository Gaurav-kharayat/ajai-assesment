"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import { useEffect } from "react";
import Toolbar from "./Toolbar";

export default function Editor({
  content,
  editable,
  onChange,
}: {
  content: string;
  editable: boolean;
  onChange: (html: string) => void;
}) {
  const editor = useEditor({
    extensions: [StarterKit, Underline],
    content,
    editable,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: { class: "prose" },
    },
    immediatelyRender: false,
  });

  // Keep editable state in sync if permissions change after mount.
  useEffect(() => {
    editor?.setEditable(editable);
  }, [editable, editor]);

  return (
    <div>
      <Toolbar editor={editor} readOnly={!editable} />
      <div className="editor-shell">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
