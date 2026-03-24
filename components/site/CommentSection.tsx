'use client'

import { useState, useEffect, useRef } from 'react'
import { MessageSquare, ThumbsUp, CornerDownRight, Send, Loader2, Check, AlertCircle } from 'lucide-react'
import { getGravatarUrl, getInitials, getAvatarColor } from '@/lib/gravatar'

interface CommentReply {
  id: string
  name: string
  content: string
  likes: number
  createdAt: string
}

interface Comment {
  id: string
  name: string
  content: string
  likes: number
  createdAt: string
  replies: CommentReply[]
}

interface Props {
  postId: string
  initialCount?: number
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' })
}

function Avatar({ name, size = 40 }: { name: string; size?: number }) {
  const [imgError, setImgError] = useState(false)
  const color = getAvatarColor(name)
  const initials = getInitials(name)

  // We don't have the email here (privacy), so always use initials
  return (
    <div
      className="flex items-center justify-center rounded-full font-bold text-white flex-shrink-0"
      style={{ width: size, height: size, background: color, fontSize: size * 0.35 }}
    >
      {initials}
    </div>
  )
}

function CommentItem({
  comment,
  onLike,
  onReply,
  showLikes,
}: {
  comment: Comment | CommentReply
  onLike: (id: string) => void
  onReply?: (name: string, id: string) => void
  showLikes: boolean
}) {
  const [liked, setLiked]   = useState(false)
  const [likes, setLikes]   = useState(comment.likes)

  const handleLike = async () => {
    if (liked) return
    setLiked(true)
    setLikes((n) => n + 1)
    await fetch(`/api/yorumlar/${comment.id}/like`, { method: 'POST' })
    onLike(comment.id)
  }

  return (
    <div className="flex gap-3">
      <Avatar name={comment.name} size={38} />
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 mb-1">
          <span className="text-sm font-semibold text-[var(--text-primary)]">{comment.name}</span>
          <span className="text-xs text-[var(--text-muted)]">{formatDate(comment.createdAt)}</span>
        </div>
        <p className="text-sm text-[var(--text-muted)] leading-relaxed mb-2">{comment.content}</p>
        <div className="flex items-center gap-3">
          {showLikes && (
            <button onClick={handleLike}
              className={`flex items-center gap-1 text-xs transition-colors ${liked ? 'text-[var(--color-accent-tech,#00c896)]' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}>
              <ThumbsUp className="w-3.5 h-3.5" />
              <span>{likes > 0 ? likes : ''}</span>
            </button>
          )}
          {onReply && (
            <button onClick={() => onReply(comment.name, comment.id)}
              className="flex items-center gap-1 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
              <CornerDownRight className="w-3.5 h-3.5" />Yanıtla
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function CommentForm({
  postId,
  parentId,
  replyTo,
  onCancel,
  onSuccess,
}: {
  postId: string
  parentId?: string
  replyTo?: string
  onCancel?: () => void
  onSuccess: (msg: string) => void
}) {
  const [name, setName]     = useState('')
  const [email, setEmail]   = useState('')
  const [content, setContent] = useState(replyTo ? `@${replyTo} ` : '')
  const [kvkk, setKvkk]     = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState('')
  // Honeypot
  const honeypotRef = useRef<HTMLInputElement>(null)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!kvkk) { setError('KVKK metnini onaylamanız gerekiyor.'); return }
    setLoading(true)
    setError('')

    const res = await fetch('/api/yorumlar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        postId,
        parentId,
        name: name.trim(),
        email: email.trim(),
        content: content.trim(),
        honeypot: honeypotRef.current?.value ?? '',
      }),
    })

    const data = await res.json()
    setLoading(false)
    if (!res.ok) { setError(data.error ?? 'Bir hata oluştu.'); return }
    onSuccess(data.message)
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      {replyTo && (
        <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
          <CornerDownRight className="w-3.5 h-3.5" />
          <span><strong>{replyTo}</strong>'e yanıt yazıyorsunuz</span>
          {onCancel && <button type="button" onClick={onCancel} className="ml-auto text-[var(--text-muted)] hover:text-[var(--text-primary)]">İptal</button>}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-[var(--text-muted)] mb-1">Ad Soyad *</label>
          <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Adınız"
            className="w-full px-3 py-2.5 text-sm rounded-lg bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--color-accent-tech,#00c896)] transition-colors" />
        </div>
        <div>
          <label className="block text-xs text-[var(--text-muted)] mb-1">Email * <span className="text-[var(--text-muted)] opacity-60">(gizli tutulur)</span></label>
          <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@örnek.com"
            className="w-full px-3 py-2.5 text-sm rounded-lg bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--color-accent-tech,#00c896)] transition-colors" />
        </div>
      </div>

      <div>
        <label className="block text-xs text-[var(--text-muted)] mb-1">Yorum *</label>
        <textarea required value={content} onChange={(e) => setContent(e.target.value)} rows={4}
          placeholder="Yorumunuzu yazın..."
          className="w-full px-3 py-2.5 text-sm rounded-lg bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--color-accent-tech,#00c896)] transition-colors resize-none" />
      </div>

      {/* Honeypot — hidden from humans */}
      <input ref={honeypotRef} type="text" name="website" tabIndex={-1} aria-hidden="true"
        className="absolute opacity-0 pointer-events-none h-0 w-0 overflow-hidden" />

      <div className="flex items-start gap-2">
        <input type="checkbox" id="kvkk" checked={kvkk} onChange={(e) => setKvkk(e.target.checked)}
          className="mt-0.5 accent-[var(--color-accent-tech,#00c896)] w-4 h-4 cursor-pointer flex-shrink-0" />
        <label htmlFor="kvkk" className="text-xs text-[var(--text-muted)] cursor-pointer leading-relaxed">
          <a href="/kvkk" target="_blank" className="underline hover:text-[var(--text-primary)]">KVKK aydınlatma metnini</a> okudum ve onaylıyorum.
        </label>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      <div className="flex items-center gap-3">
        <button type="submit" disabled={loading}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors disabled:opacity-60"
          style={{ background: 'var(--color-accent-tech, #00c896)', color: '#0d0d14' }}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          {loading ? 'Gönderiliyor...' : 'Yorum Gönder'}
        </button>
      </div>
    </form>
  )
}

export function CommentSection({ postId, initialCount = 0 }: Props) {
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading]   = useState(true)
  const [replyTo, setReplyTo]   = useState<{ name: string; id: string } | null>(null)
  const [success, setSuccess]   = useState('')
  const formRef = useRef<HTMLDivElement>(null)

  const load = async () => {
    setLoading(true)
    const res = await fetch(`/api/yorumlar?postId=${postId}`)
    const data = await res.json()
    setComments(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  useEffect(() => { load() }, [postId])

  const handleSuccess = (msg: string) => {
    setSuccess(msg)
    setReplyTo(null)
    setTimeout(() => setSuccess(''), 5000)
    load()
  }

  const handleReplyClick = (name: string, id: string) => {
    setReplyTo({ name, id })
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100)
  }

  const total = comments.length + comments.reduce((sum, c) => sum + c.replies.length, 0)

  return (
    <section className="mt-12 pt-8 border-t border-[var(--border)]">
      {/* Header */}
      <h2 className="flex items-center gap-2 text-xl font-display font-bold text-[var(--text-primary)] mb-8">
        <MessageSquare className="w-5 h-5" style={{ color: 'var(--color-accent-tech, #00c896)' }} />
        {total} Yorum
      </h2>

      {/* Comment List */}
      {loading ? (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--color-accent-tech, #00c896)' }} />
        </div>
      ) : comments.length === 0 ? (
        <p className="text-sm text-[var(--text-muted)] mb-8">İlk yorumu siz yapın!</p>
      ) : (
        <div className="space-y-6 mb-10">
          {comments.map((comment) => (
            <div key={comment.id}>
              <CommentItem
                comment={comment}
                onLike={() => {}}
                onReply={handleReplyClick}
                showLikes={true}
              />
              {comment.replies.length > 0 && (
                <div className="ml-12 mt-4 space-y-4 pl-4 border-l-2 border-[var(--border)]">
                  {comment.replies.map((reply) => (
                    <CommentItem key={reply.id} comment={reply} onLike={() => {}} showLikes={true} />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Form */}
      <div ref={formRef} className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-6">
        <h3 className="text-base font-display font-bold text-[var(--text-primary)] mb-5">
          💬 {replyTo ? `${replyTo.name}'e Yanıt Yaz` : 'Yorum Yaz'}
        </h3>

        {success ? (
          <div className="flex items-center gap-3 p-4 rounded-xl text-sm font-medium"
            style={{ background: 'var(--color-accent-tech,#00c896)22', color: 'var(--color-accent-tech,#00c896)', border: '1px solid var(--color-accent-tech,#00c896)44' }}>
            <Check className="w-5 h-5 flex-shrink-0" />
            {success}
          </div>
        ) : (
          <CommentForm
            postId={postId}
            parentId={replyTo?.id}
            replyTo={replyTo?.name}
            onCancel={() => setReplyTo(null)}
            onSuccess={handleSuccess}
          />
        )}
      </div>
    </section>
  )
}
