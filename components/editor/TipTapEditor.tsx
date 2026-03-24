'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import CharacterCount from '@tiptap/extension-character-count'
import { useEffect, useCallback, useState } from 'react'
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Quote,
  Code,
  Link as LinkIcon,
  ImageIcon,
  Undo2,
  Redo2,
} from 'lucide-react'

interface TipTapEditorProps {
  content: string
  onChange: (html: string) => void
  placeholder?: string
}

const AUTOSAVE_KEY = 'draft_content'
const AUTOSAVE_INTERVAL = 30_000

interface ToolbarButtonProps {
  onClick: () => void
  active?: boolean
  title: string
  children: React.ReactNode
  disabled?: boolean
}

function ToolbarButton({ onClick, active, title, children, disabled }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      onMouseDown={(e) => {
        e.preventDefault()
        onClick()
      }}
      title={title}
      disabled={disabled}
      className={`
        flex items-center justify-center w-8 h-8 rounded text-sm font-medium transition-colors duration-150
        disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer
        ${active
          ? 'bg-[#00c896] text-[#0a0a14]'
          : 'text-[#606080] hover:text-white hover:bg-[#1e1e35]'
        }
      `}
    >
      {children}
    </button>
  )
}

export function TipTapEditor({ content, onChange, placeholder = 'Yazınızı buraya girin...' }: TipTapEditorProps) {
  const [autoSaveMsg, setAutoSaveMsg] = useState<string | null>(null)

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      Image.configure({ inline: false, allowBase64: false }),
      Link.configure({ openOnClick: false, autolink: true }),
      Placeholder.configure({ placeholder }),
      CharacterCount,
    ],
    content,
    onUpdate({ editor }) {
      onChange(editor.getHTML())
    },
  })

  // Sync external content changes (e.g. on load)
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content])

  // Autosave to localStorage
  const runAutosave = useCallback(() => {
    if (!editor) return
    const html = editor.getHTML()
    if (html && html !== '<p></p>') {
      localStorage.setItem(AUTOSAVE_KEY, html)
      setAutoSaveMsg('Otomatik kaydedildi ✓')
      setTimeout(() => setAutoSaveMsg(null), 2000)
    }
  }, [editor])

  useEffect(() => {
    const interval = setInterval(runAutosave, AUTOSAVE_INTERVAL)
    return () => clearInterval(interval)
  }, [runAutosave])

  if (!editor) {
    return (
      <div className="min-h-[500px] bg-[#16162a] rounded-xl border border-[#1e1e35] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#00c896] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const handleLink = () => {
    const url = window.prompt('URL:')
    if (!url) return
    if (editor.state.selection.empty) {
      editor.chain().focus().setLink({ href: url }).run()
    } else {
      editor.chain().focus().setLink({ href: url }).run()
    }
  }

  const handleImage = () => {
    const url = window.prompt('Görsel URL:')
    if (!url) return
    editor.chain().focus().setImage({ src: url }).run()
  }

  const charCount = editor.storage.characterCount?.characters?.() ?? 0

  return (
    <div className="flex flex-col rounded-xl border border-[#1e1e35] overflow-hidden bg-[#16162a]">
      {/* Toolbar */}
      <div className="sticky top-0 z-10 flex flex-wrap items-center gap-0.5 px-3 py-2 bg-[#16162a] border-b border-[#1e1e35]">
        {/* Headings */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          active={editor.isActive('heading', { level: 2 })}
          title="Başlık 2"
        >
          <span className="text-xs font-bold">H2</span>
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          active={editor.isActive('heading', { level: 3 })}
          title="Başlık 3"
        >
          <span className="text-xs font-bold">H3</span>
        </ToolbarButton>

        <div className="w-px h-5 bg-[#1e1e35] mx-1" />

        {/* Bold / Italic / Underline */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive('bold')}
          title="Kalın"
        >
          <Bold size={15} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive('italic')}
          title="İtalik"
        >
          <Italic size={15} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleStrike().run()}
          active={editor.isActive('strike')}
          title="Altı Çizili (U)"
        >
          <span className="text-xs font-semibold underline">U</span>
        </ToolbarButton>

        <div className="w-px h-5 bg-[#1e1e35] mx-1" />

        {/* Lists */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive('bulletList')}
          title="Madde İşaretli Liste"
        >
          <List size={15} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive('orderedList')}
          title="Numaralı Liste"
        >
          <ListOrdered size={15} />
        </ToolbarButton>

        <div className="w-px h-5 bg-[#1e1e35] mx-1" />

        {/* Blockquote / Code */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          active={editor.isActive('blockquote')}
          title="Alıntı"
        >
          <Quote size={15} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          active={editor.isActive('codeBlock')}
          title="Kod Bloğu"
        >
          <Code size={15} />
        </ToolbarButton>

        <div className="w-px h-5 bg-[#1e1e35] mx-1" />

        {/* Link / Image */}
        <ToolbarButton
          onClick={handleLink}
          active={editor.isActive('link')}
          title="Bağlantı Ekle"
        >
          <LinkIcon size={15} />
        </ToolbarButton>
        <ToolbarButton
          onClick={handleImage}
          active={false}
          title="Görsel Ekle"
        >
          <ImageIcon size={15} />
        </ToolbarButton>

        <div className="w-px h-5 bg-[#1e1e35] mx-1" />

        {/* Undo / Redo */}
        <ToolbarButton
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          title="Geri Al"
        >
          <Undo2 size={15} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          title="Yinele"
        >
          <Redo2 size={15} />
        </ToolbarButton>

        {/* Autosave badge */}
        {autoSaveMsg && (
          <span className="ml-auto text-xs text-[#00c896] animate-pulse">
            {autoSaveMsg}
          </span>
        )}
      </div>

      {/* Editor content */}
      <EditorContent
        editor={editor}
        className="
          min-h-[500px] px-8 py-6 text-white text-base leading-relaxed
          [&_.ProseMirror]:min-h-[500px]
          [&_.ProseMirror]:outline-none
          [&_.ProseMirror_h2]:text-2xl [&_.ProseMirror_h2]:font-bold [&_.ProseMirror_h2]:mt-6 [&_.ProseMirror_h2]:mb-3 [&_.ProseMirror_h2]:text-white
          [&_.ProseMirror_h3]:text-xl [&_.ProseMirror_h3]:font-semibold [&_.ProseMirror_h3]:mt-5 [&_.ProseMirror_h3]:mb-2 [&_.ProseMirror_h3]:text-white
          [&_.ProseMirror_p]:mb-3 [&_.ProseMirror_p]:text-[#d0d0ea]
          [&_.ProseMirror_strong]:text-white [&_.ProseMirror_strong]:font-bold
          [&_.ProseMirror_em]:italic [&_.ProseMirror_em]:text-[#d0d0ea]
          [&_.ProseMirror_ul]:list-disc [&_.ProseMirror_ul]:pl-6 [&_.ProseMirror_ul]:mb-3
          [&_.ProseMirror_ol]:list-decimal [&_.ProseMirror_ol]:pl-6 [&_.ProseMirror_ol]:mb-3
          [&_.ProseMirror_li]:mb-1 [&_.ProseMirror_li]:text-[#d0d0ea]
          [&_.ProseMirror_blockquote]:border-l-4 [&_.ProseMirror_blockquote]:border-[#00c896] [&_.ProseMirror_blockquote]:pl-4 [&_.ProseMirror_blockquote]:text-[#606080] [&_.ProseMirror_blockquote]:italic [&_.ProseMirror_blockquote]:my-4
          [&_.ProseMirror_pre]:bg-[#0a0a14] [&_.ProseMirror_pre]:rounded-lg [&_.ProseMirror_pre]:p-4 [&_.ProseMirror_pre]:my-4 [&_.ProseMirror_pre]:text-[#00c896] [&_.ProseMirror_pre]:text-sm [&_.ProseMirror_pre]:overflow-x-auto
          [&_.ProseMirror_code]:bg-[#0a0a14] [&_.ProseMirror_code]:px-1.5 [&_.ProseMirror_code]:py-0.5 [&_.ProseMirror_code]:rounded [&_.ProseMirror_code]:text-[#00c896] [&_.ProseMirror_code]:text-sm
          [&_.ProseMirror_a]:text-[#00c896] [&_.ProseMirror_a]:underline
          [&_.ProseMirror_img]:rounded-lg [&_.ProseMirror_img]:max-w-full [&_.ProseMirror_img]:my-4
          [&_.ProseMirror_.is-editor-empty:first-child::before]:content-[attr(data-placeholder)] [&_.ProseMirror_.is-editor-empty:first-child::before]:text-[#606080] [&_.ProseMirror_.is-editor-empty:first-child::before]:pointer-events-none [&_.ProseMirror_.is-editor-empty:first-child::before]:float-left [&_.ProseMirror_.is-editor-empty:first-child::before]:h-0
        "
      />

      {/* Footer: character count */}
      <div className="flex items-center justify-end px-4 py-2 border-t border-[#1e1e35]">
        <span className="text-xs text-[#606080]">{charCount} karakter</span>
      </div>
    </div>
  )
}
