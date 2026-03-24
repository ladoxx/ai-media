'use client'

import { useEffect } from 'react'

export function ViewCounter({ slug }: { slug: string }) {
  useEffect(() => {
    fetch(`/api/yazilar/${slug}`, { method: 'POST' }).catch(() => {})
  }, [slug])

  return null
}
