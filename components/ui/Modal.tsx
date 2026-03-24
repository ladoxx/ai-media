'use client'

import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg'
}

export function Modal({ open, onClose, title, children, size = 'md' }: ModalProps) {
  useEffect(() => {
    if (!open) return
    document.body.style.overflow = 'hidden'
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handleKey)
    return () => {
      document.body.style.overflow = ''
      document.removeEventListener('keydown', handleKey)
    }
  }, [open, onClose])

  if (!open) return null

  const widths = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl' }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className={`relative bg-[#16162a] border border-[#1e1e35] rounded-2xl p-6 w-full ${widths[size]} shadow-xl`}
        style={{ animation: 'fadeUp 0.15s ease' }}
      >
        {title && (
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-display font-bold text-lg text-white">{title}</h3>
            <button
              onClick={onClose}
              className="text-[#606080] hover:text-white transition-colors p-1 rounded-lg hover:bg-[#1e1e35]"
            >
              <X size={18} />
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  )
}

interface ConfirmModalProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmLabel?: string
  danger?: boolean
  loading?: boolean
}

export function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Onayla',
  danger = false,
  loading = false,
}: ConfirmModalProps) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <p className="text-[#606080] text-sm mb-6">{message}</p>
      <div className="flex gap-3">
        <button
          onClick={onClose}
          className="flex-1 py-2 px-4 border border-[#1e1e35] text-[#606080] hover:text-white rounded-lg text-sm transition-colors"
        >
          İptal
        </button>
        <button
          onClick={onConfirm}
          disabled={loading}
          className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${
            danger
              ? 'bg-red-500 hover:bg-red-600 text-white'
              : 'bg-[#00c896] hover:bg-[#00c896]/90 text-[#0a0a14]'
          }`}
        >
          {loading ? 'İşleniyor...' : confirmLabel}
        </button>
      </div>
    </Modal>
  )
}
