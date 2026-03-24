'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { HexColorPicker } from 'react-colorful'
import {
  Palette, Type, Image, Layout, Moon, Eye,
  Save, RotateCcw, Check, Loader2, Monitor, Tablet, Smartphone,
  ChevronDown,
} from 'lucide-react'

// ── Types ──────────────────────────────────────────────────────────────────
type Settings = Record<string, string>

// ── Preset Themes ──────────────────────────────────────────────────────────
const PRESETS = [
  {
    label: '🌑 Koyu',
    values: { accent_tech: '#00c896', accent_crypto: '#f7931a', accent_real: '#3b82f6', accent_game: '#a855f7', bg_dark: '#0d0d14', bg_card_dark: '#16162a', border_dark: '#1e1e35', text_dark: '#f0f0fa', bg_light: '#f8f7f4', bg_card_light: '#ffffff', border_light: '#e8e8f0', text_light: '#1a1a2e' },
  },
  {
    label: '☀️ Açık',
    values: { accent_tech: '#059669', accent_crypto: '#d97706', accent_real: '#2563eb', accent_game: '#7c3aed', bg_dark: '#1f2937', bg_card_dark: '#374151', border_dark: '#4b5563', text_dark: '#f9fafb', bg_light: '#ffffff', bg_card_light: '#f3f4f6', border_light: '#e5e7eb', text_light: '#111827' },
  },
  {
    label: '🔵 Mavi',
    values: { accent_tech: '#3b82f6', accent_crypto: '#06b6d4', accent_real: '#6366f1', accent_game: '#8b5cf6', bg_dark: '#0f172a', bg_card_dark: '#1e293b', border_dark: '#334155', text_dark: '#f8fafc', bg_light: '#f0f9ff', bg_card_light: '#ffffff', border_light: '#bae6fd', text_light: '#0c4a6e' },
  },
  {
    label: '🟣 Mor',
    values: { accent_tech: '#a855f7', accent_crypto: '#ec4899', accent_real: '#8b5cf6', accent_game: '#d946ef', bg_dark: '#0f0a1e', bg_card_dark: '#1a1030', border_dark: '#2d1f50', text_dark: '#f5f0ff', bg_light: '#faf5ff', bg_card_light: '#ffffff', border_light: '#e9d5ff', text_light: '#3b0764' },
  },
  {
    label: '🔴 Kırmızı',
    values: { accent_tech: '#ef4444', accent_crypto: '#f97316', accent_real: '#eab308', accent_game: '#ec4899', bg_dark: '#1c0a0a', bg_card_dark: '#2d1010', border_dark: '#4d1f1f', text_dark: '#fff1f2', bg_light: '#fff5f5', bg_card_light: '#ffffff', border_light: '#fecaca', text_light: '#450a0a' },
  },
  {
    label: '🟢 Yeşil',
    values: { accent_tech: '#22c55e', accent_crypto: '#84cc16', accent_real: '#10b981', accent_game: '#06d6a0', bg_dark: '#052e16', bg_card_dark: '#14532d', border_dark: '#166534', text_dark: '#f0fdf4', bg_light: '#f0fdf4', bg_card_light: '#ffffff', border_light: '#bbf7d0', text_light: '#052e16' },
  },
]

const FONT_DISPLAY_OPTIONS = ['Syne', 'Playfair Display', 'Oswald', 'Bebas Neue', 'Montserrat', 'Raleway']
const FONT_BODY_OPTIONS    = ['DM Sans', 'Inter', 'Lato', 'Open Sans', 'Nunito', 'Rubik']
const FONT_MONO_OPTIONS    = ['JetBrains Mono', 'Fira Code', 'Source Code Pro']
const FONT_SIZES           = ['14', '15', '16', '17', '18']
const HEADING_WEIGHTS      = ['600', '700', '800', '900']

