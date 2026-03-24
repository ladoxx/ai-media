'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Plus, Trash2, Settings, ChevronDown, ChevronUp, X, Save } from 'lucide-react'

interface Widget {
  id: string
  name: string
  slug: string
  area: string
  type: string
  settings: string
  order: number
  active: boolean
}

const WIDGET_TYPES = [
  { type: 'recent-posts',  name: 'Son Yazılar',     icon: '📰' },
  { type: 'live-prices',   name: 'Canlı Fiyatlar',  icon: '💰' },
  { type: 'newsletter',    name: 'Newsletter Formu', icon: '📬' },
  { type: 'trending',      name: 'Trend Haberler',   icon: '🔥' },
  { type: 'tag-cloud',     name: 'Etiket Bulutu',    icon: '🏷️' },
  { type: 'categories',    name: 'Kategoriler',      icon: '📊' },
  { type: 'search',        name: 'Arama Kutusu',     icon: '🔍' },
  { type: 'ad',            name: 'Reklam Alanı',     icon: '📢' },
  { type: 'custom-html',   name: 'Özel HTML/Kod',    icon: '✏️' },
]

const AREAS = [
  { key: 'sidebar',   label: 'Sidebar' },
  { key: 'footer-1',  label: 'Footer Alan 1' },
  { key: 'footer-2',  label: 'Footer Alan 2' },
  { key: 'header',    label: 'Header' },
]

const WIDGET_SETTINGS_FIELDS: Record<string, { key: string; label: string; type: string; placeholder?: string; options?: { value: string; label: string }[] }[]> = {
  'recent-posts': [
    { key: 'count', label: 'Gösterilecek sayı', type: 'number', placeholder: '5' },
    { key: 'category', label: 'Kategori filtresi (slug, boş=tümü)', type: 'text', placeholder: 'teknoloji' },
    { key: 'show_image', label: 'Görsel göster (true/false)', type: 'text', placeholder: 'true' },
  ],
  'ad': [
    { key: 'code', label: 'Reklam kodu', type: 'textarea' },
    { key: 'size', label: 'Boyut', type: 'select', options: [{ value: '300x250', label: '300x250' }, { value: '728x90', label: '728x90' }, { value: '320x50', label: '320x50' }] },
  ],
  'custom-html': [
    { key: 'title', label: 'Başlık', type: 'text' },
    { key: 'content', label: 'HTML içeriği', type: 'textarea' },
  ],
  'live-prices': [
    { key: 'coins', label: 'Coinler (virgülle)', type: 'text', placeholder: 'bitcoin,ethereum' },
    { key: 'currency', label: 'Para birimi', type: 'select', options: [{ value: 'usd', label: 'USD' }, { value: 'eur', label: 'EUR' }, { value: 'try', label: 'TRY' }] },
  ],
  'newsletter': [
    { key: 'title', label: 'Başlık', type: 'text', placeholder: '📬 Bülten' },
    { key: 'subtitle', label: 'Alt başlık', type: 'text', placeholder: 'Günlük haberleri kaçırma.' },
  ],
  'trending': [
    { key: 'count', label: 'Gösterilecek sayı', type: 'number', placeholder: '5' },
    { key: 'title', label: 'Başlık', type: 'text', placeholder: 'Trend Haberler' },
  ],
}

function getIcon(type: string) {
  return WIDGET_TYPES.find((w) => w.type === type)?.icon ?? '🔌'
}
function getTypeName(type: string) {
  return WIDGET_TYPES.find((w) => w.type === type)?.name ?? type
}

