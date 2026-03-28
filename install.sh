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
echo "║         v1.3.0 Setup Script           ║"
echo "╚═══════════════════════════════════════╝"
echo -e "${NC}"

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# GÜNCELLEME MODU (bash install.sh update)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━
if [ "$1" = "update" ] || [ "$1" = "--update" ]; then
  echo -e "${BLUE}🔄 Güncelleme modu...${NC}"

  if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}❌ Root yetkisi gerekli!${NC}"; exit 1
  fi
  if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Proje klasöründe çalıştırın!${NC}"; exit 1
  fi

  # Kaynak kodu güncelle
  echo -e "${YELLOW}📥 Kod güncelleniyor...${NC}"
  git pull
  if [ $? -ne 0 ]; then
    echo -e "${RED}❌ git pull başarısız!${NC}"; exit 1
  fi
  echo -e "${GREEN}✅ Kod güncellendi${NC}"

  # Hangi mod aktif?
  if command -v docker &>/dev/null && docker ps --format '{{.Names}}' 2>/dev/null | grep -q "ai-media"; then
    RUNNING_MODE="docker"
  elif command -v pm2 &>/dev/null && pm2 list 2>/dev/null | grep -q "ai-media"; then
    RUNNING_MODE="pm2"
  else
    RUNNING_MODE="manual"
  fi

  echo -e "${BLUE}Tespit edilen mod: ${CYAN}${RUNNING_MODE}${NC}"

  if [ "$RUNNING_MODE" = "docker" ]; then
    echo -e "${YELLOW}🐳 Docker image yeniden build ediliyor...${NC}"
    docker compose build --no-cache
    docker compose up -d
    echo -e "${GREEN}✅ Docker güncellendi${NC}"

  elif [ "$RUNNING_MODE" = "pm2" ]; then
    echo -e "${YELLOW}📦 Bağımlılıklar güncelleniyor...${NC}"
    npm install --silent
    echo -e "${YELLOW}🗃️  Yeni migration'lar uygulanıyor (mevcut veri korunur)...${NC}"
    set -a; source .env.local; set +a
    npx prisma generate
    npx prisma migrate deploy
    echo -e "${YELLOW}📦 Build alınıyor...${NC}"
    NODE_OPTIONS=--max-old-space-size=4096 npx next build
    pm2 restart ai-media
    echo -e "${GREEN}✅ PM2 güncellendi${NC}"

  else
    echo -e "${YELLOW}⚠️  Çalışan servis tespit edilemedi.${NC}"
    echo -e "   Manuel güncelleme için: npm install && npx prisma migrate deploy && npm run build"
  fi

  echo ""
  echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${GREEN}  ✅ GÜNCELLEME TAMAMLANDI!${NC}"
  echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo ""
  exit 0
fi

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
  echo -e "   cd /root/ai-media && sudo bash install.sh"
  exit 1
