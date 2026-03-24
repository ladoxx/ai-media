import { Header } from '@/components/site/Header'
import { Footer } from '@/components/site/Footer'
import { PushSubscribe } from '@/components/site/PushSubscribe'
import { ServiceWorkerInit } from '@/components/site/ServiceWorkerInit'
import { AdZone } from '@/components/site/AdZone'
import { getMenu } from '@/lib/menus'
import { getThemeCss } from '@/lib/theme'
import { getActivePluginCodes } from '@/lib/plugins'
import { prisma } from '@/lib/db'

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [headerMenu, footerMenu1, footerMenu2, footerMenu3, themeCss, plugins, customCodes] = await Promise.all([
    getMenu('header'),
    getMenu('footer-1'),
    getMenu('footer-2'),
    getMenu('footer-3'),
    getThemeCss(),
    getActivePluginCodes(),
    prisma.setting.findMany({
      where: { key: { in: ['custom_body_start_code', 'custom_body_end_code'] } },
    }),
  ])

  const customCodeMap = Object.fromEntries(customCodes.map((s) => [s.key, s.value]))
  const bodyEndCode = [
    ...plugins.map((p) => p.bodyEndCode).filter(Boolean),
    customCodeMap.custom_body_end_code,
  ].filter(Boolean).join('\n')

  const bodyStartCode = [
    ...plugins.map((p) => p.bodyStartCode).filter(Boolean),
    customCodeMap.custom_body_start_code,
  ].filter(Boolean).join('\n')

  return (
    <>
      {/* Dynamic theme CSS */}
      {/* eslint-disable-next-line react/no-danger */}
      <style dangerouslySetInnerHTML={{ __html: themeCss }} />

      {bodyStartCode && (
        /* eslint-disable-next-line react/no-danger */
        <div data-plugin="body-start" dangerouslySetInnerHTML={{ __html: bodyStartCode }} />
      )}

      <div className="flex flex-col min-h-screen">
        <Header />
        {/* Header Leaderboard (728x90) */}
        <AdZone slug="header-leaderboard" className="w-full flex justify-center py-2 bg-[var(--bg-card)] border-b border-[var(--border)]" />
        <main className="flex-1">{children}</main>
        {/* Footer Leaderboard (728x90) */}
        <AdZone slug="footer-leaderboard" className="w-full flex justify-center py-2 bg-[var(--bg-card)] border-t border-[var(--border)]" />
        <Footer
          menuCategories={footerMenu1}
          menuPages={footerMenu2}
          menuSocial={footerMenu3}
        />
        {/* Mobil Alt Sabit Banner (320x50) */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 flex justify-center bg-[var(--bg-card)] border-t border-[var(--border)] pb-safe">
          <AdZone slug="mobile-banner" />
        </div>
      </div>

      {/* Plugin body-end codes: cookie consent, WhatsApp, etc. */}
      {bodyEndCode && (
        /* eslint-disable-next-line react/no-danger */
        <div data-plugin="body-end" dangerouslySetInnerHTML={{ __html: bodyEndCode }} />
      )}

      <ServiceWorkerInit />
      <PushSubscribe />
    </>
  )
}