const TABS = [
  { id: 'colors',   label: 'Renkler',       icon: Palette },
  { id: 'fonts',    label: 'Yazı Tipleri',   icon: Type },
  { id: 'logo',     label: 'Logo & Favicon', icon: Image },
  { id: 'layout',   label: 'Düzen',          icon: Layout },
  { id: 'darkmode', label: 'Dark/Light',     icon: Moon },
  { id: 'preview',  label: 'Önizleme',       icon: Eye },
]

// ── Color Picker Popover ────────────────────────────────────────────────────
function ColorInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <div ref={ref} className="relative">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="w-8 h-8 rounded-md border border-[#2a2a45] flex-shrink-0 cursor-pointer shadow-sm"
          style={{ background: value }}
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-28 px-2 py-1.5 text-xs font-mono rounded-lg bg-[#0f0f1a] border border-[#2a2a45] text-white focus:outline-none focus:border-[#00c896]"
          maxLength={7}
        />
      </div>
      {open && (
        <div className="absolute top-10 left-0 z-50 p-3 bg-[#1a1a2e] border border-[#2a2a45] rounded-xl shadow-2xl">
          <HexColorPicker color={value} onChange={onChange} />
          <div className="mt-2 grid grid-cols-6 gap-1">
            {['#00c896','#f7931a','#3b82f6','#a855f7','#ef4444','#eab308',
              '#06b6d4','#ec4899','#22c55e','#f97316','#6366f1','#84cc16'].map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => onChange(c)}
                className="w-7 h-7 rounded-md border-2 border-transparent hover:border-white transition-all"
                style={{ background: c }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Toggle ──────────────────────────────────────────────────────────────────
function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${checked ? 'bg-[#00c896]' : 'bg-[#2a2a45]'}`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${checked ? 'translate-x-5' : 'translate-x-0'}`}
      />
    </button>
  )
}

// ── Select ──────────────────────────────────────────────────────────────────
function Select({ value, options, onChange }: { value: string; options: string[]; onChange: (v: string) => void }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none w-full px-3 py-2 pr-8 text-sm rounded-lg bg-[#0f0f1a] border border-[#2a2a45] text-white focus:outline-none focus:border-[#00c896] cursor-pointer"
      >
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-[#606080] pointer-events-none" />
    </div>
  )
}

// ── Setting Row ─────────────────────────────────────────────────────────────
function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-[#1e1e35] last:border-0">
      <span className="text-sm text-[#a0a0c0]">{label}</span>
      {children}
    </div>
  )
}

// ── Section Card ─────────────────────────────────────────────────────────────
function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-[#12121f] border border-[#1e1e35] rounded-xl p-5 mb-4">
      <h3 className="text-xs font-mono font-bold text-[#606080] uppercase tracking-widest mb-3">{title}</h3>
      {children}
    </div>
  )
}

