import type { Page } from '@/app/generated/prisma/client'
import { LegalTemplate } from './LegalTemplate'
import { DefaultTemplate } from './DefaultTemplate'
import { ContactTemplate } from './ContactTemplate'
import { AboutTemplate } from './AboutTemplate'
import { AdvertisingTemplate } from './AdvertisingTemplate'
import { LandingTemplate } from './LandingTemplate'

interface Props {
  page: Page
}

export function PageRenderer({ page }: Props) {
  switch (page.template) {
    case 'legal':       return <LegalTemplate page={page} />
    case 'contact':     return <ContactTemplate page={page} />
    case 'about':       return <AboutTemplate page={page} />
    case 'advertising': return <AdvertisingTemplate page={page} />
    case 'landing':     return <LandingTemplate page={page} />
    default:            return <DefaultTemplate page={page} />
  }
}

export const TEMPLATES = [
  { id: 'default',     label: 'Standart Sayfa',       icon: '📄' },
  { id: 'legal',       label: 'Yasal Metin',           icon: '⚖️' },
  { id: 'contact',     label: 'İletişim',              icon: '📬' },
  { id: 'about',       label: 'Hakkımızda',            icon: '🧭' },
  { id: 'advertising', label: 'Reklam / Medya Kiti',   icon: '📢' },
  { id: 'landing',     label: 'Landing Page',          icon: '🚀' },
  { id: 'blank',       label: 'Boş (Tam Özel)',        icon: '⬜' },
]