fi
echo -e "${GREEN}✅ Proje klasörü OK${NC}"

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# MEVCUT KURULUM TESPİTİ
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━
if [ -f ".env.local" ] && [ -f "docker-compose.yml" ]; then
  echo ""
  echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${CYAN}  Mevcut kurulum tespit edildi!${NC}"
  echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo ""

  # Mevcut durum
  if command -v docker &>/dev/null && docker ps --format '{{.Names}}' 2>/dev/null | grep -q "ai-media"; then
    IP=$(hostname -I | awk '{print $1}')
    echo -e "  Durum: ${GREEN}🟢 Docker çalışıyor${NC}  →  http://$IP:4000"
  elif command -v pm2 &>/dev/null && pm2 list 2>/dev/null | grep -q "ai-media"; then
    IP=$(hostname -I | awk '{print $1}')
    echo -e "  Durum: ${GREEN}🟢 PM2 çalışıyor${NC}  →  http://$IP:4000"
  else
    echo -e "  Durum: ${RED}🔴 Servis çalışmıyor${NC}"
  fi

  echo ""
  echo -e "  Ne yapmak istersiniz?"
  echo ""
  echo -e "  ${GREEN}1)${NC} 🔄  Sistemi Başlat"
  echo -e "  ${GREEN}2)${NC} 🔁  Yeniden Başlat"
  echo -e "  ${GREEN}3)${NC} 📊  Durum Göster"
  echo -e "  ${GREEN}4)${NC} 🔧  Güncelle (git pull + rebuild)"
  echo -e "  ${GREEN}5)${NC} 🆕  Yeni Kurulum (sıfırdan)"
  echo ""
  echo -ne "${GREEN}  Seçiminiz (1-5): ${NC}"
  read EXISTING_CHOICE

  case $EXISTING_CHOICE in
    1)
      echo -e "${YELLOW}▶️  Başlatılıyor...${NC}"
      if command -v docker &>/dev/null && [ -f "docker-compose.yml" ]; then
        docker compose up -d
        echo -e "${GREEN}✅ Docker başlatıldı!${NC}"
      elif command -v pm2 &>/dev/null; then
        set -a; source .env.local; set +a
        pm2 start ai-media 2>/dev/null || pm2 start npm --name "ai-media" -- start
        echo -e "${GREEN}✅ PM2 başlatıldı!${NC}"
      fi
      exit 0
      ;;
    2)
      echo -e "${YELLOW}🔁 Yeniden başlatılıyor...${NC}"
      if command -v docker &>/dev/null && docker ps --format '{{.Names}}' 2>/dev/null | grep -q "ai-media"; then
        docker compose restart
        echo -e "${GREEN}✅ Docker yeniden başlatıldı!${NC}"
      elif command -v pm2 &>/dev/null && pm2 list 2>/dev/null | grep -q "ai-media"; then
        pm2 restart ai-media
        echo -e "${GREEN}✅ PM2 yeniden başlatıldı!${NC}"
      else
        echo -e "${RED}❌ Çalışan servis bulunamadı!${NC}"
      fi
      exit 0
      ;;
    3)
      echo ""
      echo -e "${CYAN}📊 Servis Durumu:${NC}"
      command -v docker &>/dev/null && docker ps --filter "name=ai-media" --format "  Docker: {{.Names}} — {{.Status}}"
      command -v pm2 &>/dev/null && pm2 list 2>/dev/null | grep "ai-media" || true
      echo ""
      df -h / | tail -1 | awk '{print "  Disk: " $3 " / " $2 " (" $5 " dolu)"}'
      exit 0
      ;;
    4)
      # Güncelleme modu — $1 yoksa buradan tetiklenir
      echo -e "${BLUE}🔄 Güncelleme başlıyor...${NC}"
      git pull
      if command -v docker &>/dev/null && docker ps --format '{{.Names}}' 2>/dev/null | grep -q "ai-media"; then
        docker compose build --no-cache && docker compose up -d
        echo -e "${GREEN}✅ Docker güncellendi!${NC}"
      elif command -v pm2 &>/dev/null && pm2 list 2>/dev/null | grep -q "ai-media"; then
        set -a; source .env.local; set +a
        npm install --silent
        npx prisma generate
        npx prisma migrate deploy
        NODE_OPTIONS=--max-old-space-size=4096 npx next build
        pm2 restart ai-media
        echo -e "${GREEN}✅ PM2 güncellendi!${NC}"
      fi
      exit 0
      ;;
    5)
      echo -e "${YELLOW}⚠️  Yeni kurulum başlıyor...${NC}"
      # Devam et (aşağıdaki kurulum adımlarına geç)
      ;;
    *)
      echo -e "${RED}❌ Geçersiz seçim!${NC}"
      exit 1
      ;;
  esac
