'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  Check, X, Trash2, AlertTriangle, Search, RefreshCw,
  MessageSquare, Clock, ChevronLeft, ChevronRight, Loader2,
  ExternalLink, Settings,
} from 'lucide-react'

type CommentStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'SPAM'

interface Comment {
  id: string
  name: string
  email: string
  content: string
  status: CommentStatus
  ip?: string
  userAgent?: string
  createdAt: string
  post: { id: string; title: string; slug: string }
}

interface CommentData {
  comments: Comment[]
  total: number
  pages: number
  counts: { pending: number; approved: number; rejected: number; spam: number }
}

const STATUS_CONFIG: Record<CommentStatus, { label: string; color: string; bg: string }> = {
  PENDING:  { label: 'Bekliyor',    color: '#f59e0b', bg: '#f59e0b18' },
  APPROVED: { label: 'Onaylı',      color: '#00c896', bg: '#00c89618' },
  REJECTED: { label: 'Reddedildi',  color: '#ef4444', bg: '#ef444418' },
  SPAM:     { label: 'Spam',        color: '#8b5cf6', bg: '#8b5cf618' },
}

function StatusBadge({ status }: { status: CommentStatus }) {
  const cfg = STATUS_CONFIG[status]
  return (
    <span className="text-xs font-mono px-2 py-0.5 rounded-full" style={{ color: cfg.color, background: cfg.bg }}>
      {cfg.label}
    </span>
  )
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function YorumlarPage() {
  const [data, setData]         = useState<CommentData | null>(null)
  const [loading, setLoading]   = useState(true)
  const [filter, setFilter]     = useState('all')
  const [search, setSearch]     = useState('')
  const [page, setPage]         = useState(1)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [acting, setActing]     = useState<string | null>(null)
  const [modal, setModal]       = useState<Comment | null>(null)
  const [replyText, setReplyText] = useState('')
  const [replying, setReplying] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page) })
    if (filter !== 'all') params.set('status', filter)
    if (search) params.set('q', search)
    const res = await fetch(`/api/superadmin/yorumlar?${params}`)
    const json = await res.json()
    setData(json)
    setLoading(false)
    setSelected(new Set())
  }, [filter, search, page])

  useEffect(() => { load() }, [load])

  const action = async (id: string, status: string) => {
    setActing(id)
    await fetch(`/api/superadmin/yorumlar/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    setActing(null)
    if (modal?.id === id) setModal(null)
    load()
  }

  const del = async (id: string) => {
    if (!confirm('Bu yorumu silmek istediğinizden emin misiniz?')) return
    setActing(id)
    await fetch(`/api/superadmin/yorumlar/${id}`, { method: 'DELETE' })
    setActing(null)
    if (modal?.id === id) setModal(null)
    load()
  }

  const bulkAction = async (status?: string) => {
    const ids = Array.from(selected)
    if (!ids.length) return
    if (!status) {
      if (!confirm(`${ids.length} yorumu silmek istediğinizden emin misiniz?`)) return
      await fetch('/api/superadmin/yorumlar/bulk', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids }) })
    } else {
      await fetch('/api/superadmin/yorumlar/bulk', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids, status }) })
    }
    load()
  }

  const sendReply = async () => {
    if (!modal || !replyText.trim()) return
    setReplying(true)
    await fetch('/api/yorumlar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        postId: modal.post.id,
        name: 'Admin',
        email: 'admin@cyba.com.tr',
        content: replyText.trim(),
        parentId: modal.id,
      }),
    })
    // Auto-approve admin reply
    const res = await fetch('/api/yorumlar?postId=' + modal.post.id).then(r => r.json())
    // Find the reply and approve it
    setReplying(false)
    setReplyText('')
    load()
  }

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const toggleAll = () => {
    if (!data) return
    if (selected.size === data.comments.length) { setSelected(new Set()) }
    else { setSelected(new Set(data.comments.map((c) => c.id))) }
  }

  const counts = data?.counts ?? { pending: 0, approved: 0, rejected: 0, spam: 0 }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white">Yorumlar</h1>
          <p className="text-sm text-[#606080] mt-0.5">{data?.total ?? 0} toplam yorum</p>
        </div>
        <Link href="/superadmin/yorumlar/ayarlar"
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1e1e35] text-[#a0a0c0] hover:text-white text-sm transition-colors">
          <Settings className="w-4 h-4" />Ayarlar
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { label: '⏳ Bekleyen', count: counts.pending, status: 'pending', color: '#f59e0b' },
          { label: '✅ Onaylı',   count: counts.approved,  status: 'approved', color: '#00c896' },
          { label: '❌ Reddedilmiş', count: counts.rejected, status: 'rejected', color: '#ef4444' },
          { label: '🗑️ Spam',    count: counts.spam,      status: 'spam',    color: '#8b5cf6' },
        ].map((s) => (
          <button key={s.status} onClick={() => { setFilter(s.status); setPage(1) }}
            className={`p-4 rounded-xl border text-left transition-all ${filter === s.status ? 'border-current' : 'border-[#1e1e35] bg-[#12121f]'}`}
            style={filter === s.status ? { borderColor: s.color, background: s.color + '10' } : {}}>
            <p className="text-xs text-[#606080]">{s.label}</p>
            <p className="text-2xl font-bold mt-1" style={{ color: s.color }}>{s.count}</p>
          </button>
        ))}
      </div>

      {/* Filters + Search */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="flex gap-1 bg-[#0f0f1a] border border-[#1e1e35] rounded-lg p-1">
          {['all', 'pending', 'approved', 'rejected', 'spam'].map((f) => (
            <button key={f} onClick={() => { setFilter(f); setPage(1) }}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${filter === f ? 'bg-[#1e1e35] text-white' : 'text-[#606080] hover:text-white'}`}>
              {f === 'all' ? 'Tümü' : f === 'pending' ? 'Bekleyen' : f === 'approved' ? 'Onaylı' : f === 'rejected' ? 'Reddedilmiş' : 'Spam'}
            </button>
          ))}
        </div>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#606080]" />
          <input
            value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            placeholder="Yorum veya yazar ara..."
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg bg-[#0f0f1a] border border-[#1e1e35] text-white placeholder-[#606080] focus:outline-none focus:border-[#00c896]"
          />
        </div>
        <button onClick={load} className="p-2 rounded-lg bg-[#1e1e35] text-[#606080] hover:text-white transition-colors">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Bulk Actions */}
      {selected.size > 0 && (
        <div className="flex items-center gap-2 mb-4 p-3 bg-[#00c896]/10 border border-[#00c896]/30 rounded-lg">
          <span className="text-sm text-[#00c896] font-medium">{selected.size} seçili</span>
          <div className="flex gap-2 ml-auto">
            <button onClick={() => bulkAction('APPROVED')} className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-[#00c896]/20 text-[#00c896] hover:bg-[#00c896]/30 transition-colors"><Check className="w-3.5 h-3.5" />Onayla</button>
            <button onClick={() => bulkAction('REJECTED')} className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-red-400/20 text-red-400 hover:bg-red-400/30 transition-colors"><X className="w-3.5 h-3.5" />Reddet</button>
            <button onClick={() => bulkAction('SPAM')} className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-purple-400/20 text-purple-400 hover:bg-purple-400/30 transition-colors"><AlertTriangle className="w-3.5 h-3.5" />Spam</button>
            <button onClick={() => bulkAction()} className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-red-500/20 text-red-500 hover:bg-red-500/30 transition-colors"><Trash2 className="w-3.5 h-3.5" />Sil</button>
          </div>
        </div>
      )}

      {/* Comment List */}
      {loading ? (
        <div className="flex items-center justify-center h-40">
          <Loader2 className="w-6 h-6 animate-spin text-[#00c896]" />
        </div>
      ) : !data?.comments.length ? (
        <div className="text-center py-16 text-[#606080]">
          <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>Yorum bulunamadı</p>
        </div>
      ) : (
        <div className="space-y-2">
          {/* Select All */}
          <div className="flex items-center gap-2 px-3 pb-2 border-b border-[#1e1e35]">
            <input type="checkbox" checked={selected.size === data.comments.length && data.comments.length > 0}
              onChange={toggleAll} className="accent-[#00c896] w-4 h-4 cursor-pointer" />
            <span className="text-xs text-[#606080]">Tümünü seç</span>
          </div>

          {data.comments.map((comment) => (
            <div key={comment.id}
              className="flex gap-3 p-4 bg-[#12121f] border border-[#1e1e35] rounded-xl hover:border-[#2a2a45] transition-colors">
              <input type="checkbox" checked={selected.has(comment.id)} onChange={() => toggleSelect(comment.id)}
                className="accent-[#00c896] w-4 h-4 mt-1 flex-shrink-0 cursor-pointer" />

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-white">{comment.name}</span>
                      <StatusBadge status={comment.status} />
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-xs text-[#606080]">{comment.email}</span>
                      {comment.ip && <span className="text-xs text-[#606080]">IP: {comment.ip}</span>}
                      <span className="text-xs text-[#606080] flex items-center gap-1">
                        <Clock className="w-3 h-3" />{formatDate(comment.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-[#a0a0c0] mb-2">
                  Yazı:{' '}
                  <button onClick={() => setModal(comment)} className="text-[#00c896] hover:underline">
                    {comment.post.title}
                  </button>
                </p>

                <p className="text-sm text-[#d0d0e8] leading-relaxed line-clamp-3 mb-3 cursor-pointer"
                  onClick={() => setModal(comment)}>
                  "{comment.content}"
                </p>

                <div className="flex items-center gap-2">
                  {comment.status !== 'APPROVED' && (
                    <button onClick={() => action(comment.id, 'APPROVED')} disabled={acting === comment.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-[#00c896]/15 text-[#00c896] hover:bg-[#00c896]/25 transition-colors">
                      {acting === comment.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}Onayla
                    </button>
                  )}
                  {comment.status !== 'REJECTED' && (
                    <button onClick={() => action(comment.id, 'REJECTED')} disabled={acting === comment.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-red-400/15 text-red-400 hover:bg-red-400/25 transition-colors">
                      <X className="w-3.5 h-3.5" />Reddet
                    </button>
                  )}
                  {comment.status !== 'SPAM' && (
                    <button onClick={() => action(comment.id, 'SPAM')} disabled={acting === comment.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-purple-400/15 text-purple-400 hover:bg-purple-400/25 transition-colors">
                      <AlertTriangle className="w-3.5 h-3.5" />Spam
                    </button>
                  )}
                  <button onClick={() => del(comment.id)} disabled={acting === comment.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-red-500/15 text-red-500 hover:bg-red-500/25 transition-colors ml-auto">
                    <Trash2 className="w-3.5 h-3.5" />Sil
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {data && data.pages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <span className="text-sm text-[#606080]">Sayfa {page} / {data.pages}</span>
          <div className="flex gap-2">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
              className="p-2 rounded-lg bg-[#1e1e35] text-[#606080] hover:text-white disabled:opacity-40 transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button onClick={() => setPage((p) => Math.min(data.pages, p + 1))} disabled={page === data.pages}
              className="p-2 rounded-lg bg-[#1e1e35] text-[#606080] hover:text-white disabled:opacity-40 transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => setModal(null)}>
          <div className="bg-[#12121f] border border-[#1e1e35] rounded-2xl w-full max-w-lg p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-white flex items-center gap-2"><MessageSquare className="w-5 h-5 text-[#00c896]" />Yorum Detayı</h2>
              <button onClick={() => setModal(null)} className="text-[#606080] hover:text-white"><X className="w-5 h-5" /></button>
            </div>

            <div className="space-y-2 text-sm mb-4">
              <div className="flex gap-2"><span className="text-[#606080] w-20">Kişi:</span><span className="text-white">{modal.name}</span></div>
              <div className="flex gap-2"><span className="text-[#606080] w-20">Email:</span><span className="text-[#a0a0c0]">{modal.email}</span></div>
              {modal.ip && <div className="flex gap-2"><span className="text-[#606080] w-20">IP:</span><span className="text-[#a0a0c0]">{modal.ip}</span></div>}
              {modal.userAgent && <div className="flex gap-2"><span className="text-[#606080] w-20">Tarayıcı:</span><span className="text-[#a0a0c0] truncate">{modal.userAgent.substring(0, 60)}...</span></div>}
              <div className="flex gap-2"><span className="text-[#606080] w-20">Tarih:</span><span className="text-[#a0a0c0]">{formatDate(modal.createdAt)}</span></div>
              <div className="flex gap-2 items-center">
                <span className="text-[#606080] w-20">Yazı:</span>
                <a href={`/${modal.post.slug}`} target="_blank" className="text-[#00c896] hover:underline flex items-center gap-1">
                  {modal.post.title.substring(0, 40)}...<ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <div className="flex gap-2"><span className="text-[#606080] w-20">Durum:</span><StatusBadge status={modal.status} /></div>
            </div>

            <div className="bg-[#0f0f1a] rounded-lg p-4 mb-4 text-sm text-[#d0d0e8] leading-relaxed border border-[#1e1e35]">
              "{modal.content}"
            </div>

            {/* Reply */}
            <div className="mb-5">
              <p className="text-xs text-[#606080] mb-2 uppercase tracking-wider">Yanıt Yaz</p>
              <textarea value={replyText} onChange={(e) => setReplyText(e.target.value)}
                rows={3} placeholder="Admin olarak yanıt yaz..."
                className="w-full px-3 py-2 text-sm rounded-lg bg-[#0f0f1a] border border-[#1e1e35] text-white placeholder-[#606080] focus:outline-none focus:border-[#00c896] resize-none" />
              <button onClick={sendReply} disabled={replying || !replyText.trim()}
                className="mt-2 px-4 py-2 text-sm rounded-lg bg-[#00c896] text-[#0d0d14] font-semibold hover:bg-[#00c896]/90 disabled:opacity-40 transition-colors">
                {replying ? 'Gönderiliyor...' : 'Yanıtla'}
              </button>
            </div>

            <div className="flex gap-2">
              {modal.status !== 'APPROVED' && (
                <button onClick={() => action(modal.id, 'APPROVED')}
                  className="flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg bg-[#00c896]/15 text-[#00c896] hover:bg-[#00c896]/25 transition-colors">
                  <Check className="w-4 h-4" />Onayla
                </button>
              )}
              {modal.status !== 'REJECTED' && (
                <button onClick={() => action(modal.id, 'REJECTED')}
                  className="flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg bg-red-400/15 text-red-400 hover:bg-red-400/25 transition-colors">
                  <X className="w-4 h-4" />Reddet
                </button>
              )}
              {modal.status !== 'SPAM' && (
                <button onClick={() => action(modal.id, 'SPAM')}
                  className="flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg bg-purple-400/15 text-purple-400 hover:bg-purple-400/25 transition-colors">
                  <AlertTriangle className="w-4 h-4" />Spam
                </button>
              )}
              <button onClick={() => del(modal.id)}
                className="flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg bg-red-500/15 text-red-500 hover:bg-red-500/25 transition-colors ml-auto">
                <Trash2 className="w-4 h-4" />Sil
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
