'use client'

import { useEffect, useState } from 'react'
import { RefreshCw, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'

interface LogRow {
  id: string
  userId: string
  userName: string
  userEmail: string
  keyName: string
  ip: string | null
  userAgent: string | null
  createdAt: string
}

export default function ApiKeyLogPage() {
  const [logs, setLogs] = useState<LogRow[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)

  async function fetchLogs() {
    setLoading(true)
    try {
      const res = await fetch('/api/superadmin/api-keys/log')
      if (!res.ok) throw new Error()
      const data = await res.json()
      setLogs(data.logs)
      setTotal(data.total)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchLogs() }, [])

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/superadmin/api-keys" className="text-[#606080] hover:text-white transition-colors">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-white">API Key Görüntüleme Logları</h1>
          <p className="text-xs text-[#606080]">Toplam {total} kayıt</p>
        </div>
        <button onClick={fetchLogs} className="ml-auto text-[#606080] hover:text-white transition-colors">
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="bg-[#16162a] border border-[#1e1e35] rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20 gap-3 text-[#606080]">
            <RefreshCw size={18} className="animate-spin" />
            <span className="text-sm">Yükleniyor...</span>
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <p className="text-[#606080] text-sm">Henüz log yok</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#1e1e35]">
                  <th className="text-left px-5 py-3.5 text-[#606080] font-medium">Kullanıcı</th>
                  <th className="text-left px-5 py-3.5 text-[#606080] font-medium">Key Adı</th>
                  <th className="text-left px-5 py-3.5 text-[#606080] font-medium">IP Adresi</th>
                  <th className="text-left px-5 py-3.5 text-[#606080] font-medium">Tarih / Saat</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-b border-[#1e1e35] last:border-0 hover:bg-[#1e1e35]/30 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="text-white font-medium">{log.userName}</div>
                      <div className="text-xs text-[#606080]">{log.userEmail}</div>
                    </td>
                    <td className="px-5 py-3.5">
                      <code className="text-xs px-2 py-1 rounded bg-[#f7931a]/10 text-[#f7931a] font-mono">
                        {log.keyName}
                      </code>
                    </td>
                    <td className="px-5 py-3.5 text-[#606080] font-mono text-xs">{log.ip ?? '-'}</td>
                    <td className="px-5 py-3.5 text-[#606080] text-xs">
                      {format(new Date(log.createdAt), 'dd.MM.yyyy HH:mm:ss', { locale: tr })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
