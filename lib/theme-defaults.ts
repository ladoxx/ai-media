export type ThemeDefault = {
  key: string
  value: string
  group: string
  label: string
}

export const THEME_DEFAULTS: ThemeDefault[] = [
  // ── Colors ──────────────────────────────────────────────
  { key: 'accent_tech',    value: '#00c896', group: 'colors', label: 'Teknoloji Rengi' },
  { key: 'accent_crypto',  value: '#f7931a', group: 'colors', label: 'Kripto Rengi' },
  { key: 'accent_real',    value: '#3b82f6', group: 'colors', label: 'Gayrimenkul Rengi' },
  { key: 'accent_game',    value: '#a855f7', group: 'colors', label: 'Oyun Rengi' },
  { key: 'bg_dark',        value: '#0d0d14', group: 'colors', label: 'Dark Arka Plan' },
  { key: 'bg_card_dark',   value: '#16162a', group: 'colors', label: 'Dark Kart' },
  { key: 'border_dark',    value: '#1e1e35', group: 'colors', label: 'Dark Border' },
  { key: 'text_dark',      value: '#f0f0fa', group: 'colors', label: 'Dark Metin' },
  { key: 'bg_light',       value: '#f8f7f4', group: 'colors', label: 'Light Arka Plan' },
  { key: 'bg_card_light',  value: '#ffffff', group: 'colors', label: 'Light Kart' },
  { key: 'border_light',   value: '#e8e8f0', group: 'colors', label: 'Light Border' },
  { key: 'text_light',     value: '#1a1a2e', group: 'colors', label: 'Light Metin' },

  // ── Fonts ────────────────────────────────────────────────
  { key: 'font_display',    value: 'Syne',           group: 'fonts', label: 'Başlık Fontu' },
  { key: 'font_body',       value: 'DM Sans',        group: 'fonts', label: 'Metin Fontu' },
  { key: 'font_mono',       value: 'JetBrains Mono', group: 'fonts', label: 'Mono Fontu' },
  { key: 'font_size_base',  value: '16',             group: 'fonts', label: 'Temel Font Boyutu' },
  { key: 'heading_weight',  value: '700',            group: 'fonts', label: 'Başlık Ağırlığı' },

  // ── Logo ─────────────────────────────────────────────────
  { key: 'logo_type',  value: 'text_icon',    group: 'logo', label: 'Logo Türü' },
  { key: 'logo_text',  value: 'Cyba',group: 'logo', label: 'Site Adı' },
  { key: 'logo_icon',  value: '🧭',           group: 'logo', label: 'Logo İkonu' },
  { key: 'logo_image', value: '',             group: 'logo', label: 'Logo Görseli URL' },

  // ── Layout ───────────────────────────────────────────────
  { key: 'header_sticky',      value: 'true',      group: 'layout', label: 'Yapışkan Header' },
  { key: 'ticker_enabled',     value: 'true',      group: 'layout', label: 'Ticker Bandı' },
  { key: 'breaking_news',      value: 'false',     group: 'layout', label: 'Breaking News Bandı' },
  { key: 'search_button',      value: 'true',      group: 'layout', label: 'Arama Butonu' },
  { key: 'subscribe_button',   value: 'true',      group: 'layout', label: 'Abone Ol Butonu' },
  { key: 'hero_enabled',       value: 'true',      group: 'layout', label: 'Hero Bölümü' },
  { key: 'stats_band',         value: 'true',      group: 'layout', label: 'İstatistik Bandı' },
  { key: 'newsletter_section', value: 'true',      group: 'layout', label: 'Newsletter Bölümü' },
  { key: 'sidebar_enabled',    value: 'true',      group: 'layout', label: 'Sidebar' },
  { key: 'sidebar_position',   value: 'right',     group: 'layout', label: 'Sidebar Konumu' },
  { key: 'reading_progress',   value: 'true',      group: 'layout', label: 'Okuma Progress Bar' },
  { key: 'author_box',         value: 'true',      group: 'layout', label: 'Yazar Kutusu' },
  { key: 'related_posts',      value: 'true',      group: 'layout', label: 'İlgili Haberler' },
  { key: 'social_share',       value: 'true',      group: 'layout', label: 'Sosyal Paylaşım' },
  { key: 'reading_time',       value: 'true',      group: 'layout', label: 'Okuma Süresi' },
  { key: 'show_views',         value: 'true',      group: 'layout', label: 'Görüntülenme Sayısı' },
  { key: 'comments_enabled',   value: 'false',     group: 'layout', label: 'Yorum Bölümü' },
  { key: 'posts_per_page',     value: '9',         group: 'layout', label: 'Sayfa Başına Yazı' },
  { key: 'card_style',         value: 'image_top', group: 'layout', label: 'Kart Stili' },
  { key: 'grid_cols',          value: '3',         group: 'layout', label: 'Grid Kolonları' },

  // ── Dark/Light Mode ──────────────────────────────────────
  { key: 'default_mode',    value: 'dark',  group: 'darkmode', label: 'Varsayılan Mod' },
  { key: 'show_toggle',     value: 'true',  group: 'darkmode', label: 'Toggle Göster' },
  { key: 'transition_type', value: 'fade',  group: 'darkmode', label: 'Geçiş Animasyonu' },

  // ── Footer ───────────────────────────────────────────────
  { key: 'footer_text', value: 'Cyba - Teknoloji • Kripto • Gayrimenkul • Oyun', group: 'footer', label: 'Footer Metni' },
  { key: 'copyright',   value: '2024 Cyba. Tüm hakları saklıdır.',               group: 'footer', label: 'Telif Hakkı' },
]

export function getDefaults(): Record<string, string> {
  const map: Record<string, string> = {}
  for (const d of THEME_DEFAULTS) map[d.key] = d.value
  return map
}
