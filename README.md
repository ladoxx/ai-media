# AI Media — Otomatik Haber Platformu

Next.js 16 tabanlı, çok ajanlı yapay zeka sistemiyle otomatik haber üretip yayınlayan haber platformu.

---

## Hızlı Kurulum (VPS)

```bash
git clone https://github.com/ladoxx/ai-media.git
cd ai-media
chmod +x install.sh
sudo bash install.sh
```

Script otomatik olarak:
- Node.js 20, Nginx, PM2, Certbot kurar
- `npm install` ile native modülleri derler
- Güvenli key'ler üretir (`.env.local`)
- Veritabanını migrate eder ve seed atar
- **Dev** veya **Production** modunu başlatır

---

## İlk Giriş

| Alan | Değer |
|------|-------|
| Email | `admin@cyba.com.tr` |
| Şifre | `Admin123!` |
| Admin | `/admin` |
| SuperAdmin | `/superadmin` |

> **Güvenlik:** İlk girişten sonra şifreyi değiştirin.

---

## Gereksinimler

| Bileşen | Versiyon |
|---------|----------|
| Node.js | 20 LTS+ |
| OS | Ubuntu 22.04 / Debian 12 |
| RAM | Min 2 GB (4 GB önerilen) |
| Disk | Min 5 GB |

---

## Manuel Kurulum

```bash
# 1. Bağımlılıklar
sudo apt-get install -y build-essential python3
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo bash -
sudo apt-get install -y nodejs
npm install -g pm2

# 2. Proje
git clone https://github.com/ladoxx/ai-media.git && cd ai-media
npm install

# 3. Ortam değişkenleri
cp .env.example .env.local
nano .env.local  # zorunlu alanları doldur

# 4. Veritabanı
npx prisma migrate deploy
npx prisma db seed

# 5. Başlatma (production)
npm run build
pm2 start npm --name "ai-media" -- start
pm2 save && pm2 startup
```

---

## `.env.local` Zorunlu Alanlar

```env
DATABASE_URL="file:./prisma/dev.db"
NEXTAUTH_SECRET="openssl rand -base64 32 ile üret"
NEXTAUTH_URL="https://siteadresi.com"
ENCRYPTION_KEY="openssl rand -hex 32 ile üret (64 karakter)"
AUTOMATION_SECRET="rastgele string"
APP_URL="https://siteadresi.com"
NEXT_PUBLIC_SITE_URL="https://siteadresi.com"
```

> API anahtarları (DeepSeek, Pexels, YouTube vb.) `.env.local`'e **yazılmaz**.
> SuperAdmin → API Ayarları panelinden girilir, şifreli olarak DB'de saklanır.

---

## Temel Özellikler

- **Çok Ajanlı Pipeline** — Scout → Writer → Editor → SEO → Media → Publisher
- **21 Kategori** — Finans, Kripto, Borsa, Gayrimenkul, Teknoloji, Oyun, Rehberler
- **RBAC** — SuperAdmin / Admin / Editor rol sistemi
- **Zamanlama** — Sabah, öğlen, akşam otomatik çalışma
- **Reklam Sistemi** — AdSense, affiliate banner, A/B test
- **Pexels Görseller** — Her makaleye otomatik inline görsel
- **Push Bildirimleri** — Service Worker ile web push
- **SEO** — Otomatik meta, Open Graph, JSON-LD, sitemap

---

## PM2 Komutları

```bash
pm2 status          # Durum
pm2 logs ai-media   # Loglar
pm2 restart ai-media
pm2 stop ai-media
```

## Güncelleme

```bash
git pull
npm install
npx prisma migrate deploy
npm run build
pm2 restart ai-media
```