function SortableWidget({ widget, onDelete, onUpdate }: {
  widget: Widget
  onDelete: (id: string) => void
  onUpdate: (id: string, settings: Record<string, string>, name: string) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: widget.id })
  const [open, setOpen] = useState(false)
  const settings: Record<string, string> = JSON.parse(widget.settings || '{}')
  const [localSettings, setLocalSettings] = useState<Record<string, string>>(settings)
  const [localName, setLocalName] = useState(widget.name)
  const fields = WIDGET_SETTINGS_FIELDS[widget.type] ?? []

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const inputBase = 'w-full px-3 py-2 rounded-lg bg-[#0d0d1a] border border-[#1e1e35] text-white text-sm focus:outline-none focus:border-[#00c896] placeholder-[#606080]'

  return (
    <div ref={setNodeRef} style={style} className="bg-[#0d0d1a] border border-[#1e1e35] rounded-lg overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2.5">
        <button type="button" {...attributes} {...listeners} className="text-[#404060] hover:text-[#606080] cursor-grab active:cursor-grabbing">
          <GripVertical size={16} />
        </button>
        <span>{getIcon(widget.type)}</span>
        <span className="text-sm text-white font-medium flex-1">{widget.name}</span>
        <button type="button" onClick={() => setOpen((v) => !v)} className="text-[#606080] hover:text-white cursor-pointer p-1">
          {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
        <button type="button" onClick={() => onDelete(widget.id)} className="text-[#606080] hover:text-red-400 cursor-pointer p-1">
          <Trash2 size={13} />
        </button>
      </div>

      {open && (
        <div className="border-t border-[#1e1e35] px-3 py-3 space-y-3">
          <div>
            <label className="block text-xs text-[#606080] mb-1">Widget Adı</label>
            <input type="text" value={localName} onChange={(e) => setLocalName(e.target.value)} className={inputBase} />
          </div>
          {fields.map((f) => (
            <div key={f.key}>
              <label className="block text-xs text-[#606080] mb-1">{f.label}</label>
              {f.type === 'textarea' ? (
                <textarea
                  value={localSettings[f.key] ?? ''}
                  onChange={(e) => setLocalSettings((prev) => ({ ...prev, [f.key]: e.target.value }))}
                  rows={3}
                  className={`${inputBase} resize-none`}
                />
              ) : f.type === 'select' ? (
                <select
                  value={localSettings[f.key] ?? ''}
                  onChange={(e) => setLocalSettings((prev) => ({ ...prev, [f.key]: e.target.value }))}
                  className={inputBase}
                >
                  {f.options?.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              ) : (
                <input
                  type={f.type}
                  value={localSettings[f.key] ?? ''}
                  onChange={(e) => setLocalSettings((prev) => ({ ...prev, [f.key]: e.target.value }))}
                  placeholder={f.placeholder}
                  className={inputBase}
                />
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={() => { onUpdate(widget.id, localSettings, localName); setOpen(false) }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#00c896] text-[#0a0a14] text-xs font-semibold rounded-lg cursor-pointer hover:bg-[#00c896]/90"
          >
            <Save size={12} /> Kaydet
          </button>
        </div>
      )}
    </div>
  )
}

function AddWidgetModal({ area, onAdd, onClose }: { area: string; onAdd: () => void; onClose: () => void }) {
  const [type, setType] = useState(WIDGET_TYPES[0].type)
  const [adding, setAdding] = useState(false)

  const add = async () => {
    setAdding(true)
    await fetch('/api/superadmin/widgetlar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, area, name: getTypeName(type) }),
    })
    setAdding(false)
    onAdd()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-[#16162a] border border-[#1e1e35] rounded-2xl w-full max-w-sm shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1e1e35]">
          <h3 className="text-sm font-semibold text-white">Widget Ekle → {area}</h3>
          <button type="button" onClick={onClose} className="text-[#606080] hover:text-white cursor-pointer"><X size={15} /></button>
        </div>
        <div className="p-5 space-y-3">
          <div className="grid grid-cols-1 gap-2">
            {WIDGET_TYPES.map((w) => (
              <button
                key={w.type}
                type="button"
                onClick={() => setType(w.type)}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-left cursor-pointer transition-colors ${type === w.type ? 'bg-[#00c896]/15 border border-[#00c896]/40 text-[#00c896]' : 'bg-[#0a0a14] border border-[#1e1e35] text-[#a0a0c0] hover:text-white'}`}
              >
                <span>{w.icon}</span>
                {w.name}
              </button>
            ))}
          </div>
        </div>
        <div className="px-5 py-4 border-t border-[#1e1e35] flex justify-end gap-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-[#606080] hover:text-white cursor-pointer">İptal</button>
          <button
            type="button"
            onClick={add}
            disabled={adding}
            className="flex items-center gap-2 px-4 py-2 bg-[#00c896] text-[#0a0a14] font-semibold text-sm rounded-lg disabled:opacity-50 cursor-pointer"
          >
            <Plus size={14} />
            Ekle
          </button>
        </div>
      </div>
    </div>
  )
}

export default function WidgetlarPage() {
  const [widgets, setWidgets] = useState<Widget[]>([])
  const [loading, setLoading] = useState(true)
  const [addArea, setAddArea] = useState<string | null>(null)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/superadmin/widgetlar')
    if (res.ok) setWidgets(await res.json())
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const handleDragEnd = async (event: DragEndEvent, area: string) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const areaWidgets = widgets.filter((w) => w.area === area)
    const oldIdx = areaWidgets.findIndex((w) => w.id === active.id)
    const newIdx = areaWidgets.findIndex((w) => w.id === over.id)
    const reordered = arrayMove(areaWidgets, oldIdx, newIdx)

    // Optimistic update
    setWidgets((prev) => {
      const others = prev.filter((w) => w.area !== area)
      return [...others, ...reordered.map((w, i) => ({ ...w, order: i + 1 }))]
    })

    // Persist
    await fetch('/api/superadmin/widgetlar', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: reordered.map((w, i) => ({ id: w.id, order: i + 1 })) }),
    })
  }

  const deleteWidget = async (id: string) => {
    await fetch(`/api/superadmin/widgetlar/${id}`, { method: 'DELETE' })
    setWidgets((prev) => prev.filter((w) => w.id !== id))
  }

  const updateWidget = async (id: string, settings: Record<string, string>, name: string) => {
    await fetch(`/api/superadmin/widgetlar/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ settings, name }),
    })
    setWidgets((prev) => prev.map((w) => w.id === id ? { ...w, settings: JSON.stringify(settings), name } : w))
  }

  if (loading) return <div className="p-8 text-center text-[#606080] text-sm">Yükleniyor...</div>

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-white">🧩 Widget Yönetimi</h1>
        <p className="text-xs text-[#606080]">Sürükle-bırak ile sırala</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {AREAS.map((area) => {
          const areaWidgets = widgets.filter((w) => w.area === area.key).sort((a, b) => a.order - b.order)
          return (
            <div key={area.key} className="bg-[#16162a] border border-[#1e1e35] rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-[#1e1e35]">
                <h2 className="text-sm font-semibold text-white uppercase tracking-wide">{area.label}</h2>
                <span className="text-xs text-[#606080]">{areaWidgets.length} widget</span>
              </div>

              <div className="p-3 space-y-2">
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e) => handleDragEnd(e, area.key)}>
                  <SortableContext items={areaWidgets.map((w) => w.id)} strategy={verticalListSortingStrategy}>
                    {areaWidgets.length === 0 ? (
                      <p className="text-center text-xs text-[#404060] py-4">Widget yok. Aşağıdan ekleyin.</p>
                    ) : (
                      areaWidgets.map((w) => (
                        <SortableWidget key={w.id} widget={w} onDelete={deleteWidget} onUpdate={updateWidget} />
                      ))
                    )}
                  </SortableContext>
                </DndContext>

                <button
                  type="button"
                  onClick={() => setAddArea(area.key)}
                  className="w-full flex items-center justify-center gap-2 py-2 text-xs text-[#606080] hover:text-[#00c896] border border-dashed border-[#1e1e35] hover:border-[#00c896]/40 rounded-lg transition-colors cursor-pointer"
                >
                  <Plus size={13} /> Widget Ekle
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {addArea && (
        <AddWidgetModal area={addArea} onAdd={load} onClose={() => setAddArea(null)} />
      )}
    </div>
  )
}
