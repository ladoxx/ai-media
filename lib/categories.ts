export interface CategoryMeta {
  slug: string
  name: string
  icon: string
  color: string
  hex: string
  gradient: string
  // Legacy helpers (still used across the codebase)
  cssVar: string
  border: string
  bg: string
  text: string
}

export const CATEGORY_META: Record<string, CategoryMeta> = {
  finans:        { slug: 'finans',        name: 'Finans',        icon: '💰', color: 'cat-finans',       hex: '#f7931a', gradient: 'from-[#f7931a]/20 to-transparent', cssVar: 'cat-finans',      border: 'border-[#f7931a]/20', bg: 'bg-[#f7931a]/10', text: 'text-[#f7931a]' },
  borsa:         { slug: 'borsa',         name: 'Borsa',         icon: '📈', color: 'cat-finans',       hex: '#f7931a', gradient: 'from-[#f7931a]/20 to-transparent', cssVar: 'cat-finans',      border: 'border-[#f7931a]/20', bg: 'bg-[#f7931a]/10', text: 'text-[#f7931a]' },
  kripto:        { slug: 'kripto',        name: 'Kripto',        icon: '₿',  color: 'cat-finans',       hex: '#f7931a', gradient: 'from-[#f7931a]/20 to-transparent', cssVar: 'cat-finans',      border: 'border-[#f7931a]/20', bg: 'bg-[#f7931a]/10', text: 'text-[#f7931a]' },
  'altin-doviz': { slug: 'altin-doviz',   name: 'Altın & Döviz', icon: '🥇', color: 'cat-finans',       hex: '#f7931a', gradient: 'from-[#f7931a]/20 to-transparent', cssVar: 'cat-finans',      border: 'border-[#f7931a]/20', bg: 'bg-[#f7931a]/10', text: 'text-[#f7931a]' },
  analizler:     { slug: 'analizler',     name: 'Analizler',     icon: '🔍', color: 'cat-finans',       hex: '#f7931a', gradient: 'from-[#f7931a]/20 to-transparent', cssVar: 'cat-finans',      border: 'border-[#f7931a]/20', bg: 'bg-[#f7931a]/10', text: 'text-[#f7931a]' },
  'yatirim-rehberleri': { slug: 'yatirim-rehberleri', name: 'Yatırım Rehberleri', icon: '📚', color: 'cat-finans', hex: '#f7931a', gradient: 'from-[#f7931a]/20 to-transparent', cssVar: 'cat-finans', border: 'border-[#f7931a]/20', bg: 'bg-[#f7931a]/10', text: 'text-[#f7931a]' },
  ekonomi:       { slug: 'ekonomi',       name: 'Ekonomi',       icon: '📊', color: 'cat-ekonomi',      hex: '#3b82f6', gradient: 'from-[#3b82f6]/20 to-transparent', cssVar: 'cat-ekonomi',     border: 'border-[#3b82f6]/20', bg: 'bg-[#3b82f6]/10', text: 'text-[#3b82f6]' },
  'turkiye-ekonomisi': { slug: 'turkiye-ekonomisi', name: 'Türkiye Ekonomisi', icon: '🇹🇷', color: 'cat-ekonomi', hex: '#3b82f6', gradient: 'from-[#3b82f6]/20 to-transparent', cssVar: 'cat-ekonomi', border: 'border-[#3b82f6]/20', bg: 'bg-[#3b82f6]/10', text: 'text-[#3b82f6]' },
  'dunya-ekonomisi':   { slug: 'dunya-ekonomisi',   name: 'Dünya Ekonomisi',   icon: '🌍', color: 'cat-ekonomi', hex: '#3b82f6', gradient: 'from-[#3b82f6]/20 to-transparent', cssVar: 'cat-ekonomi', border: 'border-[#3b82f6]/20', bg: 'bg-[#3b82f6]/10', text: 'text-[#3b82f6]' },
  'enflasyon-faiz':    { slug: 'enflasyon-faiz',    name: 'Enflasyon & Faiz',  icon: '📉', color: 'cat-ekonomi', hex: '#3b82f6', gradient: 'from-[#3b82f6]/20 to-transparent', cssVar: 'cat-ekonomi', border: 'border-[#3b82f6]/20', bg: 'bg-[#3b82f6]/10', text: 'text-[#3b82f6]' },
  'sirket-haberleri':  { slug: 'sirket-haberleri',  name: 'Şirket Haberleri',  icon: '🏢', color: 'cat-ekonomi', hex: '#3b82f6', gradient: 'from-[#3b82f6]/20 to-transparent', cssVar: 'cat-ekonomi', border: 'border-[#3b82f6]/20', bg: 'bg-[#3b82f6]/10', text: 'text-[#3b82f6]' },
  gayrimenkul:   { slug: 'gayrimenkul',   name: 'Gayrimenkul',   icon: '🏡', color: 'cat-gayrimenkul',  hex: '#10b981', gradient: 'from-[#10b981]/20 to-transparent', cssVar: 'cat-gayrimenkul', border: 'border-[#10b981]/20', bg: 'bg-[#10b981]/10', text: 'text-[#10b981]' },
  'konut-projeleri':   { slug: 'konut-projeleri',   name: 'Konut Projeleri',   icon: '🏗️', color: 'cat-gayrimenkul', hex: '#10b981', gradient: 'from-[#10b981]/20 to-transparent', cssVar: 'cat-gayrimenkul', border: 'border-[#10b981]/20', bg: 'bg-[#10b981]/10', text: 'text-[#10b981]' },
  'kira-satilik':      { slug: 'kira-satilik',      name: 'Kira & Satılık',    icon: '🔑', color: 'cat-gayrimenkul', hex: '#10b981', gradient: 'from-[#10b981]/20 to-transparent', cssVar: 'cat-gayrimenkul', border: 'border-[#10b981]/20', bg: 'bg-[#10b981]/10', text: 'text-[#10b981]' },
  'yatirim-firsatlari':{ slug: 'yatirim-firsatlari',name: 'Yatırım Fırsatları',icon: '💎', color: 'cat-gayrimenkul', hex: '#10b981', gradient: 'from-[#10b981]/20 to-transparent', cssVar: 'cat-gayrimenkul', border: 'border-[#10b981]/20', bg: 'bg-[#10b981]/10', text: 'text-[#10b981]' },
  'tapu-hukuk':        { slug: 'tapu-hukuk',        name: 'Tapu & Hukuk',      icon: '⚖️', color: 'cat-gayrimenkul', hex: '#10b981', gradient: 'from-[#10b981]/20 to-transparent', cssVar: 'cat-gayrimenkul', border: 'border-[#10b981]/20', bg: 'bg-[#10b981]/10', text: 'text-[#10b981]' },
  'bolgesel-analiz':   { slug: 'bolgesel-analiz',   name: 'Bölgesel Analiz',   icon: '🗺️', color: 'cat-gayrimenkul', hex: '#10b981', gradient: 'from-[#10b981]/20 to-transparent', cssVar: 'cat-gayrimenkul', border: 'border-[#10b981]/20', bg: 'bg-[#10b981]/10', text: 'text-[#10b981]' },
  oyun:          { slug: 'oyun',          name: 'Oyun',          icon: '🎮', color: 'cat-oyun',         hex: '#a855f7', gradient: 'from-[#a855f7]/20 to-transparent', cssVar: 'cat-oyun',        border: 'border-[#a855f7]/20', bg: 'bg-[#a855f7]/10', text: 'text-[#a855f7]' },
  'oyun-haberleri':    { slug: 'oyun-haberleri',    name: 'Oyun Haberleri',    icon: '📰', color: 'cat-oyun', hex: '#a855f7', gradient: 'from-[#a855f7]/20 to-transparent', cssVar: 'cat-oyun', border: 'border-[#a855f7]/20', bg: 'bg-[#a855f7]/10', text: 'text-[#a855f7]' },
  'mobil-oyunlar':     { slug: 'mobil-oyunlar',     name: 'Mobil Oyunlar',     icon: '📱', color: 'cat-oyun', hex: '#a855f7', gradient: 'from-[#a855f7]/20 to-transparent', cssVar: 'cat-oyun', border: 'border-[#a855f7]/20', bg: 'bg-[#a855f7]/10', text: 'text-[#a855f7]' },
  'pc-konsol':         { slug: 'pc-konsol',         name: 'PC & Konsol',       icon: '🖥️', color: 'cat-oyun', hex: '#a855f7', gradient: 'from-[#a855f7]/20 to-transparent', cssVar: 'cat-oyun', border: 'border-[#a855f7]/20', bg: 'bg-[#a855f7]/10', text: 'text-[#a855f7]' },
  'oyun-incelemeleri': { slug: 'oyun-incelemeleri', name: 'Oyun İncelemeleri', icon: '⭐', color: 'cat-oyun', hex: '#a855f7', gradient: 'from-[#a855f7]/20 to-transparent', cssVar: 'cat-oyun', border: 'border-[#a855f7]/20', bg: 'bg-[#a855f7]/10', text: 'text-[#a855f7]' },
  'e-spor':            { slug: 'e-spor',            name: 'E-spor',            icon: '🏆', color: 'cat-oyun', hex: '#a855f7', gradient: 'from-[#a855f7]/20 to-transparent', cssVar: 'cat-oyun', border: 'border-[#a855f7]/20', bg: 'bg-[#a855f7]/10', text: 'text-[#a855f7]' },
  teknoloji:     { slug: 'teknoloji',     name: 'Teknoloji',     icon: '🤖', color: 'cat-teknoloji',    hex: '#00c896', gradient: 'from-[#00c896]/20 to-transparent', cssVar: 'cat-teknoloji',   border: 'border-[#00c896]/20', bg: 'bg-[#00c896]/10', text: 'text-[#00c896]' },
  'yapay-zeka':        { slug: 'yapay-zeka',        name: 'Yapay Zeka',        icon: '🧠', color: 'cat-teknoloji', hex: '#00c896', gradient: 'from-[#00c896]/20 to-transparent', cssVar: 'cat-teknoloji', border: 'border-[#00c896]/20', bg: 'bg-[#00c896]/10', text: 'text-[#00c896]' },
  startup:             { slug: 'startup',            name: 'Startup',           icon: '🚀', color: 'cat-teknoloji', hex: '#00c896', gradient: 'from-[#00c896]/20 to-transparent', cssVar: 'cat-teknoloji', border: 'border-[#00c896]/20', bg: 'bg-[#00c896]/10', text: 'text-[#00c896]' },
  uygulamalar:         { slug: 'uygulamalar',        name: 'Uygulamalar',       icon: '📲', color: 'cat-teknoloji', hex: '#00c896', gradient: 'from-[#00c896]/20 to-transparent', cssVar: 'cat-teknoloji', border: 'border-[#00c896]/20', bg: 'bg-[#00c896]/10', text: 'text-[#00c896]' },
  donanim:             { slug: 'donanim',            name: 'Donanım',           icon: '💻', color: 'cat-teknoloji', hex: '#00c896', gradient: 'from-[#00c896]/20 to-transparent', cssVar: 'cat-teknoloji', border: 'border-[#00c896]/20', bg: 'bg-[#00c896]/10', text: 'text-[#00c896]' },
  rehberler:     { slug: 'rehberler',     name: 'Rehberler',     icon: '🧠', color: 'cat-rehber',       hex: '#f59e0b', gradient: 'from-[#f59e0b]/20 to-transparent', cssVar: 'cat-rehber',      border: 'border-[#f59e0b]/20', bg: 'bg-[#f59e0b]/10', text: 'text-[#f59e0b]' },
  'nasil-yapilir':     { slug: 'nasil-yapilir',     name: 'Nasıl Yapılır?',    icon: '❓', color: 'cat-rehber', hex: '#f59e0b', gradient: 'from-[#f59e0b]/20 to-transparent', cssVar: 'cat-rehber', border: 'border-[#f59e0b]/20', bg: 'bg-[#f59e0b]/10', text: 'text-[#f59e0b]' },
  'para-kazanma':      { slug: 'para-kazanma',      name: 'Para Kazanma',      icon: '💸', color: 'cat-rehber', hex: '#f59e0b', gradient: 'from-[#f59e0b]/20 to-transparent', cssVar: 'cat-rehber', border: 'border-[#f59e0b]/20', bg: 'bg-[#f59e0b]/10', text: 'text-[#f59e0b]' },
  'yatirim-taktikleri':{ slug: 'yatirim-taktikleri',name: 'Yatırım Taktikleri',icon: '♟️', color: 'cat-rehber', hex: '#f59e0b', gradient: 'from-[#f59e0b]/20 to-transparent', cssVar: 'cat-rehber', border: 'border-[#f59e0b]/20', bg: 'bg-[#f59e0b]/10', text: 'text-[#f59e0b]' },
  'son-dakika':  { slug: 'son-dakika',    name: 'Son Dakika',    icon: '🔴', color: 'cat-son-dakika',   hex: '#ef4444', gradient: 'from-[#ef4444]/20 to-transparent', cssVar: 'cat-son-dakika',  border: 'border-[#ef4444]/20', bg: 'bg-[#ef4444]/10', text: 'text-[#ef4444]' },
  trendler:      { slug: 'trendler',      name: 'Trendler',      icon: '🔥', color: 'cat-trend',        hex: '#ec4899', gradient: 'from-[#ec4899]/20 to-transparent', cssVar: 'cat-trend',       border: 'border-[#ec4899]/20', bg: 'bg-[#ec4899]/10', text: 'text-[#ec4899]' },
}

