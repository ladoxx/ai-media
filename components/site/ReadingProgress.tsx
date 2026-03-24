'use client'

import { useState, useEffect } from 'react'

const colorMap: Record<string, string> = {
  tech:   'bg-accent-tech',
  crypto: 'bg-accent-crypto',
  real:   'bg-accent-real',
  game:   'bg-accent-game',
}

export function ReadingProgress({ color }: { color: string }) {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const update = () => {
      const scrollTop = window.scrollY
      const docHeight = document.documentElement.scrollHeight - window.innerHeight
      setProgress(docHeight > 0 ? Math.min((scrollTop / docHeight) * 100, 100) : 0)
    }
    window.addEventListener('scroll', update, { passive: true })
    return () => window.removeEventListener('scroll', update)
  }, [])

  return (
    <div className="fixed top-0 left-0 right-0 z-[999] h-0.5 bg-[var(--border)]">
      <div
        className={`h-full ${colorMap[color] ?? 'bg-accent-tech'}`}
        style={{ width: `${progress}%`, transition: 'width 80ms linear' }}
      />
    </div>
  )
}
