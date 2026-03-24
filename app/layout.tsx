import type { Metadata } from 'next'
import { Syne, DM_Sans, JetBrains_Mono } from 'next/font/google'
import Script from 'next/script'
import './globals.css'

const syne = Syne({
  variable: '--font-syne',
  subsets: ['latin'],
  weight: ['600', '700', '800'],
})

const dmSans = DM_Sans({
  variable: '--font-dm-sans',
  subsets: ['latin'],
  weight: ['400', '500', '600'],
})

const jetbrainsMono = JetBrains_Mono({
  variable: '--font-jetbrains',
  subsets: ['latin'],
  weight: ['400', '600'],
})

export const metadata: Metadata = {
  title: 'Cyba – Finans • Kripto • Teknoloji • Gayrimenkul',
  description: 'Güncel finans, kripto para, teknoloji ve gayrimenkul haberleri.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="tr"
      className={`${syne.variable} ${dmSans.variable} ${jetbrainsMono.variable} antialiased`}
      suppressHydrationWarning
    >
      <head>
        {/* Prevent flash of wrong theme */}
        <Script id="theme-init" strategy="beforeInteractive">{`
          try {
            var t = localStorage.getItem('theme') || 'dark';
            document.documentElement.setAttribute('data-theme', t);
          } catch(e) {
            document.documentElement.setAttribute('data-theme', 'dark');
          }
        `}</Script>
      </head>
      <body className="min-h-screen flex flex-col">{children}</body>
    </html>
  )
}
