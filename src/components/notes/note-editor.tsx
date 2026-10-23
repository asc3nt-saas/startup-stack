"use client";

import Placeholder from "@tiptap/extension-placeholder";
import { EditorContent, useEditor, useEditorState, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  Bold,
  Code,
  Heading1,
  Heading2,
  Italic,
  List,
  ListOrdered,
  Quote,
  Strikethrough,
} from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Rich text editor. Content is HTML; remount it (key) to load another note. */
export function NoteEditor({ content, onChange }: { content: string; onChange: (html: string) => void }) {
  const editor = useEditor({
    extensions: [StarterKit, Placeholder.configure({ placeholder: "Start writing..." })],
    content,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          "prose prose-sm dark:prose-invert max-w-none min-h-[50dvh] focus:outline-none prose-headings:tracking-tight prose-p:my-2",
      },
    },
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });

  return (
    <div className="flex flex-col">
      {editor && <Toolbar editor={editor} />}
      <EditorContent editor={editor} className="px-1 pt-4 [&_.is-editor-empty:first-child]:before:pointer-events-none [&_.is-editor-empty:first-child]:before:float-left [&_.is-editor-empty:first-child]:before:h-0 [&_.is-editor-empty:first-child]:before:text-muted-foreground [&_.is-editor-empty:first-child]:before:content-[attr(data-placeholder)]" />
    </div>
  );
}

function Toolbar({ editor }: { editor: Editor }) {
  const state = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      bold: e.isActive("bold"),
      italic: e.isActive("italic"),
      strike: e.isActive("strike"),
      h1: e.isActive("heading", { level: 1 }),
      h2: e.isActive("heading", { level: 2 }),
      bullet: e.isActive("bulletList"),
      ordered: e.isActive("orderedList"),
      quote: e.isActive("blockquote"),
      code: e.isActive("codeBlock"),
    }),
  });

  const chain = () => editor.chain().focus();

  return (
    <div className="sticky top-16 z-10 flex flex-wrap gap-0.5 rounded-lg border bg-card/90 p-1 backdrop-blur">
      <Tool label="Bold" active={state.bold} onClick={() => chain().toggleBold().run()}>
        <Bold />
      </Tool>
      <Tool label="Italic" active={state.italic} onClick={() => chain().toggleItalic().run()}>
        <Italic />
      </Tool>
      <Tool label="Strikethrough" active={state.strike} onClick={() => chain().toggleStrike().run()}>
        <Strikethrough />
      </Tool>
      <span className="mx-1 w-px bg-border" />
      <Tool label="Heading 1" active={state.h1} onClick={() => chain().toggleHeading({ level: 1 }).run()}>
        <Heading1 />
      </Tool>
      <Tool label="Heading 2" active={state.h2} onClick={() => chain().toggleHeading({ level: 2 }).run()}>
        <Heading2 />
      </Tool>
      <span className="mx-1 w-px bg-border" />
      <Tool label="Bullet list" active={state.bullet} onClick={() => chain().toggleBulletList().run()}>
        <List />
      </Tool>
      <Tool label="Numbered list" active={state.ordered} onClick={() => chain().toggleOrderedList().run()}>
        <ListOrdered />
      </Tool>
      <Tool label="Quote" active={state.quote} onClick={() => chain().toggleBlockquote().run()}>
        <Quote />
      </Tool>
      <Tool label="Code block" active={state.code} onClick={() => chain().toggleCodeBlock().run()}>
        <Code />
      </Tool>
    </div>
  );
}

function Tool({
  label,
  active,
  onClick,
  children,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      aria-pressed={active}
      className={cn(
        "flex size-8 cursor-pointer items-center justify-center rounded-md transition [&_svg]:size-4",
        active ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}
