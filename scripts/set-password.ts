/**
 * Admin şifre güncelleme scripti
 * Kullanım: npx tsx scripts/set-password.ts "YeniŞifre123!"
 */
import bcrypt from 'bcryptjs'
import { prisma } from '../lib/db'

const password = process.argv[2]

if (!password || password.length < 8) {
  console.error('❌ Şifre gerekli ve en az 8 karakter olmalı')
  console.error('   Kullanım: npx tsx scripts/set-password.ts "YeniŞifre123!"')
  process.exit(1)
}

const hash = await bcrypt.hash(password, 12)

const result = await prisma.user.updateMany({
  where: { systemRole: 'SUPERADMIN' },
  data: { password: hash },
})

if (result.count === 0) {
  console.error('❌ SUPERADMIN kullanıcı bulunamadı. Önce seed çalıştırın: npx prisma db seed')
  process.exit(1)
}

console.log(`✅ ${result.count} admin şifresi güncellendi`)
await prisma.$disconnect()
