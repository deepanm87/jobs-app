"use client"

import { useEffect } from "react"
import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Placeholder from "@tiptap/extension-placeholder"
import {
  Bold,
  Italic,
  Heading2,
  Heading3,
  List,
  ListOrdered
} from "lucide-react"

interface RichTextEditorProps {
  value: string
  onChange: (html: string) => void
  placeholder?: string
}

function ToolbarButton({
  onClick,
  active,
  children,
  title
}: {
  onClick: () => void
  active: boolean
  children: React.ReactNode
  title: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`flex size-8 items-center justify-center rounded-md transition-colors ${
        active
          ? "bg-foreground/10 text-foreground"
          : "text-muted-foreground hover:bg-foreground/5 hover:text-foreground"
        }`}
    >
      {children}
    </button>
  )
}

export function RichTextEditor({
  value,
  onChange,
  placeholder
}: RichTextEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: {
      StarterKit.configure({
        heading: { levels: [2, 3] }
      }),
      Placeholder.configure({
        placeholder: placeholder ?? "Start writing..."
      })
    },
    content: value,
    editorProps: {
      attributes: {
        class:
          "prose-job min-h-[12rem] max-w-none px-3 py-2 text-sm leading-relaxed focus:outline-none"
      }
    },
    onUpdate: ({ editor: e }) => {
      const html = e.getHTML()
      onChange(html === "<p></p>" ? "" : html)
    }
  })

  useEffect(() => {
    if (!editor) {
      return
    }
    if (editor.getHTML() !== value && value !== undefined) {
      editor.commands.setContent(value, { emitUpdate: false })
    }
  }, [editor, value])

  if (!editor) {
    return null
  }

  return (
    <div className="overflow-hidden rounded-lg border border-input bg-background transition-colors focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/20">
      <div className="flex flex-wrap items-center gap-0.5 border-b border-input bg-secondary/30 px-2 py-1.5">
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive("bold")}
          title="Bold"
        >
          <Bold className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive("italic")}
          title="Italic"
        >
          <Italic className="size-4" />
        </ToolbarButton>

        <div className="mx-1 h-5 w-px bg-border" />

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          active={editor.isActive("heading", { level: 2 })}
          title="Heading 2"
        >
          <Heading2 className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          active={editor.isActive("heading", { level: 3 })}
          title="Heading 3"
        >
          <Heading3 className="size-4" />
        </ToolbarButton>

        <div className="mx-1 h-5 w-px bg-border" />

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive("bulletList")}
          title="Bullet List"
        >
          <List className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive("orderedList")}
          title="Ordered List"
        >
          <ListOrdered className="size-4" />
        </ToolbarButton>
      </div>

      <EditorContent editor={editor} />
    </div>
  )
}