const DEFAULT_META: CategoryMeta = {
  slug: '', name: '', icon: '📰', color: 'cat-teknoloji', hex: '#00c896',
  gradient: 'from-[#00c896]/20 to-transparent',
  cssVar: 'cat-default', border: 'border-gray-500/20', bg: 'bg-gray-500/10', text: 'text-gray-400',
}

export function getCategoryMeta(slug: string): CategoryMeta {
  return CATEGORY_META[slug] ?? {
    ...DEFAULT_META,
    slug,
    name: slug.charAt(0).toUpperCase() + slug.slice(1),
  }
}

export function getCategoryColor(slug: string): string {
  return getCategoryMeta(slug).hex
}

export function getCategoryIcon(slug: string): string {
  return getCategoryMeta(slug).icon
}

export function getCategoryGradient(slug: string): string {
  return getCategoryMeta(slug).gradient
}

export function getCategoryText(slug: string): string {
  return getCategoryMeta(slug).text
}

export function getCategoryBg(slug: string): string {
  return getCategoryMeta(slug).bg
}

export function getCategoryBorder(slug: string): string {
  return getCategoryMeta(slug).border
}

export const MENU_CATEGORIES = [
  {
    slug: 'finans', name: 'Finans', icon: '💰', hex: '#f7931a',
    children: [
      { slug: 'borsa', name: 'Borsa', icon: '📈' },
      { slug: 'kripto', name: 'Kripto', icon: '₿' },
      { slug: 'altin-doviz', name: 'Altın & Döviz', icon: '🥇' },
      { slug: 'analizler', name: 'Analizler', icon: '🔍' },
    ],
  },
  {
    slug: 'ekonomi', name: 'Ekonomi', icon: '📊', hex: '#3b82f6',
    children: [
      { slug: 'turkiye-ekonomisi', name: 'Türkiye Ekonomisi', icon: '🇹🇷' },
      { slug: 'dunya-ekonomisi', name: 'Dünya Ekonomisi', icon: '🌍' },
      { slug: 'enflasyon-faiz', name: 'Enflasyon & Faiz', icon: '📉' },
      { slug: 'sirket-haberleri', name: 'Şirket Haberleri', icon: '🏢' },
    ],
  },
  {
    slug: 'gayrimenkul', name: 'Gayrimenkul', icon: '🏡', hex: '#10b981',
    children: [
      { slug: 'konut-projeleri', name: 'Konut Projeleri', icon: '🏗️' },
      { slug: 'kira-satilik', name: 'Kira & Satılık', icon: '🔑' },
      { slug: 'yatirim-firsatlari', name: 'Yatırım Fırsatları', icon: '💎' },
      { slug: 'tapu-hukuk', name: 'Tapu & Hukuk', icon: '⚖️' },
      { slug: 'bolgesel-analiz', name: 'Bölgesel Analiz', icon: '🗺️' },
    ],
  },
  {
    slug: 'oyun', name: 'Oyun', icon: '🎮', hex: '#a855f7',
    children: [
      { slug: 'oyun-haberleri', name: 'Oyun Haberleri', icon: '📰' },
      { slug: 'mobil-oyunlar', name: 'Mobil Oyunlar', icon: '📱' },
      { slug: 'pc-konsol', name: 'PC & Konsol', icon: '🖥️' },
      { slug: 'oyun-incelemeleri', name: 'Oyun İncelemeleri', icon: '⭐' },
      { slug: 'e-spor', name: 'E-spor', icon: '🏆' },
    ],
  },
  {
    slug: 'teknoloji', name: 'Teknoloji', icon: '🤖', hex: '#00c896',
    children: [
      { slug: 'yapay-zeka', name: 'Yapay Zeka', icon: '🧠' },
      { slug: 'startup', name: 'Startup', icon: '🚀' },
      { slug: 'uygulamalar', name: 'Uygulamalar', icon: '📲' },
      { slug: 'donanim', name: 'Donanım', icon: '💻' },
    ],
  },
  {
    slug: 'rehberler', name: 'Rehberler', icon: '🧠', hex: '#f59e0b',
    children: [
      { slug: 'nasil-yapilir', name: 'Nasıl Yapılır?', icon: '❓' },
      { slug: 'para-kazanma', name: 'Para Kazanma', icon: '💸' },
      { slug: 'yatirim-taktikleri', name: 'Yatırım Taktikleri', icon: '♟️' },
    ],
  },
]
