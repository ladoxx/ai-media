'use client'

import { useState, useEffect } from 'react'
import { Save, Code } from 'lucide-react'

interface Codes {
  custom_head_code: string
  custom_body_start_code: string
  custom_body_end_code: string
}

const DEFAULT: Codes = {
  custom_head_code: '',
  custom_body_start_code: '',
  custom_body_end_code: '',
}

export default function KodEnjesiyonPage() {
  const [codes, setCodes] = useState<Codes>(DEFAULT)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    fetch('/api/superadmin/pluginler/kod')
      .then((r) => r.json())
      .then((d) => setCodes({ ...DEFAULT, ...d }))
      .finally(() => setLoading(false))
  }, [])

  const save = async () => {
    setSaving(true)
    const res = await fetch('/api/superadmin/pluginler/kod', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(codes),
    })
    setSaving(false)
    setMessage(res.ok ? { type: 'success', text: 'Kodlar kaydedildi ve siteye uygulandı.' } : { type: 'error', text: 'Kayıt başarısız.' })
    setTimeout(() => setMessage(null), 4000)
  }

  const textareaBase = 'w-full px-3 py-3 rounded-lg bg-[#0a0a14] border border-[#1e1e35] text-[#00ff88] font-mono text-xs focus:outline-none focus:border-[#00c896] placeholder-[#404060] resize-none'

  if (loading) return <div className="p-8 text-center text-[#606080] text-sm">Yükleniyor...</div>

  return (
    <div className="p-6 max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-white flex items-center gap-2">
          <Code size={18} className="text-[#00c896]" /> Özel Kod Enjeksiyonu
        </h1>
        <div className="flex items-center gap-3">
          {message && (
            <span className={`text-xs px-3 py-1 rounded-full ${message.type === 'success' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
              {message.text}
            </span>
          )}
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-[#00c896] text-[#0a0a14] font-semibold text-sm rounded-lg hover:bg-[#00c896]/90 disabled:opacity-50 cursor-pointer"
          >
            <Save size={14} />
            {saving ? 'Kaydediliyor...' : 'Kaydet ve Uygula'}
          </button>
        </div>
      </div>

      <p className="text-xs text-[#606080] -mt-2">Google Tag Manager, özel meta tagları, chat widget'ları veya diğer kodları buraya ekleyin.</p>

      {[
        { key: 'custom_head_code' as const, label: '🔝 HEAD Kodu', desc: '<head> içine eklenecek kod (analytics, meta taglar, font vb.)' },
        { key: 'custom_body_start_code' as const, label: '⬇️ Body Başlangıç Kodu', desc: '<body> etiketinden hemen sonra eklenecek kod' },
        { key: 'custom_body_end_code' as const, label: '⬆️ Body Sonu Kodu', desc: '</body> etiketinden hemen önce eklenecek kod (chat widget, GTM vb.)' },
      ].map((section) => (
        <div key={section.key} className="bg-[#16162a] border border-[#1e1e35] rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-[#1e1e35]">
            <p className="text-sm font-semibold text-white">{section.label}</p>
            <p className="text-xs text-[#606080] mt-0.5">{section.desc}</p>
          </div>
          <div className="p-3">
            <textarea
              value={codes[section.key]}
              onChange={(e) => setCodes((prev) => ({ ...prev, [section.key]: e.target.value }))}
              rows={6}
              className={textareaBase}
              placeholder="<!-- Kodunuzu buraya yapıştırın -->"
              spellCheck={false}
            />
          </div>
        </div>
      ))}
    </div>
  )
}
