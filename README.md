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

Script kurulum sırasında şunları sorar:
1. **IP veya domain** — sunucu adresi
2. **Admin şifresi** — ilk giriş şifresi (boş = `Admin123!`)
3. **Kurulum modu** — Dev / Production / Docker

---

## Kurulum Modları

### 1) Dev Modu
Hot-reload aktif, port 4000. Test ve geliştirme için.

### 2) Production (PM2 + Nginx)
Build alınır, PM2 ile arka planda çalışır. Nginx reverse proxy + otomatik SSL (domain gerekli).

### 3) Docker
```bash
sudo bash install.sh   # → 3 seç
```
Veya manuel:
```bash
cp .env.example .env.local && nano .env.local
touch prisma/dev.db automation.db
mkdir -p public/uploads backups
docker compose up -d
```

---

## İlk Giriş

| Alan | Değer |
|------|-------|
| Email | `admin@cyba.com.tr` |
| Şifre | Kurulumda belirlenen şifre |
| Admin | `/admin` |
| SuperAdmin | `/superadmin` |

**Email ve şifre değiştirmek:**
```bash
# Doğrudan
npx tsx scripts/set-admin.ts 'email@site.com' 'YeniŞifre123!'

# Docker
docker exec ai-media npx tsx scripts/set-admin.ts 'email@site.com' 'YeniŞifre123!'
```

---

## Gereksinimler

| Bileşen | Versiyon |
|---------|----------|
| Node.js | 20 LTS+ |
| OS | Ubuntu 22.04 / Debian 12 |
| RAM | Min 2 GB (4 GB önerilen) |
| Disk | Min 5 GB |

Docker için sadece Docker Engine yeterli, Node.js gerekmez.

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
nano .env.local

# 4. Veritabanı
npx prisma generate
npx prisma migrate deploy
npx prisma db seed

# 5. Admin şifre
npx tsx scripts/set-password.ts 'ŞifreniziYazın'

# 6. Başlatma (production)
npm run build
pm2 start npm --name "ai-media" -- start
pm2 save && pm2 startup
```

---

## `.env.local` Zorunlu Alanlar

```env
DATABASE_URL="file:./prisma/dev.db"
NEXTAUTH_SECRET="openssl rand -base64 32"
NEXTAUTH_URL="https://siteadresi.com"
ENCRYPTION_KEY="openssl rand -hex 32   # 64 karakter zorunlu"
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

## Docker Komutları

```bash
docker compose up -d          # Başlat
docker compose down           # Durdur
docker compose logs -f        # Loglar
docker compose restart        # Yeniden başlat
docker compose up -d --build  # Yeniden build et
```

## PM2 Komutları

```bash
pm2 status
pm2 logs ai-media
pm2 restart ai-media
```

## Güncelleme

```bash
git pull

# PM2 ile:
npm install && npx prisma migrate deploy && npm run build && pm2 restart ai-media

# Docker ile:
docker compose up -d --build
```
