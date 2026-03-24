'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Loader2, Plus, Pencil, Eye, Trash2 } from 'lucide-react'
import { ConfirmModal } from '@/components/ui/Modal'
import { useToast } from '@/components/ui/Toast'
import { format } from 'date-fns'

interface PageItem {
  id: string
  title: string
  slug: string
  status: string
  template: string
  showInMenu: boolean
  menuOrder: number
  publishedAt: string | null
  updatedAt: string
}

const TEMPLATE_LABELS: Record<string, string> = {
  default: '📄 Standart',
  legal: '⚖️ Yasal',
  contact: '📬 İletişim',
  about: '🧭 Hakkımızda',
  advertising: '📢 Reklam',
  landing: '🚀 Landing',
  blank: '⬜ Boş',
}

type StatusFilter = 'ALL' | 'PUBLISHED' | 'DRAFT' | 'ARCHIVED'

const STATUS_TABS: { value: StatusFilter; label: string }[] = [
  { value: 'ALL', label: 'Tümü' },
  { value: 'PUBLISHED', label: 'Yayında' },
  { value: 'DRAFT', label: 'Taslak' },
  { value: 'ARCHIVED', label: 'Arşiv' },
]

function StatusBadge({ status }: { status: string }) {
  const configs: Record<string, { label: string; color: string; bg: string }> = {
    PUBLISHED: { label: 'Yayında', color: '#00c896', bg: 'rgba(0,200,150,0.12)' },
    DRAFT: { label: 'Taslak', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
    ARCHIVED: { label: 'Arşiv', color: '#606080', bg: 'rgba(96,96,128,0.12)' },
  }
  const cfg = configs[status] ?? configs.ARCHIVED
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
      style={{ color: cfg.color, backgroundColor: cfg.bg }}
    >
      {cfg.label}
    </span>
  )
}

export default function SayfalarPage() {
  const toast = useToast()

  const [pages, setPages] = useState<PageItem[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL')

  const [deleteTarget, setDeleteTarget] = useState<PageItem | null>(null)
  const [deleting, setDeleting] = useState(false)

  const fetchPages = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/superadmin/sayfalar')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setPages(Array.isArray(data) ? data : [])
    } catch {
      toast.error('Sayfalar yüklenemedi.')
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    fetchPages()
  }, [fetchPages])

  const filteredPages = statusFilter === 'ALL'
    ? pages
    : pages.filter((p) => p.status === statusFilter)

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/superadmin/sayfalar/${deleteTarget.id}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      toast.success(`"${deleteTarget.title}" sayfası silindi.`)
      setDeleteTarget(null)
      await fetchPages()
    } catch {
      toast.error('Sayfa silinemedi.')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a14] px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-white">📄 Sayfa Yönetimi</h1>
        <Link
          href="/superadmin/sayfalar/yeni"
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#f7931a] text-white font-semibold text-sm rounded-lg hover:bg-[#f7931a]/90 transition-colors"
        >
          <Plus size={16} />
          Yeni Sayfa
        </Link>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-1 mb-6 p-1 bg-[#16162a] border border-[#1e1e35] rounded-xl w-fit">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setStatusFilter(tab.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
              statusFilter === tab.value
                ? 'bg-[#f7931a] text-white'
                : 'text-[#606080] hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-[#16162a] border border-[#1e1e35] rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-[#606080]">
            <Loader2 size={24} className="animate-spin mr-2" />
            <span className="text-sm">Yükleniyor...</span>
          </div>
        ) : filteredPages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-[#606080]">
            <p className="text-sm">Henüz sayfa yok.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#1e1e35]">
                {['#', 'Başlık', 'Slug', 'Şablon', 'Durum', 'Menüde', 'İşlemler'].map((col) => (
                  <th
                    key={col}
                    className="px-4 py-3 text-left text-xs font-semibold text-[#606080] uppercase tracking-wider"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredPages.map((page, idx) => (
                <tr
                  key={page.id}
                  className="border-b border-[#1e1e35] last:border-b-0 hover:bg-[#1e1e35]/30 transition-colors"
                >
                  <td className="px-4 py-3 text-sm text-[#606080] w-10">{idx + 1}</td>
                  <td className="px-4 py-3">
                    <span className="text-sm font-semibold text-white">{page.title}</span>
                    {page.updatedAt && (
                      <p className="text-xs text-[#606080] mt-0.5">
                        {format(new Date(page.updatedAt), 'dd MMM yyyy')}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <code className="text-xs text-[#606080] bg-[#0a0a14] px-2 py-0.5 rounded font-mono">
                      /{page.slug}
                    </code>
                  </td>
                  <td className="px-4 py-3 text-sm text-[#606080]">
                    {TEMPLATE_LABELS[page.template] ?? page.template}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={page.status} />
                  </td>
                  <td className="px-4 py-3 text-sm text-center">
                    {page.showInMenu ? '✅' : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/superadmin/sayfalar/${page.id}`}
                        className="p-1.5 rounded-lg text-[#606080] hover:text-white hover:bg-[#1e1e35] transition-colors"
                        title="Düzenle"
                      >
                        <Pencil size={15} />
                      </Link>
                      <a
                        href={`/${page.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-lg text-[#606080] hover:text-white hover:bg-[#1e1e35] transition-colors"
                        title="Görüntüle"
                      >
                        <Eye size={15} />
                      </a>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(page)}
                        className="p-1.5 rounded-lg text-[#606080] hover:text-red-400 hover:bg-red-400/10 transition-colors cursor-pointer"
                        title="Sil"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Delete Confirm Modal */}
      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Sayfayı Sil"
        message={`"${deleteTarget?.title}" sayfasını kalıcı olarak silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`}
        confirmLabel="Evet, Sil"
        danger
        loading={deleting}
      />
    </div>
  )
}
