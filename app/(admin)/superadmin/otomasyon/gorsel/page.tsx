'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { useToast } from '@/components/ui/Toast'
import { Cloud, Save, Eye, EyeOff, Copy, RefreshCw } from 'lucide-react'
import { DEFAULT_WORKER_CODE } from '@/lib/cloudflare-default-code'

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false })

const INPUT =
  'w-full px-3 py-2.5 rounded-lg bg-[#0a0a14] border border-[#1e1e35] text-white text-sm focus:outline-none focus:border-[#f7931a]'

export default function GorselAyarlarPage() {
  const { success, error } = useToast()

  const [workerUrl, setWorkerUrl] = useState('')
  const [secretKey, setSecretKey] = useState('')
  const [watermarkText, setWatermarkText] = useState('')
  const [showSecret, setShowSecret] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/superadmin/gorsel-ayarlar')
        if (!res.ok) throw new Error()
        const data = await res.json() as { workerUrl: string; secretKey: string; watermarkText: string }
        setWorkerUrl(data.workerUrl || '')
        setSecretKey(data.secretKey || '')
        setWatermarkText(data.watermarkText || '')
      } catch {
        error('Ayarlar yüklenemedi')
      } finally {
        setLoading(false)
      }
    }
    load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch('/api/superadmin/gorsel-ayarlar', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workerUrl, secretKey, watermarkText }),
      })
      if (!res.ok) throw new Error()
      success('Ayarlar kaydedildi')
    } catch {
      error('Kayıt başarısız')
    } finally {
      setSaving(false)
    }
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(DEFAULT_WORKER_CODE)
      success('Kod kopyalandı!')
    } catch {
      error('Kopyalama başarısız')
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#f7931a]/10 flex items-center justify-center">
          <Cloud size={20} className="text-[#f7931a]" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">Görsel Üretim Ayarları</h1>
          <p className="text-xs text-[#606080]">Cloudflare Worker bağlantı ve watermark ayarları</p>
        </div>
      </div>

      {/* Settings card */}
      <div className="bg-[#16162a] border border-[#1e1e35] rounded-2xl p-5 space-y-5">
        <h2 className="text-sm font-semibold text-white">Bağlantı Ayarları</h2>

        {loading ? (
          <div className="flex items-center gap-2 text-[#606080] text-sm">
            <RefreshCw size={14} className="animate-spin" /> Yükleniyor...
          </div>
        ) : (
          <div className="space-y-4">
            {/* Worker URL */}
            <div>
              <label className="block text-xs text-[#606080] mb-1.5">
                Worker URL <span className="font-mono text-[#f7931a]">CF_WORKER_URL</span>
              </label>
              <input
                type="url"
                className={INPUT}
                placeholder="https://..."
                value={workerUrl}
                onChange={(e) => setWorkerUrl(e.target.value)}
              />
            </div>

            {/* Secret Key */}
            <div>
              <label className="block text-xs text-[#606080] mb-1.5">
                Secret Key <span className="font-mono text-[#f7931a]">CF_SECRET_KEY</span>
              </label>
              <div className="relative">
                <input
                  type={showSecret ? 'text' : 'password'}
                  className={INPUT + ' pr-10'}
                  placeholder="••••••••"
                  value={secretKey}
                  onChange={(e) => setSecretKey(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowSecret((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#606080] hover:text-white transition-colors"
                >
                  {showSecret ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Watermark */}
            <div>
              <label className="block text-xs text-[#606080] mb-1.5">
                Watermark Metni <span className="font-mono text-[#f7931a]">WATERMARK_TEXT</span>
              </label>
              <input
                type="text"
                className={INPUT}
                placeholder="Para Pusulası"
                value={watermarkText}
                onChange={(e) => setWatermarkText(e.target.value)}
              />
            </div>

            {/* Save button */}
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#f7931a] hover:bg-[#f7931a]/90 text-white text-sm font-medium transition-colors disabled:opacity-50"
            >
              {saving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
              {saving ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
          </div>
        )}
      </div>

      {/* Worker code section */}
      <div className="bg-[#16162a] border border-[#1e1e35] rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white">Cloudflare Worker Kodu</h2>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0a0a14] border border-[#1e1e35] text-xs text-[#606080] hover:text-white hover:border-[#2a2a45] transition-colors"
          >
            <Copy size={13} /> Kopyala
          </button>
        </div>

        <p className="text-xs text-[#606080]">
          Bu kodu kopyalayıp Cloudflare dashboard → Workers → worker adı → Edit code bölümüne yapıştırın.
        </p>

        <div className="rounded-xl overflow-hidden border border-[#1e1e35]">
          <MonacoEditor
            height="400px"
            language="javascript"
            theme="vs-dark"
            value={DEFAULT_WORKER_CODE}
            options={{
              readOnly: true,
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              fontSize: 13,
              lineNumbers: 'on',
              wordWrap: 'on',
            }}
          />
        </div>
      </div>
    </div>
  )
}
