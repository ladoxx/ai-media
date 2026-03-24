'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { X, Plus, Tag } from 'lucide-react'

interface TagOption {
  id: string
  name: string
  slug: string
  postCount: number
}

interface Props {
  value: string[]        // selected tag names
  onChange: (tags: string[]) => void
}

export function TagInput({ value, onChange }: Props) {
  const [allTags, setAllTags]     = useState<TagOption[]>([])
  const [inputVal, setInputVal]   = useState('')
  const [suggestions, setSuggestions] = useState<TagOption[]>([])
  const [open, setOpen]           = useState(false)
  const [focusIdx, setFocusIdx]   = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef  = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch('/api/etiketler')
      .then((r) => r.json())
      .then((data) => setAllTags(Array.isArray(data) ? data : []))
  }, [])

  useEffect(() => {
    if (!inputVal.trim()) { setSuggestions([]); setOpen(false); return }
    const lower = inputVal.toLowerCase()
    const filtered = allTags
      .filter((t) => t.name.toLowerCase().includes(lower) && !value.includes(t.name))
      .slice(0, 8)
    setSuggestions(filtered)
    setOpen(true)
    setFocusIdx(-1)
  }, [inputVal, allTags, value])

  const addTag = useCallback((name: string) => {
    const clean = name.trim()
    if (!clean || value.includes(clean)) return
    onChange([...value, clean])
    setInputVal('')
    setOpen(false)
    inputRef.current?.focus()
  }, [value, onChange])

  const removeTag = (name: string) => onChange(value.filter((t) => t !== name))

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      if (focusIdx >= 0 && suggestions[focusIdx]) {
        addTag(suggestions[focusIdx].name)
      } else if (inputVal.trim()) {
        addTag(inputVal.trim())
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      setFocusIdx((i) => Math.min(i + 1, suggestions.length))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setFocusIdx((i) => Math.max(i - 1, -1))
    } else if (e.key === 'Escape') {
      setOpen(false)
    } else if (e.key === 'Backspace' && !inputVal && value.length) {
      removeTag(value[value.length - 1])
    }
  }

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (listRef.current && !listRef.current.contains(e.target as Node) &&
          inputRef.current && !inputRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const exactMatch = allTags.find((t) => t.name.toLowerCase() === inputVal.trim().toLowerCase())
  const showCreate = inputVal.trim() && !exactMatch && !value.includes(inputVal.trim())
  const newTagIdx = suggestions.length // index for "create new" option

  return (
    <div className="relative">
      {/* Pills + Input */}
      <div
        className="flex flex-wrap gap-1.5 min-h-[42px] px-2 py-1.5 rounded-lg bg-[#0a0a14] border border-[#1e1e35] focus-within:border-[#00c896] transition-colors cursor-text"
        onClick={() => inputRef.current?.focus()}
      >
        {value.map((tag) => (
          <span key={tag} className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-[#00c896]/15 text-[#00c896] border border-[#00c896]/30">
            #{tag}
            <button type="button" onClick={(e) => { e.stopPropagation(); removeTag(tag) }}
              className="text-[#00c896]/70 hover:text-[#00c896] transition-colors">
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => inputVal && setOpen(true)}
          placeholder={value.length === 0 ? 'Etiket ekle (Enter veya virgül)...' : ''}
          className="flex-1 min-w-[120px] bg-transparent text-sm text-white placeholder-[#606080] outline-none py-0.5"
        />
      </div>

      {/* Dropdown */}
      {open && (suggestions.length > 0 || showCreate) && (
        <div ref={listRef}
          className="absolute top-full left-0 right-0 z-50 mt-1 bg-[#12121f] border border-[#1e1e35] rounded-lg shadow-2xl overflow-hidden">
          {suggestions.map((tag, i) => (
            <button
              key={tag.id}
              type="button"
              onMouseDown={(e) => { e.preventDefault(); addTag(tag.name) }}
              className={`w-full flex items-center justify-between px-3 py-2 text-sm text-left transition-colors ${focusIdx === i ? 'bg-[#1e1e35] text-white' : 'text-[#a0a0c0] hover:bg-[#1a1a2e]'}`}
            >
              <span className="flex items-center gap-2">
                <Tag className="w-3.5 h-3.5 text-[#00c896]" />
                {tag.name}
              </span>
              <span className="text-xs text-[#606080]">{tag.postCount} yazı</span>
            </button>
          ))}
          {showCreate && (
            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); addTag(inputVal.trim()) }}
              className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors ${focusIdx === newTagIdx ? 'bg-[#1e1e35] text-white' : 'text-[#00c896] hover:bg-[#1a1a2e]'}`}
            >
              <Plus className="w-3.5 h-3.5" />
              Ekle: <strong>"{inputVal.trim()}"</strong>
            </button>
          )}
        </div>
      )}

      <p className="mt-1.5 text-xs text-[#606080]">
        Etiket yazıp Enter'a basın • Mevcut etiketlerden seçin ya da yeni oluşturun
      </p>
    </div>
  )
}
