export interface PluginDef {
  slug: string
  name: string
  description: string
  version: string
  author?: string
  icon: string
  settingsSchema: PluginField[]
  getHeadCode(settings: Record<string, string>): string
  getBodyStartCode(settings: Record<string, string>): string
  getBodyEndCode(settings: Record<string, string>): string
}

export interface PluginField {
  key: string
  label: string
  type: 'text' | 'textarea' | 'toggle' | 'select'
  placeholder?: string
  options?: { value: string; label: string }[]
  defaultValue?: string
}

// ── GOOGLE ADSENSE ──────────────────────────────────────────────────────────
const adsense: PluginDef = {
  slug: 'adsense',
  name: 'Google AdSense',
  description: 'Siteye AdSense reklam kodları ekle',
  version: '1.0.0',
  icon: '💰',
  settingsSchema: [
    { key: 'publisher_id', label: 'Publisher ID', type: 'text', placeholder: 'ca-pub-XXXXXXXXXXXXXXXX' },
    { key: 'auto_ads', label: 'Auto Ads', type: 'toggle', defaultValue: 'true' },
    { key: 'header_ad', label: 'Header (728x90)', type: 'toggle', defaultValue: 'true' },
    { key: 'article_ad', label: 'Makale içi reklam', type: 'toggle', defaultValue: 'true' },
    { key: 'sidebar_ad', label: 'Sidebar reklamı', type: 'toggle', defaultValue: 'true' },
    { key: 'footer_ad', label: 'Footer reklamı', type: 'toggle', defaultValue: 'false' },
  ],
  getHeadCode(s) {
    if (!s.publisher_id) return ''
    const autoAds = s.auto_ads !== 'false'
      ? `\n<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${s.publisher_id}" crossorigin="anonymous"></script>`
      : ''
    return autoAds
  },
  getBodyStartCode() { return '' },
  getBodyEndCode() { return '' },
}

// ── GOOGLE ANALYTICS ───────────────────────────────────────────────────────
const analytics: PluginDef = {
  slug: 'analytics',
  name: 'Google Analytics',
  description: 'GA4 takip kodu entegrasyonu',
  version: '1.0.0',
  icon: '📊',
  settingsSchema: [
    { key: 'measurement_id', label: 'Measurement ID', type: 'text', placeholder: 'G-XXXXXXXXXX' },
    { key: 'track_scroll', label: 'Scroll takibi', type: 'toggle', defaultValue: 'true' },
    { key: 'track_outbound', label: 'Dış link tıklama', type: 'toggle', defaultValue: 'true' },
    { key: 'track_search', label: 'Arama takibi', type: 'toggle', defaultValue: 'true' },
  ],
  getHeadCode(s) {
    if (!s.measurement_id) return ''
    return `<script async src="https://www.googletagmanager.com/gtag/js?id=${s.measurement_id}"></script>
<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${s.measurement_id}');</script>`
  },
  getBodyStartCode() { return '' },
  getBodyEndCode() { return '' },
}

// ── HOTJAR ─────────────────────────────────────────────────────────────────
const hotjar: PluginDef = {
  slug: 'hotjar',
  name: 'Hotjar',
  description: 'Kullanıcı davranış takibi ve ısı haritaları',
  version: '1.0.0',
  icon: '🔥',
  settingsSchema: [
    { key: 'site_id', label: 'Site ID', type: 'text', placeholder: '1234567' },
  ],
  getHeadCode(s) {
    if (!s.site_id) return ''
    return `<script>(function(h,o,t,j,a,r){h.hj=h.hj||function(){(h.hj.q=h.hj.q||[]).push(arguments)};h._hjSettings={hjid:${s.site_id},hjsv:6};a=o.getElementsByTagName('head')[0];r=o.createElement('script');r.async=1;r.src=t+h._hjSettings.hjid+j+h._hjSettings.hjsv;a.appendChild(r);})(window,document,'https://static.hotjar.com/c/hotjar-','.js?sv=');</script>`
  },
  getBodyStartCode() { return '' },
  getBodyEndCode() { return '' },
}

