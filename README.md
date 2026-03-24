# Cyba — Türkçe Haber & İçerik Otomasyonu Platformu

AI destekli çok ajanlı pipeline ile haber toplama, yazma ve yayınlama platformu.

---

## Teknoloji Yığını

| Katman | Teknoloji |
|---|---|
| Framework | Next.js 16, React 19, TypeScript 5 |
| Veritabanı | SQLite (LibSQL adapter) + Prisma 7 |
| Kimlik Doğrulama | NextAuth 4 (JWT strateji) |
| Yetkilendirme | RBAC (Permission / Role / RolePermission / UserPermission) |
| AI / LLM | DeepSeek, Gemini, Claude, OpenAI, Groq, OpenRouter |
| Görsel İşleme | Sharp + Cloudflare Workers (Flux) |
| Stok Görsel | Pexels API (satır içi otomatik görsel) |
| Stil | Tailwind CSS 4 |
| Haber Kaynakları | RSS, YouTube API, Reddit API, NewsAPI, Cheerio |

---

## Özellikler

### Haber Sitesi (Public)
- Anasayfa: son dakika bandı + kategori bölümleri
- Makale sayfaları: SEO meta, okuma süresi, yorumlar, ilgili haberler
- Ana + alt kategori sistemi (Finans, Ekonomi, Gayrimenkul, Oyun, Teknoloji, Rehberler)
- Etiket sayfaları, tam metin arama
- Haber bülteni aboneliği
- Web Push bildirimleri
- Dark / Light tema

### Admin Paneli — Üç Rol

| Rol | Erişim |
|---|---|
| `SUPERADMIN` | Tüm sistem — `/superadmin/*` |
| `ADMIN` | İçerik + modül izinlerine göre — `/admin/*` |
| `EDITOR` | Sadece kendi yazıları — `/editor/*` |

### SuperAdmin Paneli (`/superadmin`)
- Kullanıcı yönetimi: onay sistemi, sistem rolü atama, özel yetki matrix
- Rol şablonları: oluştur / düzenle / kopyala / sil
- AI platformlar: şifreli API anahtar yönetimi + şifre kapısı
- Otomasyon: pipeline çalıştır, ajan prompt editörü, log takibi
- Etiket & kategori yönetimi
- Gelir / gider takibi
- Newsletter yönetimi
- Yedekleme, tema, ayarlar

### Multi-Agent Otomasyon Pipeline

**Haber pipeline** (6 ajan):
```
Scout → Writer → Editor → SEO → Media → Publisher
```

**Rehber pipeline** (6 ajan):
```
Guide Scout → Guide Writer → Guide Editor → Guide SEO → Media → Guide Publisher
```

| Ajan | Görev | Kritik |
|---|---|---|
| Scout | Haber topla, AI ile en iyi 3'ü seç | ✅ |
| Writer | Seçilen haberden makale yaz | ✅ |
| Editor | AI kokusunu gider, insan yazısına dönüştür | — |
| SEO | Anahtar kelime, meta, etiket üret | — |
| Media | Cloudflare Flux ile AI kapak görseli + Pexels satır içi görseller | — |
| Publisher | Veritabanına kaydet, yayınla | ✅ |

Her ajanın system/user promptu Monaco editör ile düzenlenebilir. Versiyon geçmişi tutulur.

---

## Kurulum

### 1. Bağımlılıkları Yükle

```bash
npm install
```

### 2. Ortam Değişkenleri

Proje kökünde `.env.local` dosyası oluştur:

