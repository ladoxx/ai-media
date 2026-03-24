'use client'

import { useEffect, useState, useRef, useCallback, DragEvent, ChangeEvent } from 'react'

type MediaFile = {
  name: string
  url: string
  size: number
  createdAt: string
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

function SkeletonCard() {
  return (
    <div className="bg-[#16162a] border border-[#1e1e35] rounded-xl overflow-hidden animate-pulse">
      <div className="aspect-square bg-[#1e1e35]" />
      <div className="p-3 space-y-2">
        <div className="h-3 bg-[#1e1e35] rounded w-3/4" />
        <div className="h-3 bg-[#1e1e35] rounded w-1/2" />
        <div className="flex gap-2 mt-2">
          <div className="h-7 bg-[#1e1e35] rounded flex-1" />
          <div className="h-7 w-7 bg-[#1e1e35] rounded" />
        </div>
      </div>
    </div>
  )
}

export default function EditorMedyaPage() {
  const [files, setFiles] = useState<MediaFile[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [copiedName, setCopiedName] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const fetchFiles = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/medya')
      if (!res.ok) throw new Error('Fetch failed')
      const data = await res.json()
      setFiles(Array.isArray(data) ? data : data.files ?? [])
    } catch {
      setFiles([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchFiles()
  }, [fetchFiles])

  const showSuccess = (msg: string) => {
    setSuccessMessage(msg)
    setTimeout(() => setSuccessMessage(null), 3000)
  }

  const showError = (msg: string) => {
    setErrorMessage(msg)
    setTimeout(() => setErrorMessage(null), 4000)
  }

  const uploadFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      showError('Yalnızca görsel dosyaları yüklenebilir.')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      showError('Dosya boyutu 5MB\'ı geçemez.')
      return
    }

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/medya', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? 'Yükleme başarısız')
      }

      const newFile: MediaFile = await res.json()
      setFiles((prev) => [newFile, ...prev])
      showSuccess(`"${file.name}" başarıyla yüklendi.`)
    } catch (err: unknown) {
      showError(err instanceof Error ? err.message : 'Yükleme sırasında hata oluştu.')
    } finally {
      setUploading(false)
    }
  }

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) uploadFile(file)
    e.target.value = ''
  }

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) uploadFile(file)
  }

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = () => {
    setDragOver(false)
  }

  const handleDelete = async (name: string) => {
    if (!window.confirm(`"${name}" dosyasını silmek istediğinize emin misiniz?`)) return
    try {
      const res = await fetch(`/api/medya?name=${encodeURIComponent(name)}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Silme başarısız')
      setFiles((prev) => prev.filter((f) => f.name !== name))
      showSuccess('Dosya silindi.')
    } catch {
      showError('Dosya silinirken hata oluştu.')
    }
  }

  const handleCopyUrl = (file: MediaFile) => {
    const fullUrl = `${window.location.origin}${file.url}`
    navigator.clipboard.writeText(fullUrl).then(() => {
      setCopiedName(file.name)
      setTimeout(() => setCopiedName(null), 1200)
    })
  }

  return (
    <div className="min-h-screen bg-[#0a0a14] text-[#f0f0fa] p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-bold">Medya Kütüphanesi</h1>
        <p className="text-[#606080] text-sm mt-0.5">{files.length} dosya</p>
      </div>

      {/* Alerts */}
      {successMessage && (
        <div className="flex items-center gap-3 px-4 py-3 bg-[#00c896]/10 border border-[#00c896]/30 rounded-lg text-[#00c896] text-sm">
          <span>✓</span>
          {successMessage}
        </div>
      )}
      {errorMessage && (
        <div className="flex items-center gap-3 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
          <span>✕</span>
          {errorMessage}
        </div>
      )}

      {/* Upload Zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !uploading && fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all ${
          dragOver
            ? 'border-[#00c896] bg-[#00c896]/5'
            : 'border-[#1e1e35] hover:border-[#606080] hover:bg-[#16162a]/50'
        } ${uploading ? 'pointer-events-none opacity-70' : ''}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileInputChange}
        />

        {uploading ? (
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-3 border-[#00c896] border-t-transparent rounded-full animate-spin" />
            <p className="text-[#606080] text-sm">Yükleniyor...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div
              className={`text-4xl transition-transform ${dragOver ? 'scale-110' : ''}`}
            >
              {dragOver ? '📂' : '🖼️'}
            </div>
            <p className="text-[#f0f0fa] font-medium text-sm">
              Görsel yüklemek için buraya sürükleyin
            </p>
            <p className="text-[#606080] text-xs">veya</p>
            <button
              type="button"
              className="px-4 py-2 rounded-lg bg-[#16162a] border border-[#1e1e35] text-sm text-[#f0f0fa] hover:border-[#00c896] hover:text-[#00c896] transition-colors"
            >
              Dosya Seç
            </button>
            <p className="text-[#606080] text-xs">JPEG, PNG, WebP, GIF — Maks. 5MB</p>
          </div>
        )}
      </div>

      {/* File Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : files.length === 0 ? (
        <div className="text-center py-16 text-[#606080] text-sm">
          Henüz yüklenmiş görsel yok.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {files.map((file) => (
            <div
              key={file.name}
              className="bg-[#16162a] border border-[#1e1e35] rounded-xl overflow-hidden group hover:border-[#606080] transition-colors"
            >
              {/* Preview */}
              <div className="aspect-square relative overflow-hidden bg-[#0a0a14]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={file.url}
                  alt={file.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
              </div>

              {/* Info */}
              <div className="p-3 space-y-2">
                <p
                  className="text-[#f0f0fa] text-xs font-medium truncate"
                  title={file.name}
                >
                  {file.name}
                </p>
                <p className="text-[#606080] text-xs">{formatSize(file.size)}</p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopyUrl(file)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                      copiedName === file.name
                        ? 'border-[#00c896] bg-[#00c896]/10 text-[#00c896]'
                        : 'border-[#1e1e35] text-[#606080] hover:border-[#00c896] hover:text-[#00c896]'
                    }`}
                  >
                    {copiedName === file.name ? '✓ Kopyalandı' : 'Kopyala URL'}
                  </button>
                  <button
                    onClick={() => handleDelete(file.name)}
                    className="p-1.5 rounded-lg border border-[#1e1e35] text-red-400 hover:border-red-400/50 hover:bg-red-500/10 transition-colors text-xs"
                    title="Sil"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
