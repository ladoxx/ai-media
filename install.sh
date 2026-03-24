#!/bin/bash

# Renkler
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

clear
echo -e "${CYAN}"
echo "╔═══════════════════════════════════════╗"
echo "║     🚀 AI Media - Kurulum Ajanı       ║"
echo "║         v1.0.0 Setup Script           ║"
echo "╚═══════════════════════════════════════╝"
echo -e "${NC}"

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# ADIM 1 - SİSTEM KONTROLÜ
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo -e "${BLUE}[1/8] Sistem kontrol ediliyor...${NC}"

OS=$(lsb_release -si 2>/dev/null || echo "Unknown")
if [[ "$OS" != "Ubuntu" && "$OS" != "Debian" ]]; then
  echo -e "${RED}❌ Bu script sadece Ubuntu/Debian destekler!${NC}"
  exit 1
fi
echo -e "${GREEN}✅ İşletim sistemi: $OS $(lsb_release -sr)${NC}"

if [ "$EUID" -ne 0 ]; then
  echo -e "${RED}❌ Root yetkisi gerekli! sudo ile çalıştırın${NC}"
  exit 1
fi
echo -e "${GREEN}✅ Root yetkisi OK${NC}"

if [ ! -f "package.json" ]; then
  echo -e "${RED}❌ package.json bulunamadı!${NC}"
  echo -e "${YELLOW}   Bu scripti proje klasöründe çalıştırın:${NC}"
  echo -e "   cd /path/to/ai-media && sudo bash install.sh"
  exit 1
fi
echo -e "${GREEN}✅ Proje klasörü OK${NC}"

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# ADIM 2 - BAĞIMLILIKLAR
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo ""
echo -e "${BLUE}[2/8] Gerekli paketler kuruluyor...${NC}"

apt-get update -qq

apt-get install -y -qq \
  curl \
  git \
  wget \
  unzip \
  openssl \
  build-essential \
  python3 \
  lsb-release
echo -e "${GREEN}✅ Temel araçlar kuruldu${NC}"

# Node.js 20
if command -v node &> /dev/null; then
  NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
  if [ "$NODE_VERSION" -ge 20 ]; then
    echo -e "${GREEN}✅ Node.js $(node -v) mevcut${NC}"
  else
    echo -e "${YELLOW}⚠️  Node.js $(node -v) eski, güncelleniyor...${NC}"
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - > /dev/null 2>&1
    apt-get install -y nodejs -qq
    echo -e "${GREEN}✅ Node.js $(node -v) güncellendi${NC}"
  fi
else
  echo -e "${YELLOW}📦 Node.js 20 kuruluyor...${NC}"
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash - > /dev/null 2>&1
  apt-get install -y nodejs -qq
  echo -e "${GREEN}✅ Node.js $(node -v) kuruldu${NC}"
fi

# PM2
if ! command -v pm2 &> /dev/null; then
  echo -e "${YELLOW}📦 PM2 kuruluyor...${NC}"
  npm install -g pm2 --quiet
fi
echo -e "${GREEN}✅ PM2 $(pm2 -v) hazır${NC}"

# Nginx
if ! command -v nginx &> /dev/null; then
  echo -e "${YELLOW}📦 Nginx kuruluyor...${NC}"
  apt-get install -y nginx -qq
fi
echo -e "${GREEN}✅ Nginx $(nginx -v 2>&1 | grep -o '[0-9.]*') hazır${NC}"

# Certbot
if ! command -v certbot &> /dev/null; then
  echo -e "${YELLOW}📦 Certbot kuruluyor...${NC}"
  apt-get install -y certbot python3-certbot-nginx -qq
fi
echo -e "${GREEN}✅ Certbot hazır${NC}"

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# ADIM 3 - PROJE BAĞIMLILIKLARI
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo ""
echo -e "${BLUE}[3/8] Proje bağımlılıkları kuruluyor...${NC}"
echo -e "${YELLOW}   (native modüller derleniyor, biraz sürebilir...)${NC}"

npm install --silent
if [ $? -ne 0 ]; then
  echo -e "${RED}❌ npm install başarısız!${NC}"
  exit 1
