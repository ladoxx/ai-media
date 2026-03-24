'use client'

import { useState, useEffect } from 'react'
import { Bell, X } from 'lucide-react'

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; i++) outputArray[i] = rawData.charCodeAt(i)
  return outputArray
}

export function PushSubscribe() {
  const [show, setShow] = useState(false)
  const [subscribing, setSubscribing] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    // Don't show if: already dismissed, already subscribed, or not supported
    if (typeof window === 'undefined') return
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return
    if (Notification.permission === 'granted' || Notification.permission === 'denied') return
    if (localStorage.getItem('push_dismissed')) return

    const delay = parseInt(process.env.NEXT_PUBLIC_PUSH_DELAY ?? '10', 10) * 1000
    const timer = setTimeout(() => setShow(true), delay)
    return () => clearTimeout(timer)
  }, [])

  const subscribe = async () => {
    setSubscribing(true)
    try {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') { dismiss(); return }

      const reg = await navigator.serviceWorker.ready
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      if (!vapidKey) return

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      })

      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sub.toJSON()),
      })

      setDone(true)
      setTimeout(() => setShow(false), 2000)
    } catch {
      dismiss()
    } finally {
      setSubscribing(false)
    }
  }

  const dismiss = () => {
    localStorage.setItem('push_dismissed', '1')
    setShow(false)
  }

  if (!show) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-80 z-50 animate-in slide-in-from-bottom-4">
      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl shadow-2xl p-4">
        {done ? (
          <div className="flex items-center gap-3 text-emerald-400">
            <Bell size={18} />
            <p className="text-sm font-medium">Harika! Artık bildirim alacaksınız. ✅</p>
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between gap-2 mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 bg-[var(--color-accent-tech,#00c896)]/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <Bell size={16} className="text-[var(--color-accent-tech,#00c896)]" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[var(--text-primary)]">Yeni haberleri kaçırma!</p>
                  <p className="text-xs text-[var(--text-muted)]">Bildirim almak ister misin?</p>
                </div>
              </div>
              <button
                type="button"
                onClick={dismiss}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer flex-shrink-0 mt-0.5"
              >
                <X size={14} />
              </button>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={subscribe}
                disabled={subscribing}
                className="flex-1 py-2 bg-[var(--color-accent-tech,#00c896)] text-[#0d0d14] font-semibold text-sm rounded-lg hover:opacity-90 disabled:opacity-50 cursor-pointer transition-opacity"
              >
                {subscribing ? 'Bekleniyor...' : '✅ Evet, iste'}
              </button>
              <button
                type="button"
                onClick={dismiss}
                className="flex-1 py-2 bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-muted)] text-sm rounded-lg hover:text-[var(--text-primary)] cursor-pointer transition-colors"
              >
                ❌ Hayır
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
