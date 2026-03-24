'use client'

import { useMemo } from 'react'

interface SEOPanelProps {
  title: string
  content: string
  slug: string
  seoTitle: string
  seoDesc: string
  focusKeyword: string
  onChange: (field: string, value: string) => void
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}

function countKeyword(text: string, keyword: string): number {
  if (!keyword.trim()) return 0
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const regex = new RegExp(escaped, 'gi')
  return (text.match(regex) ?? []).length
}

type ColorLevel = 'green' | 'yellow' | 'red'

function titleColor(len: number): ColorLevel {
  if (len >= 40 && len <= 60) return 'green'
  if ((len >= 30 && len < 40) || (len > 60 && len <= 70)) return 'yellow'
  return 'red'
}

function descColor(len: number): ColorLevel {
  if (len >= 120 && len <= 155) return 'green'
  if ((len >= 80 && len < 120) || (len > 155 && len <= 170)) return 'yellow'
  return 'red'
}

const colorMap: Record<ColorLevel, string> = {
  green: 'text-emerald-400',
  yellow: 'text-yellow-400',
  red: 'text-red-400',
}

const barColorMap: Record<ColorLevel, string> = {
  green: 'bg-emerald-400',
  yellow: 'bg-yellow-400',
  red: 'bg-red-400',
}

function ScoreBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = Math.min(100, Math.round((value / max) * 100))
  return (
    <div className="h-1.5 w-full bg-[#1e1e35] rounded-full overflow-hidden mt-1">
      <div
        className={`h-full rounded-full transition-all duration-300 ${color}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

export function SEOPanel({
  title,
  content,
  slug,
  seoTitle,
  seoDesc,
  focusKeyword,
  onChange,
}: SEOPanelProps) {
  const plainContent = useMemo(() => stripHtml(content), [content])

  const titleLen = seoTitle.length
  const descLen = seoDesc.length
  const titleClr = titleColor(titleLen)
  const descClr = descColor(descLen)

  const kw = focusKeyword.trim().toLowerCase()
  const kwInTitle = kw ? title.toLowerCase().includes(kw) : false
  const kwInSeoTitle = kw ? seoTitle.toLowerCase().includes(kw) : false
  const kwInContent = kw ? countKeyword(plainContent, kw) : 0
  const kwInSlug = kw ? slug.toLowerCase().includes(kw.replace(/\s+/g, '-')) || slug.toLowerCase().includes(kw) : false

  // SEO Score
  const seoScore = useMemo(() => {
    let score = 0
    if (titleLen >= 40 && titleLen <= 60) score += 20
    if (descLen >= 120 && descLen <= 155) score += 20
    if (kw && (kwInTitle || kwInSeoTitle)) score += 20
    if (kw && kwInContent >= 2) score += 20
    if (kw && kwInSlug) score += 20
    return score
  }, [titleLen, descLen, kw, kwInTitle, kwInSeoTitle, kwInContent, kwInSlug])

  const seoScoreColor =
    seoScore >= 70 ? 'bg-emerald-400' : seoScore >= 40 ? 'bg-yellow-400' : 'bg-red-400'
  const seoScoreLabel =
    seoScore >= 70 ? 'text-emerald-400' : seoScore >= 40 ? 'text-yellow-400' : 'text-red-400'

  const inputBase =
    'w-full px-3 py-2.5 rounded-lg bg-[#0a0a14] border border-[#1e1e35] text-white placeholder-[#606080] focus:outline-none focus:border-[#00c896] text-sm resize-none'

  return (
    <div className="space-y-5">
      <h3 className="text-sm font-semibold text-white">SEO Ayarları</h3>

      {/* SEO Title */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs font-medium text-[#606080] uppercase tracking-wide">SEO Başlığı</label>
          <span className={`text-xs font-mono ${colorMap[titleClr]}`}>{titleLen}/60</span>
        </div>
        <input
          type="text"
          value={seoTitle}
          onChange={(e) => onChange('seoTitle', e.target.value)}
          placeholder="SEO başlığı girin..."
          className={inputBase}
          maxLength={70}
        />
        <ScoreBar value={Math.min(titleLen, 70)} max={70} color={barColorMap[titleClr]} />
      </div>

      {/* Meta Description */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs font-medium text-[#606080] uppercase tracking-wide">Meta Açıklama</label>
          <span className={`text-xs font-mono ${colorMap[descClr]}`}>{descLen}/155</span>
        </div>
        <textarea
          value={seoDesc}
          onChange={(e) => onChange('seoDesc', e.target.value)}
          placeholder="Meta açıklama girin..."
          rows={3}
          className={inputBase}
          maxLength={170}
        />
        <ScoreBar value={Math.min(descLen, 170)} max={170} color={barColorMap[descClr]} />
      </div>

      {/* Focus Keyword */}
      <div>
        <label className="block text-xs font-medium text-[#606080] uppercase tracking-wide mb-1.5">
          Odak Anahtar Kelime
        </label>
        <input
          type="text"
          value={focusKeyword}
          onChange={(e) => onChange('focusKeyword', e.target.value)}
          placeholder="Anahtar kelime..."
          className={inputBase}
        />

        {kw && (
          <div className="mt-2 space-y-1">
            <KeywordCheck label="Başlıkta bulunuyor" ok={kwInTitle} />
            <KeywordCheck
              label={`İçerikte geçiyor (${kwInContent}x)`}
              ok={kwInContent >= 2}
            />
            <KeywordCheck label="Slug içinde bulunuyor" ok={kwInSlug} />
          </div>
        )}
      </div>

      {/* SEO Score */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-medium text-[#606080] uppercase tracking-wide">SEO Skoru</span>
          <span className={`text-sm font-bold ${seoScoreLabel}`}>{seoScore}/100</span>
        </div>
        <div className="h-2 w-full bg-[#1e1e35] rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${seoScoreColor}`}
            style={{ width: `${seoScore}%` }}
          />
        </div>
        <p className="text-xs text-[#606080] mt-1">
          {seoScore >= 70 ? 'Harika! SEO optimize.' : seoScore >= 40 ? 'Orta. Geliştirilebilir.' : 'Düşük. İyileştirme gerekli.'}
        </p>
      </div>

      {/* Google Preview */}
      <div>
        <p className="text-xs font-medium text-[#606080] uppercase tracking-wide mb-2">
          Google Önizleme
        </p>
        <div className="rounded-lg border border-[#1e1e35] bg-[#0a0a14] p-3 space-y-0.5">
          <p className="text-xs text-[#606080]">cyba.com.tr › {slug || 'slug-burada'}</p>
          <p className="text-[#3b82f6] text-sm font-medium leading-snug truncate">
            {seoTitle || title || 'SEO Başlığı'}
          </p>
          <p className="text-xs text-[#606080] line-clamp-2 leading-relaxed">
            {seoDesc || 'Meta açıklama burada görünecek...'}
          </p>
        </div>
      </div>
    </div>
  )
}

function KeywordCheck({ label, ok }: { label: string; ok: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <span className={ok ? 'text-emerald-400' : 'text-red-400'} aria-hidden>
        {ok ? '✅' : '❌'}
      </span>
      <span className="text-xs text-[#606080]">{label}</span>
    </div>
  )
}
