'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { CheckCircle, XCircle, Info, FileText } from 'lucide-react'

interface LogRow {
  id: string
  type: string
  status: string
  message: string
  createdAt: Date | string
}

interface Props {
  logs: LogRow[]
}

type Filter = 'all' | 'success' | 'error' | 'info'

const FILTER_BUTTONS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'Tümü' },
  { key: 'success', label: '✅ Başarılı' },
  { key: 'error', label: '❌ Hatalı' },
  { key: 'info', label: 'ℹ️ Bilgi' },
]

function StatusBadge({ status }: { status: string }) {
  if (status === 'success') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-[#00c896]/10 text-[#00c896] border border-[#00c896]/20">
        <CheckCircle size={11} />
        Başarılı
      </span>
    )
  }
  if (status === 'error') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20">
        <XCircle size={11} />
        Hata
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
      <Info size={11} />
      Bilgi
    </span>
  )
}

export function LogsTable({ logs }: Props) {
  const [filter, setFilter] = useState<Filter>('all')

  const filtered = filter === 'all' ? logs : logs.filter((l) => l.status === filter)

  return (
    <div className="space-y-4">
      {/* Filter buttons */}
      <div className="flex items-center gap-2 flex-wrap">
        {FILTER_BUTTONS.map((btn) => {
          const count = btn.key === 'all' ? logs.length : logs.filter((l) => l.status === btn.key).length
          return (
            <button
              key={btn.key}
              onClick={() => setFilter(btn.key)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filter === btn.key
                  ? 'bg-[#f7931a] text-white'
                  : 'bg-[#16162a] border border-[#1e1e35] text-[#606080] hover:text-white'
              }`}
            >
              {btn.label}
              <span
                className={`px-1.5 py-0.5 rounded text-[10px] ${
                  filter === btn.key ? 'bg-white/20 text-white' : 'bg-[#1e1e35] text-[#606080]'
                }`}
              >
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* Table */}
      <div className="bg-[#16162a] border border-[#1e1e35] rounded-2xl overflow-hidden">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <FileText size={32} className="text-[#1e1e35]" />
            <p className="text-[#606080] text-sm">Henüz veri yok</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#1e1e35]">
                  <th className="text-left px-5 py-3.5 text-[#606080] font-medium">Tarih</th>
                  <th className="text-left px-5 py-3.5 text-[#606080] font-medium">Tip</th>
                  <th className="text-left px-5 py-3.5 text-[#606080] font-medium">Durum</th>
                  <th className="text-left px-5 py-3.5 text-[#606080] font-medium">Mesaj</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((log) => (
                  <tr
                    key={log.id}
                    className="border-b border-[#1e1e35] last:border-0 hover:bg-[#1e1e35]/30 transition-colors"
                  >
                    <td className="px-5 py-3.5 text-[#606080] whitespace-nowrap font-mono text-xs">
                      {format(new Date(log.createdAt), 'dd.MM.yyyy HH:mm')}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="px-2 py-0.5 rounded bg-[#1e1e35] text-[#606080] text-xs font-mono">
                        {log.type}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={log.status} />
                    </td>
                    <td className="px-5 py-3.5 text-white max-w-sm">
                      <span title={log.message}>
                        {log.message.length > 80 ? log.message.slice(0, 80) + '...' : log.message}
                      </span>
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
