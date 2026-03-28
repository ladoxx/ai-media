# AI Media — Otomatik Haber Platformu

Next.js 16 tabanlı, çok ajanlı yapay zeka sistemiyle otomatik haber üretip yayınlayan haber platformu.

---

## Hızlı Kurulum (VPS)

```bash
git clone https://github.com/ladoxx/ai-media.git
cd ai-media
chmod +x install.sh start.sh
sudo bash install.sh
```

Script kurulum sırasında şunları sorar:
1. **IP veya domain** — sunucu adresi
2. **Admin email** — giriş email adresi
3. **Admin şifresi** — ilk giriş şifresi (boş = `Admin123!`)
4. **Kurulum modu** — Dev / Production / Docker / Sadece Başlat

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

### 4) Sadece Başlat
Kurulum yapmadan mevcut container'ı başlatır.

---

## Hızlı Komutlar

```bash
# İlk kurulum
chmod +x install.sh start.sh
sudo bash install.sh

# Sistemi yönet (kurulum sonrası)
bash start.sh

# Direkt komutlar
docker compose up -d      # başlat
docker compose down       # durdur
docker compose restart    # yeniden başlat
docker compose logs -f    # loglar
```

---

## İlk Giriş

| Alan | Değer |
|------|-------|
| Email | Kurulumda belirlenen email |
| Şifre | Kurulumda belirlenen şifre |
| Admin | `/admin` |
| SuperAdmin | `/superadmin` |

**Email ve şifre değiştirmek:**
```bash
# Docker
docker exec ai-media npx tsx scripts/set-admin.ts 'email@site.com' 'YeniŞifre123!'

# PM2 / Dev
npx tsx scripts/set-admin.ts 'email@site.com' 'YeniŞifre123!'
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

## `.env.local` Zorunlu Alanlar

> `install.sh` tüm değerleri otomatik üretir. Manuel kurulumda:

```env
DATABASE_URL="file:./prisma/dev.db"
NEXTAUTH_SECRET="$(openssl rand -base64 32)"
NEXTAUTH_URL="https://siteadresi.com"
ENCRYPTION_KEY="$(openssl rand -hex 32)"
AUTOMATION_SECRET="$(openssl rand -base64 24 | tr -d '=/+')"
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
# install.sh ile (önerilen):
sudo bash install.sh update

# Manuel PM2:
git pull && npm install && npx prisma migrate deploy && npm run build && pm2 restart ai-media

# Manuel Docker:
git pull && docker compose up -d --build
```