// ── FACEBOOK PIXEL ─────────────────────────────────────────────────────────
const facebookPixel: PluginDef = {
  slug: 'facebook-pixel',
  name: 'Facebook Pixel',
  description: 'Facebook reklam takibi ve dönüşüm ölçümü',
  version: '1.0.0',
  icon: '📘',
  settingsSchema: [
    { key: 'pixel_id', label: 'Pixel ID', type: 'text', placeholder: 'XXXXXXXXXXXXXXXXXX' },
  ],
  getHeadCode(s) {
    if (!s.pixel_id) return ''
    return `<script>!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${s.pixel_id}');fbq('track','PageView');</script>`
  },
  getBodyStartCode() { return '' },
  getBodyEndCode() { return '' },
}

// ── CRYPTO TICKER ──────────────────────────────────────────────────────────
const cryptoTicker: PluginDef = {
  slug: 'crypto-ticker',
  name: 'Canlı Kripto Fiyatları',
  description: 'CoinGecko API ile anlık kripto fiyatları',
  version: '1.0.0',
  icon: '₿',
  settingsSchema: [
    { key: 'coins', label: 'Coinler (virgülle)', type: 'text', placeholder: 'bitcoin,ethereum,binancecoin,solana', defaultValue: 'bitcoin,ethereum,binancecoin,solana' },
    { key: 'currency', label: 'Para birimi', type: 'select', defaultValue: 'usd', options: [{ value: 'usd', label: 'USD' }, { value: 'eur', label: 'EUR' }, { value: 'try', label: 'TRY' }] },
    { key: 'refresh', label: 'Güncelleme (saniye)', type: 'select', defaultValue: '30', options: [{ value: '10', label: '10sn' }, { value: '30', label: '30sn' }, { value: '60', label: '1dk' }] },
  ],
  getHeadCode() { return '' },
  getBodyStartCode() { return '' },
  getBodyEndCode() { return '' },
}

// ── COOKIE CONSENT ─────────────────────────────────────────────────────────
const cookieConsent: PluginDef = {
  slug: 'cookie-consent',
  name: 'Çerez Onay Bandı',
  description: 'GDPR uyumlu çerez onay popup\'ı',
  version: '1.0.0',
  icon: '🍪',
  settingsSchema: [
    { key: 'message', label: 'Mesaj', type: 'textarea', defaultValue: 'Bu site çerez kullanmaktadır. Devam etmek için kabul edin.' },
    { key: 'button_text', label: 'Buton metni', type: 'text', defaultValue: 'Kabul Et' },
    { key: 'policy_url', label: 'Politika sayfası URL', type: 'text', placeholder: '/cerez-politikasi' },
    { key: 'position', label: 'Konum', type: 'select', defaultValue: 'bottom', options: [{ value: 'bottom', label: 'Alt' }, { value: 'top', label: 'Üst' }] },
  ],
  getHeadCode() { return '' },
  getBodyStartCode() { return '' },
  getBodyEndCode(s) {
    const msg = s.message ?? 'Bu site çerez kullanmaktadır.'
    const btn = s.button_text ?? 'Kabul Et'
    const pos = s.position === 'top' ? 'top:0' : 'bottom:0'
    const policyLink = s.policy_url ? `<a href="${s.policy_url}" style="color:#00c896;text-decoration:underline;margin-left:8px;">Daha fazla</a>` : ''
    return `<div id="cookie-banner" style="display:none;position:fixed;${pos};left:0;right:0;background:#16162a;color:#fff;padding:14px 20px;z-index:9999;display:flex;align-items:center;justify-content:space-between;gap:16px;border-top:1px solid #1e1e35;font-size:14px;"><span>${msg}${policyLink}</span><button onclick="document.getElementById('cookie-banner').style.display='none';localStorage.setItem('cookie_ok','1')" style="background:#00c896;color:#0a0a14;border:none;padding:8px 18px;border-radius:8px;cursor:pointer;font-weight:600;">${btn}</button></div><script>if(!localStorage.getItem('cookie_ok'))document.getElementById('cookie-banner').style.display='flex';</script>`
  },
}

