/**
 * Admin email + şifre güncelleme scripti
 * Kullanım: npx tsx scripts/set-admin.ts "email@ornek.com" "Şifre123!"
 */
import bcrypt from 'bcryptjs'
import { prisma } from '../lib/db'

const email = process.argv[2]
const password = process.argv[3]

if (!email || !password) {
  console.error('❌ Kullanım: npx tsx scripts/set-admin.ts "email@ornek.com" "Şifre123!"')
  process.exit(1)
}

if (!email.includes('@')) {
  console.error('❌ Geçersiz email adresi')
  process.exit(1)
}

if (password.length < 8) {
  console.error('❌ Şifre en az 8 karakter olmalı')
  process.exit(1)
}

async function main() {
  const hash = await bcrypt.hash(password, 12)

  const result = await prisma.user.updateMany({
    where: { systemRole: 'SUPERADMIN' },
    data: { email, password: hash },
  })

  if (result.count === 0) {
    console.error('❌ SUPERADMIN kullanıcı bulunamadı. Önce seed çalıştır: npx prisma db seed')
    process.exit(1)
  }

  console.log(`✅ Admin güncellendi → ${email}`)
}

main().catch(console.error).finally(() => prisma.$disconnect())
