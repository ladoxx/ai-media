'use client'

import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { X, CheckCircle, AlertCircle, AlertTriangle } from 'lucide-react'

type ToastType = 'success' | 'error' | 'warning'

interface Toast {
  id: string
  type: ToastType
  message: string
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void
  success: (message: string) => void
  error: (message: string) => void
  warning: (message: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const addToast = useCallback((message: string, type: ToastType = 'success') => {
    const id = Math.random().toString(36).slice(2)
    setToasts((prev) => [...prev, { id, type, message }])
    setTimeout(() => removeToast(id), 3000)
  }, [removeToast])

  const ctx: ToastContextValue = {
    toast: addToast,
    success: (msg) => addToast(msg, 'success'),
    error: (msg) => addToast(msg, 'error'),
    warning: (msg) => addToast(msg, 'warning'),
  }

  return (
    <ToastContext.Provider value={ctx}>
      {children}
      {/* Toast container */}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onClose={() => removeToast(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

function ToastItem({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  const configs = {
    success: { icon: <CheckCircle size={16} />, color: 'text-[#00c896]', bg: 'border-[#00c896]/30 bg-[#00c896]/10' },
    error:   { icon: <AlertCircle size={16} />,   color: 'text-red-400',    bg: 'border-red-400/30 bg-red-400/10' },
    warning: { icon: <AlertTriangle size={16} />, color: 'text-yellow-400', bg: 'border-yellow-400/30 bg-yellow-400/10' },
  }
  const { icon, color, bg } = configs[toast.type]

  return (
    <div
      className={`pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-xl border bg-[#16162a] shadow-lg min-w-[280px] max-w-[380px] ${bg}`}
      style={{ animation: 'fadeUp 0.2s ease' }}
    >
      <span className={color}>{icon}</span>
      <p className="text-sm text-white flex-1">{toast.message}</p>
      <button onClick={onClose} className="text-[#606080] hover:text-white transition-colors">
        <X size={14} />
      </button>
    </div>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside ToastProvider')
  return ctx
}
