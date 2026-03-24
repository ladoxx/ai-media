'use client'

import { useEffect, useState } from 'react'
import { Download, Database, Loader2, RefreshCw } from 'lucide-react'
import { useToast } from '@/components/ui/Toast'
import { format } from 'date-fns'

interface BackupFile {
  name: string
  size: number
  createdAt: string
  url: string
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

export default function YedeklemePage() {
  const { success, error: toastError } = useToast()
  const [backups, setBackups] = useState<BackupFile[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)

  async function loadBackups() {
    setLoading(true)
    const res = await fetch('/api/superadmin/yedek')
    if (res.ok) {
      const data = await res.json()
      setBackups(data.backups ?? [])
    }
    setLoading(false)
  }

  useEffect(() => { loadBackups() }, [])

  async function createBackup() {
    setCreating(true)
    const res = await fetch('/api/superadmin/yedek', { method: 'POST' })
    if (res.ok) {
      const data = await res.json()
      success('Yedek oluşturuldu')
      // Trigger download
      const a = document.createElement('a')
      a.href = data.url
      a.download = data.name
      a.click()
      loadBackups()
    } else {
      toastError('Yedek oluşturulamadı')
    }
    setCreating(false)
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="font-display font-bold text-xl text-white mb-2">Yedekleme</h1>
      <p className="text-xs text-[#606080] mb-6">Veritabanınızı yedekleyin ve önceki yedekleri yönetin.</p>

      {/* Manual backup */}
      <div className="bg-[#16162a] border border-[#1e1e35] rounded-xl p-6 mb-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#f7931a]/10 flex items-center justify-center flex-shrink-0">
            <Database size={24} className="text-[#f7931a]" />
          </div>
          <div className="flex-1">
            <h2 className="font-semibold text-white mb-1">Manuel Yedekleme</h2>
            <p className="text-sm text-[#606080] mb-4">
              Mevcut veritabanını (dev.db) şu anda yedekleyip indirin.
            </p>
            <button
              onClick={createBackup}
              disabled={creating}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#f7931a] text-[#0a0a14] font-semibold rounded-lg text-sm hover:bg-[#f7931a]/90 disabled:opacity-50 transition-colors"
            >
              {creating ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
              {creating ? 'Oluşturuluyor...' : 'Veritabanını Yedekle ve İndir'}
            </button>
          </div>
        </div>
      </div>

      {/* Auto backup info */}
      <div className="bg-[#f7931a]/5 border border-[#f7931a]/20 rounded-xl p-4 mb-6 flex items-start gap-3">
        <span className="text-xl">⏰</span>
        <div>
          <p className="text-sm font-medium text-[#f7931a]">Otomatik Yedekleme</p>
          <p className="text-xs text-[#606080] mt-0.5">
            Her gece 03:00'da otomatik yedek alınır. Son 7 yedek saklanır.
            Bu özelliği etkinleştirmek için bir cron job veya harici servis gereklidir.
          </p>
        </div>
      </div>

      {/* Backup history */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-white text-sm">Yedek Geçmişi</h2>
          <button
            onClick={loadBackups}
            className="text-[#606080] hover:text-white p-1.5 rounded-lg hover:bg-[#1e1e35] transition-colors"
          >
            <RefreshCw size={14} />
          </button>
        </div>
        <div className="bg-[#16162a] border border-[#1e1e35] rounded-xl overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-10 text-[#606080]">
              <Loader2 size={16} className="animate-spin mr-2" /> Yükleniyor...
            </div>
          ) : backups.length === 0 ? (
            <div className="text-center py-10 text-[#606080] text-sm">
              Henüz yedek yok. Yukarıdan ilk yedeğinizi oluşturun.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#1e1e35] bg-[#0a0a14]/50">
                  <th className="text-left px-5 py-3 text-xs text-[#606080] font-medium">Dosya</th>
                  <th className="text-left px-5 py-3 text-xs text-[#606080] font-medium">Boyut</th>
                  <th className="text-left px-5 py-3 text-xs text-[#606080] font-medium">Tarih</th>
                  <th className="text-right px-5 py-3 text-xs text-[#606080] font-medium">İndir</th>
                </tr>
              </thead>
              <tbody>
                {backups.map((b) => (
                  <tr key={b.name} className="border-b border-[#1e1e35]/50 hover:bg-[#1e1e35]/20">
                    <td className="px-5 py-3">
                      <code className="text-xs text-[#f7931a]">{b.name}</code>
                    </td>
                    <td className="px-5 py-3 text-[#606080] text-xs">{formatBytes(b.size)}</td>
                    <td className="px-5 py-3 text-[#606080] text-xs">
                      {format(new Date(b.createdAt), 'dd.MM.yyyy HH:mm')}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <a
                        href={b.url}
                        download={b.name}
                        className="text-[#606080] hover:text-[#f7931a] p-1.5 rounded-lg hover:bg-[#f7931a]/10 transition-colors inline-block"
                      >
                        <Download size={14} />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
