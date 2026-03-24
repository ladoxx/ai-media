import { prisma } from '@/lib/db'
import { getDefaults } from '@/lib/theme-defaults'

export const dynamic = 'force-dynamic'

export async function GET() {
  const settings = await prisma.themeSetting.findMany()
  const map = getDefaults()
  for (const s of settings) map[s.key] = s.value

  const display = map.font_display.replace(/ /g, '+')
  const body    = map.font_body.replace(/ /g, '+')
  const mono    = map.font_mono.replace(/ /g, '+')
  const gfonts  = `https://fonts.googleapis.com/css2?family=${display}:wght@300;400;500;600;700;800&family=${body}:wght@300;400;500;600&family=${mono}&display=swap`

  const css = `@import url('${gfonts}');
:root{--color-accent-tech:${map.accent_tech};--color-accent-crypto:${map.accent_crypto};--color-accent-real:${map.accent_real};--color-accent-game:${map.accent_game};--font-display:'${map.font_display}',sans-serif;--font-body:'${map.font_body}',sans-serif;--font-mono:'${map.font_mono}',monospace;--bg-primary:${map.bg_light};--bg-card:${map.bg_card_light};--border:${map.border_light};--text-primary:${map.text_light};}
[data-theme="dark"]{--bg-primary:${map.bg_dark};--bg-card:${map.bg_card_dark};--border:${map.border_dark};--text-primary:${map.text_dark};}
`

  return new Response(css, {
    headers: {
      'Content-Type': 'text/css; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
    },
  })
}