```env
# Veritabanı
DATABASE_URL="file:./prisma/dev.db"

# Auth
NEXTAUTH_SECRET="guclu-bir-secret-buraya"
NEXTAUTH_URL="http://localhost:3000"

# Şifreleme — tam olarak 64 hex karakter olmalı (API anahtarlarını şifreler)
# Üretmek için: openssl rand -hex 32
ENCRYPTION_KEY="buraya-64-hex-karakter-yaz"

# Site URL
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
APP_URL="http://localhost:3000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Otomasyon güvenlik anahtarı
AUTOMATION_SECRET="otomasyon-secret-buraya"

# Cloudflare Workers — AI görsel üretimi
CF_WORKER_URL="https://worker-adiniz.workers.dev"
CF_SECRET_KEY="worker-secret-anahtariniz"
WATERMARK_TEXT="Site Adınız"

# Web Push (opsiyonel)
NEXT_PUBLIC_VAPID_PUBLIC_KEY="..."
VAPID_PRIVATE_KEY="..."
VAPID_EMAIL="mailto:admin@example.com"

# Haber kaynakları (opsiyonel)
YOUTUBE_API_KEY="..."
NEWSAPI_KEY="..."

# Pexels — satır içi otomatik görsel (opsiyonel)
# PEXELS_API_KEY="..."

# Telegram raporu (opsiyonel)
# TELEGRAM_BOT_TOKEN="..."
# TELEGRAM_CHAT_ID="..."
```

> AI platform API anahtarları (DeepSeek, Gemini vb.) `.env` dosyasına değil, AES-256-CBC ile şifreli olarak veritabanına kaydedilir. **SuperAdmin → AI Platformlar** ekranından ekle.

### 3. Veritabanını Hazırla

```bash
# Şemayı uygula
npx prisma db push

# Başlangıç verilerini yükle
npx prisma db seed
```

Seed şunları oluşturur:
- SuperAdmin: `admin@cyba.com.tr` / `Admin123!`
- 35 yetki tanımı (RBAC)
- 6 rol şablonu (İçerik Editörü, Kıdemli Editör, Reklam Yöneticisi vb.)
- 34 kategori (6 ana + 28 alt)
- 6 haber pipeline ajanı (varsayılan promptlarla)
- 5 rehber pipeline ajanı
- 10 reklam alanı

### 4. Geliştirme Sunucusu

```bash
npm run dev
# http://localhost:3000
```

### 5. Üretim

```bash
npm run build
npm start
```

---

## Dizin Yapısı

```
├── app/
│   ├── (site)/                    # Haber sitesi (public)
│   │   ├── [kategori]/            # Kategori listesi
│   │   └── [kategori]/[slug]/     # Makale veya alt kategori
│   ├── (admin)/                   # Admin paneli (korumalı)
│   │   ├── editor/                # Editör: yazı yaz/düzenle, medya
│   │   ├── admin/                 # Admin: içerik yönetimi + yetkili modüller
│   │   └── superadmin/            # SuperAdmin: tam sistem kontrolü
│   │       ├── otomasyon/         # Pipeline paneli + ajan yönetimi
│   │       ├── kullanicilar/      # Kullanıcı onay + yetki matrix
│   │       ├── roller/            # Rol şablonu yönetimi
│   │       └── ai-platformlar/    # AI API anahtarları (şifreli)
│   └── api/                       # API route'ları
│
├── automation/
│   ├── agents/                    # 12 ajan (haber + rehber pipeline)
│   ├── collectors/                # RSS, YouTube, Reddit, NewsAPI, Pexels
│   ├── utils/                     # DB, logger, content inject yardımcıları
│   ├── pipeline.ts                # Pipeline motoru
│   └── index.ts                   # Ana çalıştırıcı
│
├── lib/
│   ├── auth.ts                    # NextAuth yapılandırması + RBAC token
│   ├── permissions.ts             # calculatePermissions, hasPermission
│   ├── crypto.ts                  # AES-256-CBC şifreleme/çözme
│   ├── db.ts                      # Prisma client (singleton)
│   ├── ai-router.ts               # AI platform yönlendirici
│   └── ai-adapters/               # DeepSeek, Gemini vb. adapter'lar
│
├── prisma/
│   ├── schema.prisma              # Veritabanı şeması
│   ├── seed.ts                    # Başlangıç verileri
│   └── dev.db                     # SQLite veritabanı
│
├── proxy.ts                       # Next.js middleware (route koruması)
└── types/
    ├── pipeline.ts                # Multi-agent pipeline tipleri
    └── next-auth.d.ts             # Session tip genişletmeleri
```

