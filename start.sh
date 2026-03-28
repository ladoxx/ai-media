#!/bin/bash

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

clear
echo -e "${CYAN}"
echo "╔═══════════════════════════════════════╗"
echo "║     🚀 AI Media - Kontrol Paneli      ║"
echo "╚═══════════════════════════════════════╝"
echo -e "${NC}"

if ! command -v docker &> /dev/null; then
  echo -e "${RED}❌ Docker bulunamadı!${NC}"
  echo "Önce install.sh çalıştırın"
  exit 1
fi

CONTAINER=$(docker ps -a --filter "name=ai-media" --format "{{.Names}}" 2>/dev/null)
if [ -z "$CONTAINER" ]; then
  echo -e "${RED}❌ ai-media container bulunamadı!${NC}"
  echo "Önce install.sh ile kurulum yapın"
  exit 1
fi

while true; do
  echo ""
  echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

  STATUS=$(docker ps --filter "name=ai-media" --format "{{.Status}}" 2>/dev/null)
  if [ -n "$STATUS" ]; then
    echo -e "  Durum: ${GREEN}🟢 Çalışıyor${NC} - $STATUS"
  else
    echo -e "  Durum: ${RED}🔴 Durdu${NC}"
  fi

  IP=$(hostname -I | awk '{print $1}')
  echo -e "  Site:  ${CYAN}http://$IP:4000${NC}"
  echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo ""
  echo -e "  ${GREEN}1)${NC} ▶️  Başlat"
  echo -e "  ${GREEN}2)${NC} ⏹️  Durdur"
  echo -e "  ${GREEN}3)${NC} 🔄  Yeniden Başlat"
  echo -e "  ${GREEN}4)${NC} 📋  Logları Göster"
  echo -e "  ${GREEN}5)${NC} 🔧  Güncelle (git pull + rebuild)"
  echo -e "  ${GREEN}6)${NC} 🗄️  Veritabanı Yedekle"
  echo -e "  ${GREEN}7)${NC} 🔑  Admin Email/Şifre Değiştir"
  echo -e "  ${GREEN}8)${NC} 📊  Sistem Durumu"
  echo -e "  ${GREEN}0)${NC} 🚪  Çıkış"
  echo ""
  echo -ne "${GREEN}  Seçim: ${NC}"
  read CHOICE

  case $CHOICE in
    1)
      echo -e "${YELLOW}▶️  Başlatılıyor...${NC}"
      docker compose up -d
      echo -e "${GREEN}✅ Başlatıldı!${NC}"
      ;;
    2)
      echo -e "${YELLOW}⏹️  Durduruluyor...${NC}"
      docker compose down
      echo -e "${GREEN}✅ Durduruldu!${NC}"
      ;;
    3)
      echo -e "${YELLOW}🔄 Yeniden başlatılıyor...${NC}"
      docker compose restart
      echo -e "${GREEN}✅ Yeniden başlatıldı!${NC}"
      ;;
    4)
      echo -e "${CYAN}📋 Loglar (Ctrl+C ile çık):${NC}"
      docker compose logs -f --tail=50
      ;;
    5)
      echo -e "${YELLOW}🔧 Güncelleniyor...${NC}"
      git pull
      docker compose down
      docker compose build --no-cache
      docker compose up -d
      echo -e "${GREEN}✅ Güncellendi!${NC}"
      ;;
    6)
      BACKUP_DATE=$(date +%Y%m%d_%H%M%S)
      mkdir -p backups
      docker cp ai-media:/app/prisma/dev.db ./backups/db_$BACKUP_DATE.db
      echo -e "${GREEN}✅ Yedek alındı: backups/db_$BACKUP_DATE.db${NC}"
      ;;
    7)
      echo -ne "${YELLOW}Yeni email: ${NC}"
      read NEW_EMAIL
      echo -ne "${YELLOW}Yeni şifre: ${NC}"
      read -s NEW_PASS
      echo ""
      docker exec ai-media npx tsx scripts/set-admin.ts "$NEW_EMAIL" "$NEW_PASS"
      ;;
    8)
      echo ""
      echo -e "${CYAN}📊 Sistem Durumu:${NC}"
      echo ""
      docker stats ai-media --no-stream --format "CPU: {{.CPUPerc}}  RAM: {{.MemUsage}}"
      echo ""
      df -h / | tail -1 | awk '{print "Disk: " $3 " / " $2 " (" $5 " dolu)"}'
      ;;
    0)
      echo -e "${GREEN}Görüşürüz! 👋${NC}"
      exit 0
      ;;
    *)
      echo -e "${RED}❌ Geçersiz seçim!${NC}"
      ;;
  esac
done