fi

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# KULLANICIDAN BİLGİ AL
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}  📋 Kurulum için bilgiler${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# IP veya Domain
echo -e "${YELLOW}❓ Soru 1/4:${NC}"
echo -e "   Sunucunun IP adresi veya domain adı nedir?"
echo -e "   Örnek: 82.29.174.45 veya example.com"
echo -ne "${GREEN}   > ${NC}"
read SERVER_ADDRESS

SERVER_ADDRESS=$(echo "$SERVER_ADDRESS" | sed 's|https\?://||' | sed 's|/$||')

if [[ $SERVER_ADDRESS =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  IS_IP=true
  SITE_URL="http://$SERVER_ADDRESS"
else
  IS_IP=false
  SITE_URL="http://$SERVER_ADDRESS"
fi

echo ""

# Admin email
echo -e "${YELLOW}❓ Soru 2/4:${NC}"
echo -e "   Admin email adresi nedir? (varsayılan: admin@cyba.com.tr)"
echo -ne "${GREEN}   Email (boş = varsayılan): ${NC}"
read ADMIN_EMAIL

if [ -z "$ADMIN_EMAIL" ]; then
  ADMIN_EMAIL="admin@cyba.com.tr"
fi

echo ""

# Admin şifre
echo -e "${YELLOW}❓ Soru 3/4:${NC}"
echo -e "   Admin şifresi belirleyin (varsayılan: Admin123!)"
echo -e "   En az 8 karakter, harf + rakam içermeli"
echo -ne "${GREEN}   Şifre (boş = Admin123!): ${NC}"
read -s ADMIN_PASSWORD
echo ""

if [ -z "$ADMIN_PASSWORD" ]; then
  ADMIN_PASSWORD="Admin123!"
fi

echo ""

# Mod seçimi
echo -e "${YELLOW}❓ Soru 4/4:${NC}"
echo -e "   Kurulum modu seçin:"
echo ""
echo -e "   ${GREEN}1)${NC} 🔧 Dev Modu"
echo -e "      → Hot-reload aktif, port 4000"
echo -e "      → Test ve geliştirme için ideal"
echo ""
echo -e "   ${GREEN}2)${NC} 🚀 Production (PM2 + Nginx)"
echo -e "      → PM2 ile arka planda, Nginx + SSL"
echo -e "      → Port 80/443"
echo ""
echo -e "   ${GREEN}3)${NC} 🐳 Docker"
echo -e "      → docker-compose ile izole container"
echo -e "      → Port 4000 (veya Nginx ile 80/443)"
echo ""
echo -e "   ${GREEN}4)${NC} 🔄 Sadece Başlat"
echo -e "      → Kurulum yapma, mevcut container'ı başlat"
echo -e "      → Docker kurulu olmalı"
echo ""
echo -ne "${GREEN}   Seçiminiz (1/2/3/4): ${NC}"
read MODE_CHOICE

while [[ "$MODE_CHOICE" != "1" && "$MODE_CHOICE" != "2" && "$MODE_CHOICE" != "3" && "$MODE_CHOICE" != "4" ]]; do
  echo -e "${RED}❌ Geçersiz seçim! 1, 2, 3 veya 4 girin${NC}"
  echo -ne "${GREEN}   Seçiminiz (1/2/3/4): ${NC}"
  read MODE_CHOICE
done

# Mod 4: Sadece başlat
if [ "$MODE_CHOICE" = "4" ]; then
  echo -e "${YELLOW}▶️  Container başlatılıyor...${NC}"
  touch prisma/dev.db automation.db 2>/dev/null || true
  mkdir -p public/uploads backups 2>/dev/null || true
  docker compose up -d 2>/dev/null || docker-compose up -d
  if [ $? -eq 0 ]; then
    IP=$(hostname -I | awk '{print $1}')
    echo -e "${GREEN}✅ Başlatıldı → http://$IP:4000${NC}"
  else
    echo -e "${RED}❌ Başlatılamadı. docker compose logs ile kontrol edin.${NC}"
  fi
  exit 0
fi

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# ADIM 2 - BAĞIMLILIKLAR
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo ""
echo -e "${BLUE}[2/8] Gerekli paketler kuruluyor...${NC}"

apt-get update -qq

apt-get install -y -qq curl git wget unzip openssl build-essential python3 lsb-release
echo -e "${GREEN}✅ Temel araçlar kuruldu${NC}"

# Docker modu için Docker kur, diğerleri için Node.js
if [ "$MODE_CHOICE" = "3" ]; then
  if command -v docker &> /dev/null; then
    echo -e "${GREEN}✅ Docker $(docker --version | grep -o '[0-9.]*' | head -1) mevcut${NC}"
  else
    echo -e "${YELLOW}📦 Docker kuruluyor...${NC}"
    curl -fsSL https://get.docker.com | sh
    systemctl enable docker && systemctl start docker
    echo -e "${GREEN}✅ Docker kuruldu${NC}"
  fi

  if command -v docker compose version &> /dev/null 2>&1; then
    echo -e "${GREEN}✅ Docker Compose mevcut${NC}"
  elif command -v docker-compose &> /dev/null; then
    echo -e "${GREEN}✅ Docker Compose (v1) mevcut${NC}"
  else
    echo -e "${YELLOW}📦 Docker Compose plugin kuruluyor...${NC}"
    apt-get install -y -qq docker-compose-plugin
    echo -e "${GREEN}✅ Docker Compose kuruldu${NC}"
  fi
else
  # Node.js 20
  if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -ge 20 ]; then
      echo -e "${GREEN}✅ Node.js $(node -v) mevcut${NC}"
    else
      echo -e "${YELLOW}⚠️  Güncelleniyor...${NC}"
      curl -fsSL https://deb.nodesource.com/setup_20.x | bash - > /dev/null 2>&1
      apt-get install -y nodejs -qq
    fi
  else
    echo -e "${YELLOW}📦 Node.js 20 kuruluyor...${NC}"
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - > /dev/null 2>&1
    apt-get install -y nodejs -qq
  fi
  echo -e "${GREEN}✅ Node.js $(node -v) hazır${NC}"

  if [ "$MODE_CHOICE" = "2" ]; then
    command -v pm2 &>/dev/null || npm install -g pm2 --quiet
    echo -e "${GREEN}✅ PM2 hazır${NC}"

    command -v nginx &>/dev/null || apt-get install -y nginx -qq
    echo -e "${GREEN}✅ Nginx hazır${NC}"

    command -v certbot &>/dev/null || apt-get install -y certbot python3-certbot-nginx -qq
    echo -e "${GREEN}✅ Certbot hazır${NC}"
  fi
fi

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# ADIM 3 - ENV DOSYASI
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo ""
echo -e "${BLUE}[3/8] Yapılandırma dosyası oluşturuluyor...${NC}"

# URL hesapla
if [ "$MODE_CHOICE" = "2" ] && [ "$IS_IP" = false ]; then
  NEXTAUTH_URL="https://$SERVER_ADDRESS"
elif [ "$MODE_CHOICE" = "1" ]; then
  NEXTAUTH_URL="http://$SERVER_ADDRESS:4000"
else
  NEXTAUTH_URL="http://$SERVER_ADDRESS:4000"
fi

# Güvenli key'ler üret
NEXTAUTH_SECRET=$(openssl rand -base64 32)
ENCRYPTION_KEY=$(openssl rand -hex 32)
AUTOMATION_SECRET=$(openssl rand -base64 24 | tr -d '=/+' | head -c 32)

if [ -f ".env.local" ]; then
  echo -e "${YELLOW}⚠️  .env.local mevcut — URL'ler ve eksik/placeholder key'ler güncelleniyor...${NC}"

  # URL alanlarını her zaman güncelle
  if grep -q "^NEXTAUTH_URL=" .env.local; then
    sed -i "s|^NEXTAUTH_URL=.*|NEXTAUTH_URL=\"${NEXTAUTH_URL}\"|" .env.local
  else
    echo "NEXTAUTH_URL=\"${NEXTAUTH_URL}\"" >> .env.local
  fi
  if grep -q "^APP_URL=" .env.local; then
    sed -i "s|^APP_URL=.*|APP_URL=\"${NEXTAUTH_URL}\"|" .env.local
  else
    echo "APP_URL=\"${NEXTAUTH_URL}\"" >> .env.local
  fi
  if grep -q "^NEXT_PUBLIC_SITE_URL=" .env.local; then
    sed -i "s|^NEXT_PUBLIC_SITE_URL=.*|NEXT_PUBLIC_SITE_URL=\"${NEXTAUTH_URL}\"|" .env.local
  else
    echo "NEXT_PUBLIC_SITE_URL=\"${NEXTAUTH_URL}\"" >> .env.local
  fi

  # DATABASE_URL yoksa ekle
  if ! grep -q "^DATABASE_URL=" .env.local; then
    echo "DATABASE_URL=\"file:./prisma/dev.db\"" >> .env.local
  fi

  # NEXTAUTH_SECRET — placeholder veya eksikse yenile
  EXISTING_SECRET=$(grep "^NEXTAUTH_SECRET=" .env.local | cut -d'"' -f2 | cut -d"'" -f2)
  if [ -z "$EXISTING_SECRET" ] || echo "$EXISTING_SECRET" | grep -qi "openssl\|rand\|rastgele\|placeholder\|siteadresi"; then
    if grep -q "^NEXTAUTH_SECRET=" .env.local; then
      sed -i "s|^NEXTAUTH_SECRET=.*|NEXTAUTH_SECRET=\"${NEXTAUTH_SECRET}\"|" .env.local
    else
      echo "NEXTAUTH_SECRET=\"${NEXTAUTH_SECRET}\"" >> .env.local
    fi
    echo -e "${GREEN}   ✅ NEXTAUTH_SECRET yenilendi${NC}"
  fi

  # ENCRYPTION_KEY — placeholder veya eksikse yenile
  EXISTING_ENC=$(grep "^ENCRYPTION_KEY=" .env.local | cut -d'"' -f2 | cut -d"'" -f2)
  if [ -z "$EXISTING_ENC" ] || echo "$EXISTING_ENC" | grep -qi "openssl\|rand\|hex\|karakter\|placeholder"; then
    if grep -q "^ENCRYPTION_KEY=" .env.local; then
      sed -i "s|^ENCRYPTION_KEY=.*|ENCRYPTION_KEY=\"${ENCRYPTION_KEY}\"|" .env.local
    else
      echo "ENCRYPTION_KEY=\"${ENCRYPTION_KEY}\"" >> .env.local
    fi
    echo -e "${GREEN}   ✅ ENCRYPTION_KEY yenilendi${NC}"
  fi

  # AUTOMATION_SECRET — placeholder veya eksikse yenile
  EXISTING_AUTO=$(grep "^AUTOMATION_SECRET=" .env.local | cut -d'"' -f2 | cut -d"'" -f2)
  if [ -z "$EXISTING_AUTO" ] || echo "$EXISTING_AUTO" | grep -qi "rastgele\|openssl\|rand\|placeholder"; then
    if grep -q "^AUTOMATION_SECRET=" .env.local; then
      sed -i "s|^AUTOMATION_SECRET=.*|AUTOMATION_SECRET=\"${AUTOMATION_SECRET}\"|" .env.local
    else
      echo "AUTOMATION_SECRET=\"${AUTOMATION_SECRET}\"" >> .env.local
    fi
    echo -e "${GREEN}   ✅ AUTOMATION_SECRET yenilendi${NC}"
  fi

else
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

# ─── API Anahtarları (SuperAdmin panelinden ekle!) ─
# DeepSeek, OpenAI, Anthropic, Pexels, YouTube, Telegram vs.
EOF
fi

echo -e "${GREEN}✅ .env.local hazır${NC}"

# Shell'e export et (sonraki prisma komutları için)
set -a
# shellcheck source=.env.local
source .env.local
set +a

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# ADIM 4 - PROJE BAĞIMLILIKLARI (Docker dışı)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━
if [ "$MODE_CHOICE" != "3" ]; then
  echo ""
  echo -e "${BLUE}[4/8] Proje bağımlılıkları kuruluyor...${NC}"
  echo -e "${YELLOW}   (native modüller derleniyor...)${NC}"
  npm install --silent
  if [ $? -ne 0 ]; then
    echo -e "${RED}❌ npm install başarısız!${NC}"
    exit 1
  fi
  echo -e "${GREEN}✅ Paketler kuruldu${NC}"
fi

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# ADIM 5 - VERİTABANI (Docker dışı)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━
if [ "$MODE_CHOICE" != "3" ]; then
  echo ""
  echo -e "${BLUE}[5/8] Veritabanı kuruluyor...${NC}"

  npx prisma generate
  if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Prisma client generate hatası!${NC}"
    exit 1
  fi
  echo -e "${GREEN}✅ Prisma client oluşturuldu${NC}"

  npx prisma migrate deploy
  if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Migrate hatası!${NC}"
    exit 1
  fi
  echo -e "${GREEN}✅ Veritabanı migrate edildi${NC}"

  # Seed — admin email+şifresini env var olarak geçir
  SEED_ADMIN_EMAIL="$ADMIN_EMAIL" SEED_ADMIN_PASSWORD="$ADMIN_PASSWORD" npx prisma db seed
  if [ $? -ne 0 ]; then
    echo -e "${YELLOW}⚠️  Seed başarısız, manuel dene: npx prisma db seed${NC}"
  else
    echo -e "${GREEN}✅ Veritabanı hazır, admin: ${ADMIN_EMAIL}${NC}"
  fi
fi

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# ADIM 6 - PACKAGE.JSON (Linux fix)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━
sed -i 's/"dev": "set NODE_OPTIONS[^"]*"/"dev": "NODE_OPTIONS=--max-old-space-size=8192 next dev -p 4000"/' package.json 2>/dev/null || true
sed -i 's/"start": "next start"/"start": "next start -p 4000"/' package.json 2>/dev/null || true

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# ADIM 7 - BAŞLATMA
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo ""
echo -e "${BLUE}[7/8] Uygulama başlatılıyor...${NC}"

# ── MOD 1: DEV ──────────────────────────────────────────────────
if [ "$MODE_CHOICE" = "1" ]; then

  ufw allow 4000/tcp 2>/dev/null || true

  echo ""
  echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${GREEN}  ✅ KURULUM TAMAMLANDI!${NC}"
  echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo ""
  echo -e "  🌐 Site:       ${CYAN}${SITE_URL}:4000${NC}"
  echo -e "  👤 Email:      ${CYAN}${ADMIN_EMAIL}${NC}"
  echo -e "  🔑 Şifre:      ${CYAN}${ADMIN_PASSWORD}${NC}"
  echo ""
  echo -e "  ${YELLOW}PM2 ile arka planda çalıştırmak için:${NC}"
  echo -e "  pm2 start npm --name 'ai-media-dev' -- run dev"
  echo ""
  echo -e "${YELLOW}  Dev modu başlatılıyor... (Ctrl+C → durdur)${NC}"
  echo ""

  NODE_OPTIONS=--max-old-space-size=8192 npx next dev -p 4000

# ── MOD 2: PRODUCTION (PM2 + Nginx) ─────────────────────────────
elif [ "$MODE_CHOICE" = "2" ]; then

  echo -e "${YELLOW}📦 Build alınıyor...${NC}"
  NODE_OPTIONS=--max-old-space-size=4096 npx next build
  if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Build hatası!${NC}"
    exit 1
  fi
  echo -e "${GREEN}✅ Build tamamlandı${NC}"

  pm2 delete ai-media 2>/dev/null || true
  pm2 start npm --name "ai-media" -- start
  pm2 startup systemd -u root --hp /root | tail -1 | bash 2>/dev/null || true
  pm2 save
  echo -e "${GREEN}✅ PM2 başlatıldı${NC}"

  NGINX_CONF="/etc/nginx/sites-available/ai-media"
  cat > $NGINX_CONF << NGINX
server {
    listen 80;
    server_name ${SERVER_ADDRESS};

    gzip on;
    gzip_types text/plain application/json application/javascript text/css;

    location /_next/static/ {
        alias $(pwd)/.next/static/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    location /uploads/ {
        alias $(pwd)/public/uploads/;
        expires 30d;
    }

    # SSE için uzun timeout
    location /api/otomasyon/calistir {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Connection '';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_read_timeout 900s;
        proxy_buffering off;
        proxy_cache off;
    }

    location / {
        proxy_pass http://localhost:4000;
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

  rm -f /etc/nginx/sites-enabled/default 2>/dev/null || true
  ln -sf $NGINX_CONF /etc/nginx/sites-enabled/ai-media
  nginx -t && systemctl reload nginx
  echo -e "${GREEN}✅ Nginx ayarlandı${NC}"

  ufw allow 80/tcp 2>/dev/null || true
  ufw allow 443/tcp 2>/dev/null || true

  SSL_ACTIVE=false
  if [ "$IS_IP" = false ]; then
    echo -e "${YELLOW}🔒 SSL alınıyor...${NC}"
    certbot --nginx -d "$SERVER_ADDRESS" --non-interactive --agree-tos \
      -m "admin@${SERVER_ADDRESS}" --redirect
    if [ $? -eq 0 ]; then
      SSL_ACTIVE=true
      sed -i "s|NEXTAUTH_URL=.*|NEXTAUTH_URL=\"https://${SERVER_ADDRESS}\"|" .env.local
      sed -i "s|APP_URL=.*|APP_URL=\"https://${SERVER_ADDRESS}\"|" .env.local
      sed -i "s|NEXT_PUBLIC_SITE_URL=.*|NEXT_PUBLIC_SITE_URL=\"https://${SERVER_ADDRESS}\"|" .env.local
      pm2 restart ai-media
      echo -e "${GREEN}✅ SSL kuruldu${NC}"
    else
      echo -e "${YELLOW}⚠️  SSL alınamadı. DNS doğru mu?${NC}"
    fi
  fi

  [ "$SSL_ACTIVE" = true ] && FINAL_URL="https://$SERVER_ADDRESS" || FINAL_URL="http://$SERVER_ADDRESS"

  echo ""
  echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${GREEN}  ✅ PRODUCTION KURULUM TAMAMLANDI!${NC}"
  echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo ""
  echo -e "  🌐 Site:       ${CYAN}${FINAL_URL}${NC}"
  echo -e "  👤 Email:      ${CYAN}${ADMIN_EMAIL}${NC}"
  echo -e "  🔑 Şifre:      ${CYAN}${ADMIN_PASSWORD}${NC}"
  echo ""
  echo -e "  📊 pm2 status  |  📋 pm2 logs ai-media"
  echo ""

# ── MOD 3: DOCKER ────────────────────────────────────────────────
elif [ "$MODE_CHOICE" = "3" ]; then

  # touch DB dosyaları — volume mount için boş dosya gerekli
  touch prisma/dev.db automation.db
  mkdir -p public/uploads backups

  echo -e "${YELLOW}🐳 Docker image build ediliyor...${NC}"
  docker build -t ai-media:latest .
  if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Docker build hatası!${NC}"
    exit 1
  fi
  echo -e "${GREEN}✅ Image hazır${NC}"

  # Çalışan container varsa durdur
  docker compose down 2>/dev/null || docker-compose down 2>/dev/null || true

  # Başlat
  docker compose up -d 2>/dev/null || docker-compose up -d
  if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Container başlatılamadı!${NC}"
    exit 1
  fi
  echo -e "${GREEN}✅ Container çalışıyor${NC}"

  # Container içinde seed + şifre güncelle
  echo -e "${YELLOW}🌱 Veritabanı seed + şifre ayarlanıyor...${NC}"

  # Container'ın migrate edip başlamasını bekle (max 30sn)
  for i in $(seq 1 30); do
    if docker exec ai-media npx prisma migrate status &>/dev/null; then
      break
    fi
    sleep 1
  done

  # Seed — admin email+şifresini env var olarak geçir (varsayılan oluşturulmaz)
  echo -e "${YELLOW}🌱 Veritabanı seed + admin ayarlanıyor...${NC}"
  if docker exec \
    -e SEED_ADMIN_EMAIL="$ADMIN_EMAIL" \
    -e SEED_ADMIN_PASSWORD="$ADMIN_PASSWORD" \
    ai-media npx prisma db seed; then
    echo -e "${GREEN}✅ Seed tamamlandı, admin: ${ADMIN_EMAIL}${NC}"
  else
    echo -e "${YELLOW}⚠️  Seed başarısız. Manuel: docker exec ai-media npx tsx scripts/set-admin.ts 'email' 'şifre'${NC}"
  fi

  ufw allow 4000/tcp 2>/dev/null || true

  # Sistem açılınca Docker otomatik başlasın
  systemctl enable docker 2>/dev/null || true
  # Container restart=unless-stopped ile zaten otomatik başlıyor
  # Ek güvenlik için cron: container durmuşsa yeniden başlat
  CRON_JOB="*/5 * * * * docker start ai-media 2>/dev/null || true"
  (crontab -l 2>/dev/null | grep -v "docker start ai-media"; echo "$CRON_JOB") | crontab -
  echo -e "${GREEN}✅ Otomatik başlatma ayarlandı${NC}"

  echo ""
  echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${GREEN}  ✅ DOCKER KURULUM TAMAMLANDI!${NC}"
  echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo ""
  echo -e "  🌐 Site:       ${CYAN}${SITE_URL}:4000${NC}"
  echo -e "  👤 Email:      ${CYAN}${ADMIN_EMAIL}${NC}"
  echo -e "  🔑 Şifre:      ${CYAN}${ADMIN_PASSWORD}${NC}"
  echo ""
  echo -e "  ${CYAN}Kolay yönetim:${NC}"
  echo -e "  bash start.sh"
  echo ""
  echo -e "  🐳 Manuel komutlar:"
  echo -e "  docker compose logs -f        # loglar"
  echo -e "  docker compose restart        # yeniden başlat"
  echo -e "  docker compose down           # durdur"
  echo ""
  echo -e "  🔑 Şifre değiştirmek için:"
  echo -e "  docker exec ai-media npx tsx scripts/set-admin.ts 'email@site.com' 'YeniŞifre'"
  echo ""
fi

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# ADIM 8 - GÜVENLİK
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${RED}  🔐 YAPILMASI GEREKENLER${NC}"
echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "  ${YELLOW}1.${NC} SuperAdmin → API Ayarları → AI key'leri ekle"
echo -e "  ${YELLOW}2.${NC} SuperAdmin → Otomasyon → zamanlamayı ayarla"
echo -e "  ${YELLOW}3.${NC} .env.local dosyasını kimseyle paylaşma!"
echo ""
echo -e "  ${CYAN}Güncelleme:${NC}"
echo -e "  bash install.sh update"
echo ""
echo -e "  ${CYAN}Email/şifre değiştirmek:${NC}"
echo -e "  npx tsx scripts/set-admin.ts 'email@site.com' 'YeniŞifre123!'"
echo ""