fi
echo -e "${GREEN}✅ Paketler kuruldu${NC}"

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# ADIM 4 - KULLANICIDAN BİLGİ AL
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}  📋 Kurulum için birkaç bilgiye ihtiyaç var${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Soru 1: IP veya Domain
echo -e "${YELLOW}❓ Soru 1/2:${NC}"
echo -e "   Sunucunun IP adresi veya domain adı nedir?"
echo -e "   Örnek: 192.168.1.1 veya example.com"
echo -ne "${GREEN}   > ${NC}"
read SERVER_ADDRESS

# http prefix temizle
SERVER_ADDRESS=$(echo "$SERVER_ADDRESS" | sed 's|https\?://||' | sed 's|/$||')

# URL oluştur
if [[ $SERVER_ADDRESS =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  IS_IP=true
  SITE_URL="http://$SERVER_ADDRESS"
else
  IS_IP=false
  SITE_URL="http://$SERVER_ADDRESS"
fi

echo ""

# Soru 2: Mod seçimi
echo -e "${YELLOW}❓ Soru 2/2:${NC}"
echo -e "   Ne yapmak istersiniz?"
echo ""
echo -e "   ${GREEN}1)${NC} 🔧 Dev Modu"
echo -e "      → Hot-reload aktif, hata ayıklamaya uygun"
echo -e "      → Port 3000 üzerinden erişim"
echo -e "      → Test ve geliştirme için ideal"
echo ""
echo -e "   ${GREEN}2)${NC} 🚀 Production Kurulum"
echo -e "      → Build alınır, PM2 ile arka planda çalışır"
echo -e "      → Nginx reverse proxy + otomatik SSL"
echo -e "      → Port 80/443 (domain gerekli SSL için)"
echo ""
echo -ne "${GREEN}   Seçiminiz (1 veya 2): ${NC}"
read MODE_CHOICE

while [[ "$MODE_CHOICE" != "1" && "$MODE_CHOICE" != "2" ]]; do
  echo -e "${RED}❌ Geçersiz seçim! 1 veya 2 girin${NC}"
  echo -ne "${GREEN}   Seçiminiz (1 veya 2): ${NC}"
  read MODE_CHOICE
done

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# ADIM 5 - ENV DOSYASI
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo ""
echo -e "${BLUE}[5/8] Yapılandırma dosyası oluşturuluyor...${NC}"

# Production'da NEXTAUTH_URL'yi https ile ayarla
if [ "$MODE_CHOICE" = "2" ] && [ "$IS_IP" = false ]; then
  NEXTAUTH_URL="https://$SERVER_ADDRESS"
elif [ "$MODE_CHOICE" = "2" ]; then
  NEXTAUTH_URL="http://$SERVER_ADDRESS"
else
  NEXTAUTH_URL="http://$SERVER_ADDRESS:3000"
fi

# Güvenli key'ler üret
NEXTAUTH_SECRET=$(openssl rand -base64 32)
ENCRYPTION_KEY=$(openssl rand -hex 32)   # 64 hex karakter = AES-256 için zorunlu
AUTOMATION_SECRET=$(openssl rand -base64 24 | tr -d '=/+' | head -c 32)

cat > .env.local << EOF
# ─── Veritabanı ───────────────────────────────
DATABASE_URL="file:./prisma/dev.db"

# ─── NextAuth ─────────────────────────────────
NEXTAUTH_SECRET="${NEXTAUTH_SECRET}"
NEXTAUTH_URL="${NEXTAUTH_URL}"

# ─── Şifreleme (64 hex karakter - değiştirme!) ─
ENCRYPTION_KEY="${ENCRYPTION_KEY}"

# ─── Otomasyon ────────────────────────────────
AUTOMATION_SECRET="${AUTOMATION_SECRET}"
APP_URL="${NEXTAUTH_URL}"

# ─── Cloudflare Worker (SuperAdmin'den ekle) ──
CLOUDFLARE_WORKER_URL=""
CLOUDFLARE_WORKER_SECRET=""

# ─── Site URL ─────────────────────────────────
NEXT_PUBLIC_SITE_URL="${NEXTAUTH_URL}"

# ─── API Anahtarları (SuperAdmin panelinden ekle) ─
# DeepSeek, OpenAI, Anthropic, Pexels,
# YouTube, Telegram, NewsAPI, vs.
# Bu anahtarları buraya YAZMA → SuperAdmin panelini kullan!
EOF

echo -e "${GREEN}✅ .env.local oluşturuldu${NC}"
echo -e "${YELLOW}⚠️  API key'leri SuperAdmin → API Ayarları'ndan girin!${NC}"

# dotenv/config sadece .env okur, .env.local okumaz.
# Tüm sonraki komutlar (prisma, next build) için shell'e export et.
set -a
# shellcheck source=.env.local
source .env.local
set +a

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# ADIM 6 - VERİTABANI
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo ""
echo -e "${BLUE}[6/8] Veritabanı kuruluyor...${NC}"

npx prisma generate
if [ $? -ne 0 ]; then
  echo -e "${RED}❌ Prisma client generate hatası!${NC}"
  exit 1
fi
echo -e "${GREEN}✅ Prisma client oluşturuldu${NC}"

npx prisma migrate deploy
if [ $? -ne 0 ]; then
  echo -e "${RED}❌ Migrate hatası! Veritabanı oluşturulamadı.${NC}"
  exit 1
fi
echo -e "${GREEN}✅ Veritabanı migrate edildi${NC}"

npx prisma db seed
if [ $? -ne 0 ]; then
  echo -e "${YELLOW}⚠️  Seed başarısız, manuel seed gerekebilir: npx prisma db seed${NC}"
else
  echo -e "${GREEN}✅ Başlangıç verileri eklendi${NC}"
fi

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# ADIM 7 - BAŞLATMA
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo ""
echo -e "${BLUE}[7/8] Uygulama başlatılıyor...${NC}"

# package.json dev scriptini Linux için güncelle (Windows 'set' komutu çalışmaz)
sed -i 's/"dev": "set NODE_OPTIONS.*&&/"dev": "/' package.json 2>/dev/null || true
sed -i 's/"dev": "next dev\b/"dev": "NODE_OPTIONS=--max-old-space-size=8192 next dev/' package.json 2>/dev/null || true

if [ "$MODE_CHOICE" = "1" ]; then

  # ── DEV MODU ──
  echo -e "${CYAN}🔧 Dev modu başlatılıyor...${NC}"

  ufw allow 3000/tcp 2>/dev/null || true

  echo ""
  echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${GREEN}  ✅ KURULUM TAMAMLANDI!${NC}"
  echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo ""
  echo -e "  🌐 Site:       ${CYAN}${SITE_URL}:3000${NC}"
  echo -e "  👤 Email:      ${CYAN}admin@cyba.com.tr${NC}"
  echo -e "  🔑 Şifre:      ${CYAN}Admin123!${NC}"
  echo ""
  echo -e "  ${RED}⚠️  İLK GİRİŞTEN SONRA YAPILACAKLAR:${NC}"
  echo -e "  1. Admin şifresini değiştir"
  echo -e "  2. SuperAdmin → API Ayarları → key'leri ekle"
  echo -e "  3. SuperAdmin → Otomasyon → zamanlamayı ayarla"
  echo ""
  echo -e "${YELLOW}  Dev modu başlatılıyor... (Ctrl+C ile durdur)${NC}"
  echo -e "${YELLOW}  PM2 ile arka planda çalıştırmak için:${NC}"
  echo -e "  pm2 start npm --name 'ai-media-dev' -- run dev"
  echo ""

  # Sekiz GB heap, direkt next dev
  NODE_OPTIONS=--max-old-space-size=8192 npx next dev

else

  # ── PRODUCTION MODU ──
  echo -e "${CYAN}🚀 Production modu kuruluyor...${NC}"

  # Build
  echo -e "${YELLOW}📦 Build alınıyor (birkaç dakika sürebilir)...${NC}"
  NODE_OPTIONS=--max-old-space-size=4096 npx next build
  if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Build hatası! Logları kontrol edin.${NC}"
    exit 1
  fi
  echo -e "${GREEN}✅ Build tamamlandı${NC}"

  # PM2
  pm2 delete ai-media 2>/dev/null || true
  pm2 start npm --name "ai-media" -- start
  pm2 startup systemd -u root --hp /root | tail -1 | bash 2>/dev/null || true
  pm2 save
  echo -e "${GREEN}✅ PM2 ile başlatıldı${NC}"

  # Nginx
  NGINX_CONF="/etc/nginx/sites-available/ai-media"
  cat > $NGINX_CONF << NGINX
server {
    listen 80;
    server_name ${SERVER_ADDRESS};

    # Gzip
    gzip on;
    gzip_types text/plain application/json application/javascript text/css;

    # Statik dosyalar
    location /_next/static/ {
        alias $(pwd)/.next/static/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    location /uploads/ {
        alias $(pwd)/public/uploads/;
        expires 30d;
    }

    # Otomasyon SSE için uzun timeout
    location /api/otomasyon/calistir {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Connection '';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_read_timeout 900s;
        proxy_buffering off;
        proxy_cache off;
    }

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 60s;
    }
}
NGINX

  # Varsayılan nginx sitesini devre dışı bırak
  rm -f /etc/nginx/sites-enabled/default 2>/dev/null || true
  ln -sf $NGINX_CONF /etc/nginx/sites-enabled/ai-media

  nginx -t
  if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Nginx konfigürasyon hatası!${NC}"
    exit 1
  fi
  systemctl reload nginx
  echo -e "${GREEN}✅ Nginx ayarlandı${NC}"

  # Firewall
  ufw allow 80/tcp 2>/dev/null || true
  ufw allow 443/tcp 2>/dev/null || true

  # SSL (sadece domain için)
  SSL_ACTIVE=false
  if [ "$IS_IP" = false ]; then
    echo -e "${YELLOW}🔒 SSL sertifikası alınıyor...${NC}"
    certbot --nginx -d "$SERVER_ADDRESS" \
      --non-interactive --agree-tos \
      -m "admin@${SERVER_ADDRESS}" \
      --redirect
    if [ $? -eq 0 ]; then
      SSL_ACTIVE=true
      # NEXTAUTH_URL ve APP_URL https olarak güncelle
      sed -i "s|NEXTAUTH_URL=.*|NEXTAUTH_URL=\"https://${SERVER_ADDRESS}\"|" .env.local
      sed -i "s|APP_URL=.*|APP_URL=\"https://${SERVER_ADDRESS}\"|" .env.local
      sed -i "s|NEXT_PUBLIC_SITE_URL=.*|NEXT_PUBLIC_SITE_URL=\"https://${SERVER_ADDRESS}\"|" .env.local
      pm2 restart ai-media
      echo -e "${GREEN}✅ SSL kuruldu${NC}"
    else
      echo -e "${YELLOW}⚠️  SSL alınamadı. DNS kayıtları doğru mu? Manuel dene:${NC}"
      echo -e "   certbot --nginx -d ${SERVER_ADDRESS}"
    fi
  else
    echo -e "${YELLOW}⚠️  IP adresi için SSL alınamaz (domain gerekli)${NC}"
  fi

  # Final URL
  if [ "$SSL_ACTIVE" = true ]; then
    FINAL_URL="https://$SERVER_ADDRESS"
  else
    FINAL_URL="http://$SERVER_ADDRESS"
  fi

  # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  # ADIM 8 - SONUÇ
  # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  echo ""
  echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${GREEN}  ✅ PRODUCTION KURULUM TAMAMLANDI!${NC}"
  echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo ""
  echo -e "  🌐 Site:       ${CYAN}${FINAL_URL}${NC}"
  echo -e "  🔧 Admin:      ${CYAN}${FINAL_URL}/admin${NC}"
  echo -e "  ⚙️  SuperAdmin: ${CYAN}${FINAL_URL}/superadmin${NC}"
  echo -e "  👤 Email:      ${CYAN}admin@cyba.com.tr${NC}"
  echo -e "  🔑 Şifre:      ${CYAN}Admin123!${NC}"
  echo ""
  echo -e "  📊 PM2 durumu: ${CYAN}pm2 status${NC}"
  echo -e "  📋 Loglar:     ${CYAN}pm2 logs ai-media${NC}"
  echo -e "  🔄 Yeniden:    ${CYAN}pm2 restart ai-media${NC}"
  echo ""
  echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${RED}  🔐 GÜVENLİK UYARILARI${NC}"
  echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo ""
  echo -e "  ${YELLOW}1.${NC} Admin şifresini HEMEN değiştir"
  echo -e "  ${YELLOW}2.${NC} SuperAdmin → API Ayarları → key'leri ekle"
  echo -e "  ${YELLOW}3.${NC} SuperAdmin → Otomasyon → zamanlamayı kur"
  echo -e "  ${YELLOW}4.${NC} .env.local dosyasını kimseyle paylaşma!"
  echo -e "  ${YELLOW}5.${NC} Düzenli yedek al: SuperAdmin → Yedekleme"
  echo ""

fi