// ── WHATSAPP ───────────────────────────────────────────────────────────────
const whatsapp: PluginDef = {
  slug: 'whatsapp',
  name: 'WhatsApp Butonu',
  description: 'Sağ altta WhatsApp iletişim butonu',
  version: '1.0.0',
  icon: '💬',
  settingsSchema: [
    { key: 'phone', label: 'Telefon (+90...)', type: 'text', placeholder: '+905001234567' },
    { key: 'message', label: 'Ön mesaj', type: 'textarea', defaultValue: 'Merhaba! Yardımcı olabilir miyim?' },
    { key: 'position', label: 'Konum', type: 'select', defaultValue: 'right', options: [{ value: 'right', label: 'Sağ Alt' }, { value: 'left', label: 'Sol Alt' }] },
  ],
  getHeadCode() { return '' },
  getBodyStartCode() { return '' },
  getBodyEndCode(s) {
    if (!s.phone) return ''
    const side = s.position === 'left' ? 'left:20px' : 'right:20px'
    const msg = encodeURIComponent(s.message ?? 'Merhaba!')
    const url = `https://wa.me/${s.phone.replace(/\D/g, '')}?text=${msg}`
    return `<a href="${url}" target="_blank" rel="noopener" style="position:fixed;bottom:20px;${side};z-index:999;width:52px;height:52px;background:#25D366;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px rgba(37,211,102,0.4);transition:transform 0.2s" onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'" aria-label="WhatsApp"><svg width="28" height="28" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg></a>`
  },
}

// ── SOCIAL SHARE ───────────────────────────────────────────────────────────
const socialShare: PluginDef = {
  slug: 'social-share',
  name: 'Social Share Butonları',
  description: 'Yazı altı sosyal medya paylaşım butonları',
  version: '1.0.0',
  icon: '📤',
  settingsSchema: [
    { key: 'show_twitter', label: 'Twitter/X', type: 'toggle', defaultValue: 'true' },
    { key: 'show_facebook', label: 'Facebook', type: 'toggle', defaultValue: 'true' },
    { key: 'show_linkedin', label: 'LinkedIn', type: 'toggle', defaultValue: 'true' },
    { key: 'show_whatsapp', label: 'WhatsApp', type: 'toggle', defaultValue: 'true' },
    { key: 'show_telegram', label: 'Telegram', type: 'toggle', defaultValue: 'true' },
    { key: 'show_copy', label: 'Bağlantı Kopyala', type: 'toggle', defaultValue: 'true' },
  ],
  getHeadCode() { return '' },
  getBodyStartCode() { return '' },
  getBodyEndCode() { return '' },
}

// ── TELEGRAM SHARE ─────────────────────────────────────────────────────────
const telegramShare: PluginDef = {
  slug: 'telegram-share',
  name: 'Telegram Paylaşım',
  description: 'Yeni yazıları otomatik olarak Telegram kanalına paylaş',
  version: '1.0.0',
  icon: '✈️',
  settingsSchema: [
    { key: 'bot_token', label: 'Bot Token', type: 'text', placeholder: '1234567890:AAFxxxx' },
    { key: 'channel_id', label: 'Kanal ID', type: 'text', placeholder: '@cyba veya -100xxxxxx' },
    { key: 'message_template', label: 'Mesaj şablonu', type: 'textarea', defaultValue: '📰 {title}\n\n{excerpt}\n\n🔗 {url}' },
  ],
  getHeadCode() { return '' },
  getBodyStartCode() { return '' },
  getBodyEndCode() { return '' },
}

// ── RELATED POSTS ──────────────────────────────────────────────────────────
const relatedPosts: PluginDef = {
  slug: 'related-posts',
  name: 'İlgili Yazılar',
  description: 'Yazı altında aynı kategoriden ilgili içerik önerisi',
  version: '1.0.0',
  icon: '📰',
  settingsSchema: [
    { key: 'count', label: 'Gösterilecek yazı sayısı', type: 'select', defaultValue: '3', options: [{ value: '2', label: '2' }, { value: '3', label: '3' }, { value: '4', label: '4' }, { value: '6', label: '6' }] },
    { key: 'show_image', label: 'Kapak görseli göster', type: 'toggle', defaultValue: 'true' },
    { key: 'show_excerpt', label: 'Özet göster', type: 'toggle', defaultValue: 'false' },
  ],
  getHeadCode() { return '' },
  getBodyStartCode() { return '' },
  getBodyEndCode() { return '' },
}

export const PLUGIN_REGISTRY: PluginDef[] = [
  adsense,
  analytics,
  hotjar,
  facebookPixel,
  cryptoTicker,
  cookieConsent,
  whatsapp,
  socialShare,
  telegramShare,
  relatedPosts,
]

export function getPlugin(slug: string): PluginDef | undefined {
  return PLUGIN_REGISTRY.find((p) => p.slug === slug)
}
