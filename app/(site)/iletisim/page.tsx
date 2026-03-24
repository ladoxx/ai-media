'use client'

import { useState } from 'react'
import { StaticPageHero } from '@/components/site/StaticPageHero'
import { Button } from '@/components/ui/Button'
import { Mail, MapPin, Clock } from 'lucide-react'

export default function IletisimPage() {
  const [form, setForm] = useState({ ad: '', email: '', konu: '', mesaj: '', kvkk: false })
  const [status, setStatus] = useState<'idle' | 'loading' | 'ok' | 'err'>('idle')
  const [errMsg, setErrMsg] = useState('')

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value, type } = e.target
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('loading')
    setErrMsg('')
    try {
      const res = await fetch('/api/iletisim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (res.ok) { setStatus('ok') } else { setStatus('err'); setErrMsg(data.error ?? 'Hata') }
    } catch { setStatus('err'); setErrMsg('Bağlantı hatası.') }
  }

  return (
    <div>
      <StaticPageHero title="İletişim" description="Bizimle iletişime geçin" icon="✉️" />
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Info */}
          <div className="space-y-6">
            <div>
              <h2 className="font-display font-bold text-xl text-[var(--text-primary)] mb-4">İletişim Bilgileri</h2>
              <div className="space-y-4">
                {[
                  { icon: <Mail className="w-5 h-5 text-accent-tech" />, label: 'E-posta', val: 'iletisim@cyba.com.tr' },
                  { icon: <MapPin className="w-5 h-5 text-accent-real" />, label: 'Konum', val: 'İstanbul, Türkiye' },
                  { icon: <Clock className="w-5 h-5 text-accent-crypto" />, label: 'Çalışma Saatleri', val: 'Hft içi 09:00 – 18:00' },
                ].map((item) => (
                  <div key={item.label} className="flex items-start gap-3 p-4 bg-[var(--bg-card)] rounded-xl border border-[var(--border)]">
                    {item.icon}
                    <div>
                      <p className="text-xs text-[var(--text-muted)]">{item.label}</p>
                      <p className="text-sm font-medium text-[var(--text-primary)]">{item.val}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] p-6">
            {status === 'ok' ? (
              <div className="text-center py-10">
                <p className="text-4xl mb-3">✅</p>
                <h3 className="font-display font-bold text-xl text-[var(--text-primary)] mb-2">Mesajınız Alındı!</h3>
                <p className="text-[var(--text-muted)]">En kısa sürede dönüş yapacağız.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <h2 className="font-display font-bold text-xl text-[var(--text-primary)] mb-2">Mesaj Gönder</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-[var(--text-muted)] mb-1 block">Adınız *</label>
                    <input name="ad" value={form.ad} onChange={handleChange} required placeholder="Ad Soyad"
                      className="w-full px-3 py-2.5 rounded-lg bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-accent-tech text-sm" />
                  </div>
                  <div>
                    <label className="text-xs text-[var(--text-muted)] mb-1 block">E-posta *</label>
                    <input name="email" type="email" value={form.email} onChange={handleChange} required placeholder="email@ornek.com"
                      className="w-full px-3 py-2.5 rounded-lg bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-accent-tech text-sm" />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-[var(--text-muted)] mb-1 block">Konu *</label>
                  <select name="konu" value={form.konu} onChange={handleChange} required
                    className="w-full px-3 py-2.5 rounded-lg bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-primary)] focus:outline-none focus:border-accent-tech text-sm">
                    <option value="">Seçiniz...</option>
                    <option>Reklam Talebi</option>
                    <option>İşbirliği</option>
                    <option>İçerik Önerisi</option>
                    <option>Şikayet</option>
                    <option>Diğer</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-[var(--text-muted)] mb-1 block">Mesajınız *</label>
                  <textarea name="mesaj" value={form.mesaj} onChange={handleChange} required rows={5} placeholder="Mesajınızı buraya yazın..."
                    className="w-full px-3 py-2.5 rounded-lg bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-accent-tech text-sm resize-none" />
                </div>
                <label className="flex items-start gap-2 cursor-pointer">
                  <input type="checkbox" name="kvkk" checked={form.kvkk} onChange={handleChange} required className="mt-0.5 accent-accent-tech" />
                  <span className="text-xs text-[var(--text-muted)]">
                    <a href="/kvkk" className="text-accent-tech hover:underline">KVKK Aydınlatma Metni</a>'ni okudum ve kabul ediyorum.
                  </span>
                </label>
                {status === 'err' && <p className="text-sm text-red-400">{errMsg}</p>}
                <Button type="submit" loading={status === 'loading'} className="w-full">Gönder</Button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
