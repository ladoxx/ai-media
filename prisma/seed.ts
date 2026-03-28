import path from 'path'
import { PrismaLibSql } from '@prisma/adapter-libsql'
import { PrismaClient } from '../app/generated/prisma/client'
import * as bcrypt from 'bcryptjs'

const dbPath = path.resolve(process.cwd(), 'prisma', 'dev.db').replace(/\\/g, '/')
const adapter = new PrismaLibSql({ url: `file:${dbPath}` })
const prisma = new PrismaClient({ adapter } as any)

async function main() {
  console.log('🌱 Seed başlıyor...')

  // ── Admin kullanıcı ───────────────────────────────────────────────────────
  // Env var varsa onları kullan (install.sh'den geçirilir), yoksa varsayılan
  const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@cyba.com.tr'
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'Admin123!'

  const existingAdmin = await prisma.user.findFirst({ where: { systemRole: 'SUPERADMIN' } })
  if (!existingAdmin) {
    const hash = await bcrypt.hash(adminPassword, 12)
    await prisma.user.create({
      data: { email: adminEmail, password: hash, name: 'Admin', systemRole: 'SUPERADMIN', active: true },
    })
    console.log(`✅ Admin oluşturuldu: ${adminEmail}`)
  } else {
    // Env var ile çalışıyorsa email+şifreyi güncelle, aksi halde sadece active yap
    if (process.env.SEED_ADMIN_EMAIL && process.env.SEED_ADMIN_PASSWORD) {
      const hash = await bcrypt.hash(adminPassword, 12)
      await prisma.user.update({
        where: { id: existingAdmin.id },
        data: { email: adminEmail, password: hash, active: true },
      })
      console.log(`✅ Admin güncellendi: ${adminEmail}`)
    } else {
      await prisma.user.update({ where: { id: existingAdmin.id }, data: { active: true } })
      console.log('✅ Admin zaten mevcut, aktif edildi')
    }
  }

  // ── RBAC: Yetkiler ────────────────────────────────────────────────────────
  const allPermissions = [
    { module: 'content',    action: 'view',    label: 'Yazıları Görüntüle' },
    { module: 'content',    action: 'create',  label: 'Yazı Yaz' },
    { module: 'content',    action: 'edit',    label: 'Yazı Düzenle' },
    { module: 'content',    action: 'delete',  label: 'Yazı Sil' },
    { module: 'content',    action: 'publish', label: 'Yazı Yayınla' },
    { module: 'media',      action: 'upload',  label: 'Medya Yükle' },
    { module: 'media',      action: 'delete',  label: 'Medya Sil' },
    { module: 'category',   action: 'view',    label: 'Kategorileri Görüntüle' },
    { module: 'category',   action: 'manage',  label: 'Kategori Yönet' },
    { module: 'menu',       action: 'manage',  label: 'Menü Yönet' },
    { module: 'page',       action: 'manage',  label: 'Sayfa Yönet' },
    { module: 'tag',        action: 'manage',  label: 'Etiket Yönet' },
    { module: 'automation', action: 'view',    label: 'Otomasyonu Görüntüle' },
    { module: 'automation', action: 'run',     label: 'Otomasyon Çalıştır' },
    { module: 'automation', action: 'config',  label: 'Ajan Ayarları' },
    { module: 'automation', action: 'prompt',  label: 'Prompt Düzenle' },
    { module: 'automation', action: 'logs',    label: 'Logları Görüntüle' },
    { module: 'revenue',    action: 'view',    label: 'Gelir Görüntüle' },
    { module: 'revenue',    action: 'manage',  label: 'Gelir/Gider Ekle' },
    { module: 'ads',        action: 'view',    label: 'Reklamları Görüntüle' },
    { module: 'ads',        action: 'manage',  label: 'Reklam Yönet' },
    { module: 'affiliate',  action: 'manage',  label: 'Affiliate Yönet' },
    { module: 'user',       action: 'view',    label: 'Kullanıcıları Görüntüle' },
    { module: 'user',       action: 'create',  label: 'Kullanıcı Ekle' },
    { module: 'user',       action: 'edit',    label: 'Kullanıcı Düzenle' },
    { module: 'user',       action: 'delete',  label: 'Kullanıcı Sil' },
    { module: 'user',       action: 'approve', label: 'Kullanıcı Onayla' },
    { module: 'theme',      action: 'manage',  label: 'Tema Ayarları' },
    { module: 'plugin',     action: 'manage',  label: 'Plugin Yönet' },
    { module: 'widget',     action: 'manage',  label: 'Widget Yönet' },
    { module: 'newsletter', action: 'view',    label: 'Aboneleri Görüntüle' },
    { module: 'newsletter', action: 'send',    label: 'Bülten Gönder' },
    { module: 'settings',   action: 'manage',  label: 'Site Ayarları' },
    { module: 'backup',     action: 'manage',  label: 'Yedekleme' },
    { module: 'logs',       action: 'view',    label: 'Sistem Logları' },
    { module: 'cloudflare', action: 'manage',  label: 'Cloudflare Worker' },
    { module: 'apikey',     action: 'view',    label: 'API Key Görüntüle' },
  ]

  for (const p of allPermissions) {
    await prisma.permission.upsert({
      where: { module_action: { module: p.module, action: p.action } },
      update: { label: p.label },
      create: p,
    })
  }
  console.log('✅ Yetkiler oluşturuldu')

  // ── RBAC: Rol şablonları ──────────────────────────────────────────────────
  const getPerms = async (pairs: Array<[string, string]>) => {
    const results = []
    for (const [module, action] of pairs) {
      const p = await prisma.permission.findUnique({ where: { module_action: { module, action } } })
      if (p) results.push(p.id)
    }
    return results
  }

  const allNonApiKeyPerms = await prisma.permission.findMany({
    where: { module: { not: 'apikey' } },
  })

  const roleDefs = [
    {
      slug: 'icerik-editor',
      name: 'İçerik Editörü',
      description: 'Yazı yazar ve düzenler',
      perms: [
        ['content','view'],['content','create'],['content','edit'],['content','delete'],['content','publish'],
        ['media','upload'],['media','delete'],
        ['category','view'],['tag','manage'],
      ] as Array<[string,string]>,
    },
    {
      slug: 'kıdemli-editor',
      name: 'Kıdemli Editör',
      description: 'İçerik + kategori + menü + bülten görüntüleme',
      perms: [
        ['content','view'],['content','create'],['content','edit'],['content','delete'],['content','publish'],
        ['media','upload'],['media','delete'],
        ['category','view'],['category','manage'],
        ['tag','manage'],['menu','manage'],['page','manage'],
        ['newsletter','view'],
      ] as Array<[string,string]>,
    },
    {
      slug: 'reklam-yoneticisi',
      name: 'Reklam Yöneticisi',
      description: 'Reklam ve affiliate yönetimi',
      perms: [
        ['ads','view'],['ads','manage'],
        ['affiliate','manage'],
        ['revenue','view'],
        ['content','view'],
      ] as Array<[string,string]>,
    },
    {
      slug: 'otomasyon-operatoru',
      name: 'Otomasyon Operatörü',
      description: 'Otomasyon çalıştırma ve log görüntüleme',
      perms: [
        ['automation','view'],['automation','run'],['automation','logs'],
        ['content','view'],
      ] as Array<[string,string]>,
    },
    {
      slug: 'icerik-otomasyon',
      name: 'İçerik + Otomasyon',
      description: 'Tam içerik yetkisi + tam otomasyon yetkisi',
      perms: [
        ['content','view'],['content','create'],['content','edit'],['content','delete'],['content','publish'],
        ['media','upload'],['media','delete'],
        ['category','view'],['category','manage'],['tag','manage'],
        ['automation','view'],['automation','run'],['automation','config'],['automation','prompt'],['automation','logs'],
      ] as Array<[string,string]>,
    },
    {
      slug: 'tam-yetkili-admin',
      name: 'Tam Yetkili Admin',
      description: 'API Key hariç tüm yetkiler',
      perms: allNonApiKeyPerms.map(p => [p.module, p.action] as [string,string]),
    },
  ]

  for (const def of roleDefs) {
    const permIds = await getPerms(def.perms)
    const role = await prisma.role.upsert({
      where: { slug: def.slug },
      update: { name: def.name, description: def.description },
      create: { slug: def.slug, name: def.name, description: def.description },
    })
    await prisma.rolePermission.deleteMany({ where: { roleId: role.id } })
    for (const permId of permIds) {
      await prisma.rolePermission.create({ data: { roleId: role.id, permissionId: permId } })
    }
  }
  console.log('✅ Rol şablonları oluşturuldu')

  console.log('✅ Seed tamamlandı — sistem boş, içerik yok')
}

main().catch(console.error).finally(() => prisma.$disconnect())