---

## RBAC Sistemi

### Sistem Rolleri

| Rol | Açıklama |
|---|---|
| `SUPERADMIN` | Tüm yetkiler + yetki yönetimi |
| `ADMIN` | Rol şablonunun verdiği yetkiler + özel eklemeler |
| `EDITOR` | Sadece kendi yazılarına erişim |

### Yetki Modülleri

`content`, `media`, `category`, `menu`, `page`, `tag`, `automation`, `revenue`, `ads`, `affiliate`, `user`, `theme`, `plugin`, `widget`, `newsletter`, `settings`, `backup`, `logs`, `cloudflare`

Her modül için eylemler: `view`, `create`, `edit`, `delete`, `publish` (modüle göre değişir)

### Kullanıcı Onay Sistemi

Yeni kullanıcılar `active: false` ile oluşturulur. SuperAdmin onaylayana kadar giriş yapamaz. SuperAdmin → Kullanıcılar → Onay Bekleyenler bölümünden aktif edilir.

---

## Otomasyon Kullanımı

### Admin Panelinden

`/superadmin/otomasyon` → kategori seç → Çalıştır

### Komut Satırından

```bash
# Tek kategori
npx tsx automation/index.ts finans

# Tüm kategoriler
npx tsx automation/index.ts all
```

### Pexels Satır İçi Görsel

`PEXELS_API_KEY` tanımlıysa MediaAgent, SEO tag'lerine göre Pexels'ten görsel çeker ve H2 bölümleri arasına `<figure class="article-image">` olarak yerleştirir. Anahtar yoksa sistem görselsiz devam eder.

---

## Prompt Yönetimi

**SuperAdmin → Otomasyon → Ajanlar:**
- Monaco editör (syntax highlighting, Ctrl+Z)
- Değişken butonları: `{{title}}`, `{{summary}}`, `{{category}}`, `{{content}}`, `{{news_list}}` vb.
- Canlı test + token/maliyet göstergesi
- Otomatik versiyon geçmişi ve geri alma
- Fabrika ayarlarına sıfırlama

---

## Veritabanı Modelleri (Özet)

| Model | Açıklama |
|---|---|
| `User` | Kullanıcılar — systemRole, roleId, active, permissions |
| `Permission` | Yetki tanımları (module + action) |
| `Role` | Rol şablonları |
| `RolePermission` | Rol → Yetki bağlantısı |
| `UserPermission` | Kullanıcıya özel eklenen/çıkarılan yetkiler |
| `Post` | Makaleler (DRAFT / PUBLISHED / ARCHIVED) |
| `Category` | Hiyerarşik kategoriler |
| `Tag` / `PostTag` | Etiket sistemi |
| `AiPlatform` / `AiLog` | AI platform yapılandırması ve kullanım logları |
| `AutomationAgent` | Ajan ayarları + prompt + istatistikler |
| `AutomationSession` | Pipeline koşusu oturumu |
| `AgentPromptHistory` | Prompt versiyon geçmişi |
| `ApiKey` | Şifreli sistem API anahtarları |
| `SuperAdminToken` | API key görüntüleme için 10dk geçici token |
| `ApiKeyViewLog` | API key görüntüleme log kaydı |
| `Setting` | Global anahtar-değer ayarları |
| `Subscriber` | Bülten aboneleri |
| `AffiliateLink` | Afiliasyon link takibi |
| `Income` / `Expense` | Gelir/gider takibi |

---

## Varsayılan Giriş Bilgileri

```
URL:      http://localhost:3000/login
E-posta:  admin@cyba.com.tr
Şifre:    Admin123!
```

> Üretim ortamına geçmeden önce şifreyi değiştir.

---

## Lisans

Özel proje — tüm hakları saklıdır.
#   a i - m e d i a  
 