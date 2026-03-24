import { unstable_cache } from 'next/cache'
import { prisma } from './db'
import { getDefaults } from './theme-defaults'

function buildGoogleFontsUrl(display: string, body: string, mono: string): string {
  const families = [display, body, mono]
    .map((f) => f.replace(/ /g, '+'))
    .map((f) => `family=${f}:wght@300;400;500;600;700;800`)
    .join('&')
  return `https://fonts.googleapis.com/css2?${families}&display=swap`
}

export const getThemeCss = unstable_cache(
  async (): Promise<string> => {
    const settings = await prisma.themeSetting.findMany()
    const map = getDefaults()
    for (const s of settings) map[s.key] = s.value

    const googleFontsUrl = buildGoogleFontsUrl(map.font_display, map.font_body, map.font_mono)

    return `
@import url('${googleFontsUrl}');

:root {
  --color-accent-tech:   ${map.accent_tech};
  --color-accent-crypto: ${map.accent_crypto};
  --color-accent-real:   ${map.accent_real};
  --color-accent-game:   ${map.accent_game};

  --font-display: '${map.font_display}', sans-serif;
  --font-body:    '${map.font_body}', sans-serif;
  --font-mono:    '${map.font_mono}', monospace;

  --bg-primary:   ${map.bg_light};
  --bg-card:      ${map.bg_card_light};
  --border:       ${map.border_light};
  --text-primary: ${map.text_light};
  --text-muted:   #888899;
}

[data-theme="dark"] {
  --bg-primary:   ${map.bg_dark};
  --bg-card:      ${map.bg_card_dark};
  --border:       ${map.border_dark};
  --text-primary: ${map.text_dark};
}
`
  },
  ['theme-css'],
  { revalidate: 3600, tags: ['theme'] },
)

export const getThemeMap = unstable_cache(
  async (): Promise<Record<string, string>> => {
    const settings = await prisma.themeSetting.findMany()
    const map = getDefaults()
    for (const s of settings) map[s.key] = s.value
    return map
  },
  ['theme-map'],
  { revalidate: 3600, tags: ['theme'] },
)
