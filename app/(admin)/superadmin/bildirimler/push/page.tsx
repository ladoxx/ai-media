'use client'

import { useState, useEffect } from 'react'
import { Bell, Users, Send } from 'lucide-react'

interface PushStats {
  total: number
}

export default function PushPanelPage() {
  const [stats, setStats] = useState<PushStats>({ total: 0 })
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [url, setUrl] = useState('/')
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<{ sent: number; failed: number } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/superadmin/bildirimler/push')
      .then((r) => r.json())
      .then((d) => setStats(d))
      .finally(() => setLoading(false))
  }, [])

  const send = async () => {
    if (!title.trim() || !body.trim()) return
    setSending(true)
    setResult(null)
    const res = await fetch('/api/superadmin/bildirimler/push', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, body, url }),
    })
    const data = await res.json()
    setSending(false)
    if (res.ok) {
      setResult({ sent: data.sent, failed: data.failed })
      setTitle('')
      setBody('')
    }
  }

  const inputBase = 'w-full px-3 py-2.5 rounded-lg bg-[#0a0a14] border border-[#1e1e35] text-white text-sm focus:outline-none focus:border-[#00c896] placeholder-[#606080]'

  return (
    <div className="p-6 max-w-2xl space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-[#16162a] border border-[#1e1e35] rounded-xl p-4 flex items-center gap-3">
          <Users size={18} className="text-[#00c896]" />
          <div>
            <p className="text-2xl font-bold text-white">{loading ? '–' : stats.total}</p>
            <p className="text-xs text-[#606080]">Toplam Abone</p>
          </div>
        </div>
        <div className="bg-[#16162a] border border-[#1e1e35] rounded-xl p-4 flex items-center gap-3">
          <Bell size={18} className="text-blue-400" />
          <div>
            <p className="text-2xl font-bold text-white">{loading ? '–' : stats.total}</p>
            <p className="text-xs text-[#606080]">Aktif Abone</p>
          </div>
        </div>
      </div>

      {/* Send Form */}
      <div className="bg-[#16162a] border border-[#1e1e35] rounded-xl p-5 space-y-4">
        <h2 className="text-sm font-semibold text-white uppercase tracking-wide flex items-center gap-2">
          <Send size={14} className="text-[#00c896]" />
          Tüm Abonelere Push Gönder
        </h2>

        <div>
          <label className="block text-xs text-[#606080] mb-1.5">Başlık</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Bildirim başlığı..."
            className={inputBase}
          />
        </div>

        <div>
          <label className="block text-xs text-[#606080] mb-1.5">Mesaj</label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Bildirim mesajı..."
            rows={3}
            className={`${inputBase} resize-none`}
          />
        </div>

        <div>
          <label className="block text-xs text-[#606080] mb-1.5">Link (isteğe bağlı)</label>
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="/haber/bitcoin-analiz"
            className={inputBase}
          />
        </div>

        {result && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-sm text-emerald-400">
            ✅ {result.sent} aboneye gönderildi
            {result.failed > 0 && `, ${result.failed} başarısız (süresi dolmuş abonelikler temizlendi)`}
          </div>
        )}

        <button
          type="button"
          onClick={send}
          disabled={sending || !title.trim() || !body.trim()}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#00c896] text-[#0a0a14] font-semibold text-sm rounded-lg hover:bg-[#00c896]/90 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
        >
          <Bell size={15} />
          {sending ? 'Gönderiliyor...' : `Gönder → ${stats.total} abone`}
        </button>
      </div>

      {stats.total === 0 && !loading && (
        <div className="bg-[#16162a] border border-[#1e1e35] rounded-xl p-6 text-center text-[#606080] text-sm">
          <Bell size={24} className="mx-auto mb-2 opacity-30" />
          <p>Henüz push abonesi yok.</p>
          <p className="text-xs mt-1">Siteye push bildirim bileşeni eklendiğinde aboneler burada görünecek.</p>
        </div>
      )}
    </div>
  )
}