// ── Preview Component ───────────────────────────────────────────────────────
function LivePreview({ s }: { s: Settings }) {
  const [device, setDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop')
  const [mode, setMode]     = useState<'dark' | 'light'>('dark')

  const bg      = mode === 'dark' ? s.bg_dark      : s.bg_light
  const card    = mode === 'dark' ? s.bg_card_dark  : s.bg_card_light
  const border  = mode === 'dark' ? s.border_dark   : s.border_light
  const text    = mode === 'dark' ? s.text_dark     : s.text_light
  const muted   = mode === 'dark' ? '#606080' : '#888899'

  const widths = { desktop: '100%', tablet: '768px', mobile: '375px' }

  return (
    <div className="flex flex-col gap-4">
      {/* Controls */}
      <div className="flex items-center gap-3">
        <div className="flex rounded-lg border border-[#1e1e35] overflow-hidden">
          {([['desktop', Monitor], ['tablet', Tablet], ['mobile', Smartphone]] as const).map(([d, Icon]) => (
            <button key={d} onClick={() => setDevice(d)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs transition-colors ${device === d ? 'bg-[#1e1e35] text-white' : 'text-[#606080] hover:text-white'}`}>
              <Icon className="w-3.5 h-3.5" />{d.charAt(0).toUpperCase() + d.slice(1)}
            </button>
          ))}
        </div>
        <div className="flex rounded-lg border border-[#1e1e35] overflow-hidden">
          {(['dark', 'light'] as const).map((m) => (
            <button key={m} onClick={() => setMode(m)}
              className={`px-3 py-1.5 text-xs transition-colors ${mode === m ? 'bg-[#1e1e35] text-white' : 'text-[#606080] hover:text-white'}`}>
              {m === 'dark' ? '🌑 Dark' : '☀️ Light'}
            </button>
          ))}
        </div>
      </div>

      {/* Preview Frame */}
      <div className="flex justify-center overflow-auto border border-[#1e1e35] rounded-xl p-4" style={{ background: '#0a0a14' }}>
        <div style={{ width: widths[device], maxWidth: '100%', minWidth: device === 'mobile' ? '375px' : undefined, transition: 'width 0.3s' }}>
          {/* Mockup Header */}
          <div style={{ background: card, borderBottom: `1px solid ${border}`, padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderRadius: '12px 12px 0 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 32, height: 32, background: s.accent_tech + '22', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>{s.logo_icon || '🧭'}</div>
              <span style={{ fontWeight: 800, color: text, fontSize: 15 }}>
                {(s.logo_text || 'Cyba').split(' ')[0]}{' '}
                <span style={{ color: s.accent_tech }}>{(s.logo_text || 'Cyba').split(' ').slice(1).join(' ')}</span>
              </span>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {['Teknoloji', 'Kripto', 'Oyun'].map((l, i) => {
                const c = [s.accent_tech, s.accent_crypto, s.accent_game][i]
                return <span key={l} style={{ fontSize: 12, color: c, padding: '4px 10px', borderRadius: 8, background: c + '18' }}>{l}</span>
              })}
            </div>
          </div>

          {/* Mockup Body */}
          <div style={{ background: bg, padding: '20px', display: 'grid', gridTemplateColumns: device === 'mobile' ? '1fr' : '1fr 1fr 1fr', gap: 12, borderRadius: '0 0 12px 12px' }}>
            {[
              { cat: 'Teknoloji', color: s.accent_tech, title: 'Yapay Zeka 2025\'te Zirvede' },
              { cat: 'Kripto',    color: s.accent_crypto, title: 'Bitcoin 100K\'yı Geçti' },
              { cat: 'Oyun',      color: s.accent_game, title: 'Yeni Nesil Konsollar' },
            ].map((item) => (
              <div key={item.cat} style={{ background: card, borderRadius: 10, overflow: 'hidden', border: `1px solid ${border}` }}>
                <div style={{ height: 60, background: item.color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: 22 }}>{item.cat === 'Teknoloji' ? '💻' : item.cat === 'Kripto' ? '₿' : '🎮'}</span>
                </div>
                <div style={{ padding: '10px' }}>
                  <span style={{ fontSize: 9, color: item.color, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>{item.cat}</span>
                  <p style={{ fontSize: 11, color: text, fontWeight: 700, margin: '4px 0 2px', lineHeight: 1.4 }}>{item.title}</p>
                  <span style={{ fontSize: 9, color: muted }}>3 dk okuma</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Main Page ───────────────────────────────────────────────────────────────
export default function TemaPage() {
  const [tab, setTab]       = useState('colors')
  const [settings, setSettings] = useState<Settings>({})
  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState(false)
  const [saved, setSaved]       = useState(false)
  const [resetting, setResetting] = useState(false)

  useEffect(() => {
    fetch('/api/superadmin/tema')
      .then((r) => r.json())
      .then((data) => { setSettings(data); setLoading(false) })
  }, [])

  const set = useCallback((key: string, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }, [])

  const applyPreset = (values: Record<string, string>) => {
    setSettings((prev) => ({ ...prev, ...values }))
  }

  const save = async () => {
    setSaving(true)
    await fetch('/api/superadmin/tema', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(settings) })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const reset = async () => {
    if (!confirm('Tüm tema ayarları varsayılana sıfırlanacak. Emin misiniz?')) return
    setResetting(true)
    await fetch('/api/superadmin/tema/reset', { method: 'POST' })
    const data = await fetch('/api/superadmin/tema').then((r) => r.json())
    setSettings(data)
    setResetting(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[#00c896]" />
      </div>
    )
  }

  const s = settings

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white">Tema & Görünüm</h1>
          <p className="text-sm text-[#606080] mt-0.5">Sitenin tüm görsel ayarları</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={reset}
            disabled={resetting}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1e1e35] text-[#a0a0c0] hover:text-white text-sm transition-colors"
          >
            {resetting ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
            Sıfırla
          </button>
          <button
            onClick={save}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2 rounded-lg bg-[#00c896] text-[#0d0d14] font-semibold text-sm hover:bg-[#00c896]/90 transition-colors"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            {saved ? 'Kaydedildi!' : 'Kaydet'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-[#0f0f1a] border border-[#1e1e35] rounded-xl p-1 mb-6 overflow-x-auto">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${tab === id ? 'bg-[#1e1e35] text-white' : 'text-[#606080] hover:text-[#a0a0c0]'}`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* ── COLORS TAB ── */}
      {tab === 'colors' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            {/* Preset Themes */}
            <Card title="Hazır Temalar">
              <div className="grid grid-cols-3 gap-2">
                {PRESETS.map((p) => (
                  <button
                    key={p.label}
                    onClick={() => applyPreset(p.values)}
                    className="py-2 px-3 text-xs rounded-lg border border-[#2a2a45] text-[#a0a0c0] hover:border-[#00c896] hover:text-white transition-all"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </Card>

            {/* Category Colors */}
            <Card title="Kategori Renkleri">
              <Row label="💻 Teknoloji"><ColorInput value={s.accent_tech ?? '#00c896'} onChange={(v) => set('accent_tech', v)} /></Row>
              <Row label="₿ Kripto"><ColorInput value={s.accent_crypto ?? '#f7931a'} onChange={(v) => set('accent_crypto', v)} /></Row>
              <Row label="🏠 Gayrimenkul"><ColorInput value={s.accent_real ?? '#3b82f6'} onChange={(v) => set('accent_real', v)} /></Row>
              <Row label="🎮 Oyun"><ColorInput value={s.accent_game ?? '#a855f7'} onChange={(v) => set('accent_game', v)} /></Row>
            </Card>

            {/* Dark Mode Colors */}
            <Card title="Dark Mode">
              <Row label="Arka Plan"><ColorInput value={s.bg_dark ?? '#0d0d14'} onChange={(v) => set('bg_dark', v)} /></Row>
              <Row label="Kart Arka Planı"><ColorInput value={s.bg_card_dark ?? '#16162a'} onChange={(v) => set('bg_card_dark', v)} /></Row>
              <Row label="Border"><ColorInput value={s.border_dark ?? '#1e1e35'} onChange={(v) => set('border_dark', v)} /></Row>
              <Row label="Metin"><ColorInput value={s.text_dark ?? '#f0f0fa'} onChange={(v) => set('text_dark', v)} /></Row>
            </Card>

            {/* Light Mode Colors */}
            <Card title="Light Mode">
              <Row label="Arka Plan"><ColorInput value={s.bg_light ?? '#f8f7f4'} onChange={(v) => set('bg_light', v)} /></Row>
              <Row label="Kart Arka Planı"><ColorInput value={s.bg_card_light ?? '#ffffff'} onChange={(v) => set('bg_card_light', v)} /></Row>
              <Row label="Border"><ColorInput value={s.border_light ?? '#e8e8f0'} onChange={(v) => set('border_light', v)} /></Row>
              <Row label="Metin"><ColorInput value={s.text_light ?? '#1a1a2e'} onChange={(v) => set('text_light', v)} /></Row>
            </Card>
          </div>

          {/* Live Preview */}
          <div className="lg:sticky lg:top-6 lg:self-start">
            <Card title="Canlı Önizleme">
              <LivePreview s={s} />
            </Card>
          </div>
        </div>
      )}

      {/* ── FONTS TAB ── */}
      {tab === 'fonts' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <Card title="Font Seçimi">
              <Row label="Başlık Fontu">
                <div className="w-48">
                  <Select value={s.font_display ?? 'Syne'} options={FONT_DISPLAY_OPTIONS} onChange={(v) => set('font_display', v)} />
                </div>
              </Row>
              <Row label="Metin Fontu">
                <div className="w-48">
                  <Select value={s.font_body ?? 'DM Sans'} options={FONT_BODY_OPTIONS} onChange={(v) => set('font_body', v)} />
                </div>
              </Row>
              <Row label="Mono Fontu">
                <div className="w-48">
                  <Select value={s.font_mono ?? 'JetBrains Mono'} options={FONT_MONO_OPTIONS} onChange={(v) => set('font_mono', v)} />
                </div>
              </Row>
            </Card>

            <Card title="Font Boyutu & Ağırlık">
              <Row label="Temel Font Boyutu">
                <div className="flex gap-1">
                  {FONT_SIZES.map((sz) => (
                    <button key={sz} onClick={() => set('font_size_base', sz)}
                      className={`w-9 h-9 rounded-lg text-sm font-mono transition-colors ${(s.font_size_base ?? '16') === sz ? 'bg-[#00c896] text-[#0d0d14] font-bold' : 'bg-[#1e1e35] text-[#a0a0c0] hover:text-white'}`}>
                      {sz}
                    </button>
                  ))}
                </div>
              </Row>
              <Row label="Başlık Ağırlığı">
                <div className="flex gap-1">
                  {HEADING_WEIGHTS.map((w) => (
                    <button key={w} onClick={() => set('heading_weight', w)}
                      className={`w-12 h-9 rounded-lg text-sm font-mono transition-colors ${(s.heading_weight ?? '700') === w ? 'bg-[#00c896] text-[#0d0d14] font-bold' : 'bg-[#1e1e35] text-[#a0a0c0] hover:text-white'}`}>
                      {w}
                    </button>
                  ))}
                </div>
              </Row>
            </Card>
          </div>

          {/* Font Previews */}
          <div className="space-y-4">
            <Card title="Önizleme">
              <div className="space-y-4 p-2">
                <div>
                  <p className="text-xs text-[#606080] mb-1 uppercase tracking-wider">Başlık Fontu ({s.font_display})</p>
                  <p className="text-2xl text-white" style={{ fontFamily: `'${s.font_display}', sans-serif`, fontWeight: s.heading_weight ?? '700' }}>
                    Cyba — Finansın Pusulası
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[#606080] mb-1 uppercase tracking-wider">Metin Fontu ({s.font_body})</p>
                  <p className="text-sm text-[#a0a0c0] leading-relaxed" style={{ fontFamily: `'${s.font_body}', sans-serif` }}>
                    Teknoloji, kripto, gayrimenkul ve oyun dünyasından güncel haberler. Her gün yeni içeriklerle bilgi dünyanızı genişletin.
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[#606080] mb-1 uppercase tracking-wider">Mono Fontu ({s.font_mono})</p>
                  <p className="text-sm text-[#00c896]" style={{ fontFamily: `'${s.font_mono}', monospace` }}>
                    BTC $67,234 +2.4% • ETH $3,521 +1.8%
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* ── LOGO TAB ── */}
      {tab === 'logo' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <Card title="Logo Türü">
              <div className="grid grid-cols-3 gap-2 mb-4">
                {[['text_icon', 'Metin + İkon'], ['image', 'Görsel Logo'], ['text_only', 'Sadece Metin']].map(([v, l]) => (
                  <button key={v} onClick={() => set('logo_type', v)}
                    className={`py-2.5 text-xs rounded-lg border transition-all ${(s.logo_type ?? 'text_icon') === v ? 'border-[#00c896] text-[#00c896] bg-[#00c896]/10' : 'border-[#2a2a45] text-[#606080] hover:text-white'}`}>
                    {l}
                  </button>
                ))}
              </div>

              {(s.logo_type ?? 'text_icon') === 'text_icon' && (
                <>
                  <Row label="Emoji / İkon">
                    <input value={s.logo_icon ?? '🧭'} onChange={(e) => set('logo_icon', e.target.value)}
                      className="w-20 px-3 py-2 text-center text-xl rounded-lg bg-[#0f0f1a] border border-[#2a2a45] focus:outline-none focus:border-[#00c896]" />
                  </Row>
                  <Row label="Site Adı">
                    <input value={s.logo_text ?? 'Cyba'} onChange={(e) => set('logo_text', e.target.value)}
                      className="w-52 px-3 py-2 text-sm rounded-lg bg-[#0f0f1a] border border-[#2a2a45] text-white focus:outline-none focus:border-[#00c896]" />
                  </Row>
                </>
              )}

              {(s.logo_type ?? 'text_icon') === 'image' && (
                <>
                  <Row label="Logo URL">
                    <input value={s.logo_image ?? ''} onChange={(e) => set('logo_image', e.target.value)} placeholder="https://..."
                      className="w-52 px-3 py-2 text-sm rounded-lg bg-[#0f0f1a] border border-[#2a2a45] text-white placeholder-[#606080] focus:outline-none focus:border-[#00c896]" />
                  </Row>
                </>
              )}
            </Card>

            <Card title="Footer">
              <Row label="Footer Metni">
                <input value={s.footer_text ?? ''} onChange={(e) => set('footer_text', e.target.value)}
                  className="w-64 px-3 py-2 text-sm rounded-lg bg-[#0f0f1a] border border-[#2a2a45] text-white focus:outline-none focus:border-[#00c896]" />
              </Row>
              <Row label="Telif Hakkı">
                <input value={s.copyright ?? ''} onChange={(e) => set('copyright', e.target.value)}
                  className="w-64 px-3 py-2 text-sm rounded-lg bg-[#0f0f1a] border border-[#2a2a45] text-white focus:outline-none focus:border-[#00c896]" />
              </Row>
            </Card>
          </div>

          {/* Logo Preview */}
          <div className="space-y-4">
            <Card title="Logo Önizleme">
              {/* Dark */}
              <div className="p-4 rounded-lg mb-3" style={{ background: s.bg_dark ?? '#0d0d14' }}>
                <p className="text-xs text-[#606080] mb-3 uppercase tracking-wider">Dark Mode</p>
                <div className="flex items-center gap-2">
                  {(s.logo_type ?? 'text_icon') !== 'image' && (
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center text-lg" style={{ background: (s.accent_tech ?? '#00c896') + '22' }}>
                      {s.logo_icon ?? '🧭'}
                    </div>
                  )}
                  {(s.logo_type ?? 'text_icon') === 'image' && s.logo_image && (
                    <img src={s.logo_image} alt="logo" className="h-8 object-contain" />
                  )}
                  {(s.logo_type ?? 'text_icon') !== 'image' && (
                    <span className="font-extrabold text-lg" style={{ color: s.text_dark ?? '#f0f0fa', fontFamily: `'${s.font_display}', sans-serif` }}>
                      {(s.logo_text ?? 'Cyba').split(' ')[0]}{' '}
                      <span style={{ color: s.accent_tech ?? '#00c896' }}>{(s.logo_text ?? 'Cyba').split(' ').slice(1).join(' ')}</span>
                    </span>
                  )}
                </div>
              </div>
              {/* Light */}
              <div className="p-4 rounded-lg border" style={{ background: s.bg_light ?? '#f8f7f4', borderColor: s.border_light ?? '#e8e8f0' }}>
                <p className="text-xs text-[#888899] mb-3 uppercase tracking-wider">Light Mode</p>
                <div className="flex items-center gap-2">
                  {(s.logo_type ?? 'text_icon') !== 'image' && (
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center text-lg" style={{ background: (s.accent_tech ?? '#00c896') + '22' }}>
                      {s.logo_icon ?? '🧭'}
                    </div>
                  )}
                  {(s.logo_type ?? 'text_icon') === 'image' && s.logo_image && (
                    <img src={s.logo_image} alt="logo" className="h-8 object-contain" />
                  )}
                  {(s.logo_type ?? 'text_icon') !== 'image' && (
                    <span className="font-extrabold text-lg" style={{ color: s.text_light ?? '#1a1a2e', fontFamily: `'${s.font_display}', sans-serif` }}>
                      {(s.logo_text ?? 'Cyba').split(' ')[0]}{' '}
                      <span style={{ color: s.accent_tech ?? '#00c896' }}>{(s.logo_text ?? 'Cyba').split(' ').slice(1).join(' ')}</span>
                    </span>
                  )}
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* ── LAYOUT TAB ── */}
      {tab === 'layout' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <Card title="Header">
              <Row label="Yapışkan Header"><Toggle checked={s.header_sticky !== 'false'} onChange={(v) => set('header_sticky', String(v))} /></Row>
              <Row label="Ticker Bandı"><Toggle checked={s.ticker_enabled !== 'false'} onChange={(v) => set('ticker_enabled', String(v))} /></Row>
              <Row label="Breaking News Bandı"><Toggle checked={s.breaking_news === 'true'} onChange={(v) => set('breaking_news', String(v))} /></Row>
              <Row label="Arama Butonu"><Toggle checked={s.search_button !== 'false'} onChange={(v) => set('search_button', String(v))} /></Row>
              <Row label="Abone Ol Butonu"><Toggle checked={s.subscribe_button !== 'false'} onChange={(v) => set('subscribe_button', String(v))} /></Row>
            </Card>

            <Card title="Ana Sayfa">
              <Row label="Hero Bölümü"><Toggle checked={s.hero_enabled !== 'false'} onChange={(v) => set('hero_enabled', String(v))} /></Row>
              <Row label="İstatistik Bandı"><Toggle checked={s.stats_band !== 'false'} onChange={(v) => set('stats_band', String(v))} /></Row>
              <Row label="Newsletter Bölümü"><Toggle checked={s.newsletter_section !== 'false'} onChange={(v) => set('newsletter_section', String(v))} /></Row>
              <Row label="Sidebar">
                <Toggle checked={s.sidebar_enabled !== 'false'} onChange={(v) => set('sidebar_enabled', String(v))} />
              </Row>
              <Row label="Sidebar Konumu">
                <div className="flex gap-2">
                  {['left', 'right'].map((pos) => (
                    <button key={pos} onClick={() => set('sidebar_position', pos)}
                      className={`px-4 py-1.5 text-xs rounded-lg transition-colors ${(s.sidebar_position ?? 'right') === pos ? 'bg-[#00c896] text-[#0d0d14] font-bold' : 'bg-[#1e1e35] text-[#a0a0c0] hover:text-white'}`}>
                      {pos === 'left' ? 'Sol' : 'Sağ'}
                    </button>
                  ))}
                </div>
              </Row>
            </Card>
          </div>

          <div className="space-y-4">
            <Card title="Yazi Sayfası">
              <Row label="Okuma Progress Bar"><Toggle checked={s.reading_progress !== 'false'} onChange={(v) => set('reading_progress', String(v))} /></Row>
              <Row label="Yazar Kutusu"><Toggle checked={s.author_box !== 'false'} onChange={(v) => set('author_box', String(v))} /></Row>
              <Row label="İlgili Haberler"><Toggle checked={s.related_posts !== 'false'} onChange={(v) => set('related_posts', String(v))} /></Row>
              <Row label="Sosyal Paylaşım"><Toggle checked={s.social_share !== 'false'} onChange={(v) => set('social_share', String(v))} /></Row>
              <Row label="Okuma Süresi"><Toggle checked={s.reading_time !== 'false'} onChange={(v) => set('reading_time', String(v))} /></Row>
              <Row label="Görüntülenme Sayısı"><Toggle checked={s.show_views !== 'false'} onChange={(v) => set('show_views', String(v))} /></Row>
              <Row label="Yorum Bölümü"><Toggle checked={s.comments_enabled === 'true'} onChange={(v) => set('comments_enabled', String(v))} /></Row>
            </Card>

            <Card title="Listeleme">
              <Row label="Sayfa Başına Yazı">
                <div className="flex gap-1">
                  {['6', '9', '12', '15'].map((n) => (
                    <button key={n} onClick={() => set('posts_per_page', n)}
                      className={`w-10 h-9 rounded-lg text-sm font-mono transition-colors ${(s.posts_per_page ?? '9') === n ? 'bg-[#00c896] text-[#0d0d14] font-bold' : 'bg-[#1e1e35] text-[#a0a0c0] hover:text-white'}`}>
                      {n}
                    </button>
                  ))}
                </div>
              </Row>
              <Row label="Grid Kolonları">
                <div className="flex gap-1">
                  {['2', '3', '4'].map((n) => (
                    <button key={n} onClick={() => set('grid_cols', n)}
                      className={`w-10 h-9 rounded-lg text-sm font-mono transition-colors ${(s.grid_cols ?? '3') === n ? 'bg-[#00c896] text-[#0d0d14] font-bold' : 'bg-[#1e1e35] text-[#a0a0c0] hover:text-white'}`}>
                      {n}
                    </button>
                  ))}
                </div>
              </Row>
            </Card>
          </div>
        </div>
      )}

      {/* ── DARKMODE TAB ── */}
      {tab === 'darkmode' && (
        <div className="max-w-xl space-y-4">
          <Card title="Varsayılan Mod">
            <div className="grid grid-cols-3 gap-2">
              {[['dark', '🌑 Dark Mode'], ['light', '☀️ Light Mode'], ['system', '💻 Sistem Tercihi']].map(([v, l]) => (
                <button key={v} onClick={() => set('default_mode', v)}
                  className={`py-3 text-sm rounded-lg border transition-all ${(s.default_mode ?? 'dark') === v ? 'border-[#00c896] text-[#00c896] bg-[#00c896]/10' : 'border-[#2a2a45] text-[#606080] hover:text-white'}`}>
                  {l}
                </button>
              ))}
            </div>
          </Card>

          <Card title="Toggle Ayarları">
            <Row label="Header'da Toggle Göster"><Toggle checked={s.show_toggle !== 'false'} onChange={(v) => set('show_toggle', String(v))} /></Row>
          </Card>

          <Card title="Geçiş Animasyonu">
            <div className="grid grid-cols-3 gap-2">
              {[['instant', '⚡ Anlık'], ['fade', '🌫️ Fade (0.3s)'], ['slide', '➡️ Slide']].map(([v, l]) => (
                <button key={v} onClick={() => set('transition_type', v)}
                  className={`py-2.5 text-xs rounded-lg border transition-all ${(s.transition_type ?? 'fade') === v ? 'border-[#00c896] text-[#00c896] bg-[#00c896]/10' : 'border-[#2a2a45] text-[#606080] hover:text-white'}`}>
                  {l}
                </button>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* ── PREVIEW TAB ── */}
      {tab === 'preview' && (
        <Card title="Site Önizlemesi">
          <LivePreview s={s} />
          <p className="text-xs text-[#606080] mt-4 text-center">
            Değişiklikleri kaydetmek için sağ üstteki <strong className="text-[#00c896]">Kaydet</strong> butonunu kullanın.
          </p>
        </Card>
      )}
    </div>
  )
}
