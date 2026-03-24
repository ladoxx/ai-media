'use client'

import { useEffect, useState, useRef } from 'react'

interface AdData {
  id: string
  name: string
  type: 'ADSENSE_AUTO' | 'ADSENSE_MANUAL' | 'CUSTOM_HTML' | 'AFFILIATE_BANNER' | 'SPONSORED'
  code: string
  imageUrl: string | null
  linkUrl: string | null
  abGroup: string | null
  isAbTest: boolean
}

interface AdZoneProps {
  slug: string
  className?: string
  page?: string
}

declare global {
  interface Window {
    adsbygoogle?: unknown[]
  }
}

function AdsenseManual({ code }: { code: string }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!ref.current) return
    try {
      ref.current.innerHTML = code
      // Push to adsbygoogle queue
      if (typeof window !== 'undefined') {
        window.adsbygoogle = window.adsbygoogle || []
        window.adsbygoogle.push({})
      }
    } catch {}
  }, [code])

  if (process.env.NODE_ENV === 'development') {
    return <AdPlaceholder label="AdSense Manuel" />
  }

  return <div ref={ref} />
}

function CustomHtml({ code }: { code: string }) {
  if (process.env.NODE_ENV === 'development') {
    return <AdPlaceholder label="Özel HTML" />
  }
  // eslint-disable-next-line react/no-danger
  return <div dangerouslySetInnerHTML={{ __html: code }} />
}

function AffiliateBanner({ ad, page }: { ad: AdData; page?: string }) {
  const href = `/api/reklam/tikla/${ad.id}${page ? `?page=${encodeURIComponent(page)}` : ''}`

  if (!ad.imageUrl) return null

  return (
    <a href={href} target="_blank" rel="noopener sponsored" className="block">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={ad.imageUrl}
        alt={ad.name}
        className="w-full h-auto rounded"
        loading="lazy"
      />
    </a>
  )
}

function SponsoredContent({ ad, page }: { ad: AdData; page?: string }) {
  const href = `/api/reklam/tikla/${ad.id}${page ? `?page=${encodeURIComponent(page)}` : ''}`

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener sponsored"
      className="block border border-[#1e1e35] rounded-xl overflow-hidden hover:border-[#f7931a]/40 transition-colors"
    >
      {ad.imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={ad.imageUrl} alt={ad.name} className="w-full h-auto" loading="lazy" />
      )}
      <div className="p-3">
        <span className="text-[10px] text-[#606080] uppercase tracking-wider">Sponsorlu</span>
        <p className="text-sm text-white font-medium mt-0.5">{ad.name}</p>
      </div>
    </a>
  )
}

function AdPlaceholder({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center bg-[#0a0a14] border border-dashed border-[#2a2a45] rounded-lg min-h-[60px] text-[#404060] text-xs font-mono">
      📢 {label} [Dev Placeholder]
    </div>
  )
}

export function AdZone({ slug, className, page }: AdZoneProps) {
  const [ad, setAd] = useState<AdData | null>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    fetch(`/api/reklam/goster/${slug}`)
      .then((r) => r.json())
      .then((data) => {
        setAd(data || null)
        setLoaded(true)
      })
      .catch(() => setLoaded(true))
  }, [slug])

  if (!loaded) return null
  if (!ad) return null

  const inner = (() => {
    switch (ad.type) {
      case 'ADSENSE_AUTO':
        if (process.env.NODE_ENV === 'development') return <AdPlaceholder label="AdSense Auto" />
        return (
          <div dangerouslySetInnerHTML={{ __html: ad.code }} />
        )
      case 'ADSENSE_MANUAL':
        return <AdsenseManual code={ad.code} />
      case 'CUSTOM_HTML':
        return <CustomHtml code={ad.code} />
      case 'AFFILIATE_BANNER':
        return <AffiliateBanner ad={ad} page={page} />
      case 'SPONSORED':
        return <SponsoredContent ad={ad} page={page} />
      default:
        return null
    }
  })()

  if (!inner) return null

  return (
    <div className={className} data-ad-zone={slug} data-ad-id={ad.id}>
      {inner}
    </div>
  )
}
