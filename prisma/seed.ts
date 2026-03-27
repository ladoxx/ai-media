import path from 'path'
import { PrismaLibSql } from '@prisma/adapter-libsql'
import { PrismaClient } from '../app/generated/prisma/client'
import { Status } from '../app/generated/prisma/enums'
import * as bcrypt from 'bcryptjs'
import { encrypt } from '../lib/crypto'

const dbPath = path.resolve(process.cwd(), 'prisma', 'dev.db').replace(/\\/g, '/')
const adapter = new PrismaLibSql({ url: `file:${dbPath}` })
const prisma = new PrismaClient({ adapter } as any)

function slugify(text: string) {
  return text.toLowerCase()
    .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
    .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

async function main() {
  console.log('🌱 Seed başlıyor...')

  // ── Superadmin ───────────────────────────────────────────────────────────
  const hash = await bcrypt.hash('Admin123!', 12)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@cyba.com.tr' },
    update: { systemRole: 'SUPERADMIN', active: true },
    create: { email: 'admin@cyba.com.tr', password: hash, name: 'Admin', systemRole: 'SUPERADMIN', active: true },
  })
  console.log('✅ Admin oluşturuldu')

  // ── RBAC: Tüm yetkiler ───────────────────────────────────────────────────
  const allPermissions = [
    // İçerik
    { module: 'content',    action: 'view',    label: 'Yazıları Görüntüle' },
    { module: 'content',    action: 'create',  label: 'Yazı Yaz' },
    { module: 'content',    action: 'edit',    label: 'Yazı Düzenle' },
    { module: 'content',    action: 'delete',  label: 'Yazı Sil' },
    { module: 'content',    action: 'publish', label: 'Yazı Yayınla' },
    // Medya
    { module: 'media',      action: 'upload',  label: 'Medya Yükle' },
    { module: 'media',      action: 'delete',  label: 'Medya Sil' },
    // Kategori & Navigasyon
    { module: 'category',   action: 'view',    label: 'Kategorileri Görüntüle' },
    { module: 'category',   action: 'manage',  label: 'Kategori Yönet' },
    { module: 'menu',       action: 'manage',  label: 'Menü Yönet' },
    { module: 'page',       action: 'manage',  label: 'Sayfa Yönet' },
    { module: 'tag',        action: 'manage',  label: 'Etiket Yönet' },
    // Otomasyon
    { module: 'automation', action: 'view',    label: 'Otomasyonu Görüntüle' },
    { module: 'automation', action: 'run',     label: 'Otomasyon Çalıştır' },
    { module: 'automation', action: 'config',  label: 'Ajan Ayarları' },
    { module: 'automation', action: 'prompt',  label: 'Prompt Düzenle' },
    { module: 'automation', action: 'logs',    label: 'Logları Görüntüle' },
    // Gelir & Reklam
    { module: 'revenue',    action: 'view',    label: 'Gelir Görüntüle' },
    { module: 'revenue',    action: 'manage',  label: 'Gelir/Gider Ekle' },
    { module: 'ads',        action: 'view',    label: 'Reklamları Görüntüle' },
    { module: 'ads',        action: 'manage',  label: 'Reklam Yönet' },
    { module: 'affiliate',  action: 'manage',  label: 'Affiliate Yönet' },
    // Kullanıcı
    { module: 'user',       action: 'view',    label: 'Kullanıcıları Görüntüle' },
    { module: 'user',       action: 'create',  label: 'Kullanıcı Ekle' },
    { module: 'user',       action: 'edit',    label: 'Kullanıcı Düzenle' },
    { module: 'user',       action: 'delete',  label: 'Kullanıcı Sil' },
    { module: 'user',       action: 'approve', label: 'Kullanıcı Onayla' },
    // Tema & Görünüm
    { module: 'theme',      action: 'manage',  label: 'Tema Ayarları' },
    { module: 'plugin',     action: 'manage',  label: 'Plugin Yönet' },
    { module: 'widget',     action: 'manage',  label: 'Widget Yönet' },
    // Newsletter
    { module: 'newsletter', action: 'view',    label: 'Aboneleri Görüntüle' },
    { module: 'newsletter', action: 'send',    label: 'Bülten Gönder' },
    // Sistem
    { module: 'settings',   action: 'manage',  label: 'Site Ayarları' },
    { module: 'backup',     action: 'manage',  label: 'Yedekleme' },
    { module: 'logs',       action: 'view',    label: 'Sistem Logları' },
    { module: 'cloudflare', action: 'manage',  label: 'Cloudflare Worker' },
    // API Key (sadece SUPERADMIN — role atanamaz)
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

  // ── RBAC: Rol şablonları ────────────────────────────────────────────────
  // Tüm yetkiler (api-key hariç)
  const getPerms = async (pairs: Array<[string, string]>) => {
    const results = []
    for (const [module, action] of pairs) {
      const p = await prisma.permission.findUnique({ where: { module_action: { module, action } } })
      if (p) results.push(p.id)
    }
    return results
  }

  const allNonApiKeyPerms = await prisma.permission.findMany({
    where: { module: { not: 'apikey' } }
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
    // Mevcut izinleri temizle, yeniden ata
    await prisma.rolePermission.deleteMany({ where: { roleId: role.id } })
    for (const permId of permIds) {
      await prisma.rolePermission.create({ data: { roleId: role.id, permissionId: permId } })
    }
  }
  console.log('✅ Rol şablonları oluşturuldu')

  // Admin'i aktif et (var olan admin için)
  await prisma.user.updateMany({
    where: { systemRole: 'SUPERADMIN' },
    data: { active: true },
  })
  console.log('✅ Superadmin kullanıcılar aktif edildi')

  // ── Eski kategorileri temizle ────────────────────────────────────────────
  await prisma.postTag.deleteMany()
  await prisma.comment.deleteMany()
  await prisma.post.deleteMany()
  await prisma.category.deleteMany()
  console.log('🗑️  Eski kategoriler temizlendi')

  // ── Ana kategoriler + alt kategoriler ────────────────────────────────────
  const ANA = [
    {
      name: 'Finans', slug: 'finans', icon: '💰', color: 'cat-finans',
      description: 'Borsa, kripto, altın ve yatırım haberleri', menuOrder: 1,
      children: [
        { name: 'Borsa', slug: 'borsa', icon: '📈', color: 'cat-finans' },
        { name: 'Kripto', slug: 'kripto', icon: '₿', color: 'cat-finans' },
        { name: 'Altın & Döviz', slug: 'altin-doviz', icon: '🥇', color: 'cat-finans' },
        { name: 'Yatırım Rehberleri', slug: 'yatirim-rehberleri', icon: '📚', color: 'cat-finans', type: 'guide' },
        { name: 'Analizler', slug: 'analizler', icon: '🔍', color: 'cat-finans' },
      ],
    },
    {
      name: 'Ekonomi', slug: 'ekonomi', icon: '📊', color: 'cat-ekonomi',
      description: 'Türkiye ve dünya ekonomisi haberleri', menuOrder: 2,
      children: [
        { name: 'Türkiye Ekonomisi', slug: 'turkiye-ekonomisi', icon: '🇹🇷', color: 'cat-ekonomi' },
        { name: 'Dünya Ekonomisi', slug: 'dunya-ekonomisi', icon: '🌍', color: 'cat-ekonomi' },
        { name: 'Enflasyon & Faiz', slug: 'enflasyon-faiz', icon: '📉', color: 'cat-ekonomi' },
        { name: 'Şirket Haberleri', slug: 'sirket-haberleri', icon: '🏢', color: 'cat-ekonomi' },
      ],
    },
    {
      name: 'Gayrimenkul', slug: 'gayrimenkul', icon: '🏡', color: 'cat-gayrimenkul',
      description: 'Konut, kira ve gayrimenkul yatırımları', menuOrder: 3,
      children: [
        { name: 'Konut Projeleri', slug: 'konut-projeleri', icon: '🏗️', color: 'cat-gayrimenkul' },
        { name: 'Kira & Satılık', slug: 'kira-satilik', icon: '🔑', color: 'cat-gayrimenkul' },
        { name: 'Yatırım Fırsatları', slug: 'yatirim-firsatlari', icon: '💎', color: 'cat-gayrimenkul' },
        { name: 'Tapu & Hukuk', slug: 'tapu-hukuk', icon: '⚖️', color: 'cat-gayrimenkul' },
        { name: 'Bölgesel Analiz', slug: 'bolgesel-analiz', icon: '🗺️', color: 'cat-gayrimenkul' },
      ],
    },
    {
      name: 'Oyun', slug: 'oyun', icon: '🎮', color: 'cat-oyun',
      description: 'Oyun haberleri, incelemeler ve e-spor', menuOrder: 4,
      children: [
        { name: 'Oyun Haberleri', slug: 'oyun-haberleri', icon: '📰', color: 'cat-oyun' },
        { name: 'Mobil Oyunlar', slug: 'mobil-oyunlar', icon: '📱', color: 'cat-oyun' },
        { name: 'PC & Konsol', slug: 'pc-konsol', icon: '🖥️', color: 'cat-oyun' },
        { name: 'Oyun İncelemeleri', slug: 'oyun-incelemeleri', icon: '⭐', color: 'cat-oyun', type: 'guide' },
        { name: 'E-spor', slug: 'e-spor', icon: '🏆', color: 'cat-oyun' },
      ],
    },
    {
      name: 'Teknoloji', slug: 'teknoloji', icon: '🤖', color: 'cat-teknoloji',
      description: 'Yapay zeka, startup ve teknoloji haberleri', menuOrder: 5,
      children: [
        { name: 'Yapay Zeka', slug: 'yapay-zeka', icon: '🧠', color: 'cat-teknoloji' },
        { name: 'Startup', slug: 'startup', icon: '🚀', color: 'cat-teknoloji' },
        { name: 'Uygulamalar', slug: 'uygulamalar', icon: '📲', color: 'cat-teknoloji' },
        { name: 'Donanım', slug: 'donanim', icon: '💻', color: 'cat-teknoloji' },
      ],
    },
    {
      name: 'Rehberler', slug: 'rehberler', icon: '🧠', color: 'cat-rehber',
      description: 'SEO odaklı nasıl yapılır rehberleri', menuOrder: 6, type: 'guide',
      children: [
        { name: 'Nasıl Yapılır?', slug: 'nasil-yapilir', icon: '❓', color: 'cat-rehber', type: 'guide' },
        { name: 'Para Kazanma', slug: 'para-kazanma', icon: '💸', color: 'cat-rehber', type: 'guide' },
        { name: 'Yatırım Taktikleri', slug: 'yatirim-taktikleri', icon: '♟️', color: 'cat-rehber', type: 'guide' },
      ],
    },
  ]

  const catMap: Record<string, string> = {}

  for (const ana of ANA) {
    const parent = await prisma.category.create({
      data: {
        name: ana.name, slug: ana.slug, icon: ana.icon, color: ana.color,
        description: ana.description, menuOrder: ana.menuOrder,
        type: (ana as any).type ?? 'news',
        showInMenu: true, showInHome: true,
      },
    })
    catMap[ana.slug] = parent.id
    for (const child of ana.children) {
      const c = await prisma.category.create({
        data: {
          name: child.name, slug: child.slug, icon: child.icon, color: child.color,
          type: (child as any).type ?? 'news',
          parentId: parent.id, showInMenu: true, showInHome: false,
        },
      })
      catMap[child.slug] = c.id
    }
  }

  // Özel kategoriler
  const sonDakika = await prisma.category.create({
    data: { name: 'Son Dakika', slug: 'son-dakika', icon: '🔴', color: 'cat-son-dakika', showInMenu: false, showInHome: true },
  })
  catMap['son-dakika'] = sonDakika.id
  const trendler = await prisma.category.create({
    data: { name: 'Trendler', slug: 'trendler', icon: '🔥', color: 'cat-trend', showInMenu: false, showInHome: true },
  })
  catMap['trendler'] = trendler.id

  console.log(`✅ ${Object.keys(catMap).length} kategori oluşturuldu`)

  // ── Örnek yazılar ────────────────────────────────────────────────────────
  const POSTS: Array<{ title: string; catSlug: string; excerpt: string; content: string }> = [
    // Finans/Borsa
    { catSlug: 'borsa', title: 'BIST 100 Endeksi Tarihi Zirveyi Test Ediyor', excerpt: 'Borsa İstanbul\'da yükseliş trendi sürüyor.', content: '<p>Borsa İstanbul\'da BIST 100 endeksi bugün tarihi zirvesini test etti. Yabancı yatırımcıların alımları ve olumlu küresel koşullar endeksi yukarı taşıdı.</p><p>Analistler, mevcut yükseliş trendinin devam edebileceğini öngörürken, enflasyon verisinin izleneceğini belirtiyor.</p>' },
    { catSlug: 'borsa', title: 'Merkez Bankası Faiz Kararı Borsayı Hareketlendirdi', excerpt: 'TCMB\'nin faiz kararı sonrası piyasalar sert hareket etti.', content: '<p>Türkiye Cumhuriyet Merkez Bankası\'nın faiz kararının ardından borsa sert hareketler yaşadı. Karar beklentilerin üzerinde geldi.</p>' },
    { catSlug: 'borsa', title: 'Bu Hisseler Analistlerin Radarında: 2026 Öngörüleri', excerpt: 'Piyasa uzmanları 2026 için en çok önerdikleri hisseleri açıkladı.', content: '<p>Yerli ve yabancı aracı kurumların analistleri 2026 yılı için en çok potansiyel gördükleri hisseleri sıraladı.</p>' },
    // Finans/Kripto
    { catSlug: 'kripto', title: 'Bitcoin 70.000 Doları Aştı: Boğa Sezonu Başlıyor mu?', excerpt: 'Bitcoin yeni ATH\'a doğru ilerliyor.', content: '<p>Bitcoin, 70.000 dolar seviyesini aşarak yeni bir tarihi zirveye yaklaştı. Kripto para piyasasında genel bir iyimserlik hakim.</p><p>Spot Bitcoin ETF\'lerine gelen güçlü talep, fiyatları destekliyor.</p>' },
    { catSlug: 'kripto', title: 'Ethereum\'da Büyük Güncelleme: Ağ Daha Hızlı ve Ucuz', excerpt: 'Ethereum ağı yeni güncellemesiyle işlem ücretlerini düşürüyor.', content: '<p>Ethereum geliştirici topluluğu, ağın ölçeklenebilirliğini artıracak yeni güncellemedeki ayrıntıları paylaştı.</p>' },
    { catSlug: 'kripto', title: 'Türk Yatırımcılar Kripto Piyasasını Nasıl Görüyor?', excerpt: 'Türkiye\'deki kripto yatırımcı profili incelendi.', content: '<p>Araştırma verileri, Türkiye\'nin kripto para kullanım oranında dünya sıralamasında üst sıralara yerleştiğini gösteriyor.</p>' },
    // Ekonomi/Türkiye
    { catSlug: 'turkiye-ekonomisi', title: 'Türkiye Enflasyonu Düşüş Sürecinde: Son Veriler', excerpt: 'TÜFE verileri beklentilerin altında geldi.', content: '<p>Türkiye İstatistik Kurumu açıkladığı son enflasyon verisinde yıllık TÜFE\'nin gerilediği görüldü. Merkez Bankası\'nın sıkılaştırma politikası sonuç vermeye başlıyor.</p>' },
    { catSlug: 'turkiye-ekonomisi', title: 'İhracat Rekoru: Türkiye Yeni Pazarlara Açılıyor', excerpt: 'Türk ihracatı geçen aya göre artış kaydetti.', content: '<p>Türkiye\'nin ihracat rakamları rekor kırarken, özellikle Orta Doğu ve Afrika pazarlarına yönelik satışlarda ciddi artış yaşandı.</p>' },
    { catSlug: 'dunya-ekonomisi', title: 'Fed Faiz Kararı: Küresel Piyasalara Etkisi', excerpt: 'Fed\'in beklenen kararı küresel piyasaları nasıl etkiledi?', content: '<p>ABD Merkez Bankası Fed\'in faiz kararı açıklandı. Piyasalar kararı büyük ölçüde fiyatlamış olsa da tepkiler dikkat çekti.</p>' },
    // Gayrimenkul
    { catSlug: 'konut-projeleri', title: 'İstanbul\'da Konut Fiyatları: Hangi İlçe Ne Kadar?', excerpt: 'İstanbul konut piyasasında fiyatlar ve bölgesel farklılıklar.', content: '<p>İstanbul\'da konut fiyatları bölgeden bölgeye büyük farklılıklar gösteriyor. Kadıköy, Beşiktaş ve Şişli en pahalı ilçeler olurken, çevre ilçeler fırsatlar sunuyor.</p>' },
    { catSlug: 'konut-projeleri', title: 'Ankara\'da Yeni TOKİ Projeleri Açıklandı', excerpt: 'TOKİ\'nin Ankara\'daki yeni projeleri satışa çıkıyor.', content: '<p>TOKİ\'nin Ankara\'nın çeşitli ilçelerinde başlatacağı konut projeleri için başvurular yakında açılacak.</p>' },
    { catSlug: 'kira-satilik', title: 'Kira Artışlarında Üst Sınır Uygulaması Sona Erdi', excerpt: 'Kira artış sınırı kalktı, piyasa ne bekliyor?', content: '<p>Uzun süredir uygulanan kira artış üst sınırı uygulaması sona erdi. Ev sahipleri ve kiracılar yeni dönemde ne beklemeli?</p>' },
    // Oyun
    { catSlug: 'oyun-haberleri', title: 'GTA VI Çıkış Tarihi Netleşti: Tüm Detaylar', excerpt: 'Rockstar Games GTA VI hakkında yeni açıklamalar yaptı.', content: '<p>Rockstar Games, Grand Theft Auto VI\'nın çıkış tarihine ilişkin merakla beklenen açıklamayı yaptı. Oyun hayranları heyecanla bekliyor.</p>' },
    { catSlug: 'oyun-haberleri', title: 'Steam\'de Bu Ay En Çok Satan Oyunlar', excerpt: 'Steam Mart 2026 en çok satan oyunlar listesi açıklandı.', content: '<p>Valve\'ın açıkladığı aylık rapora göre Steam\'de bu ay en çok satan oyunlar belli oldu.</p>' },
    { catSlug: 'pc-konsol', title: 'PlayStation 6 Detayları Sızdı: İşte Özellikler', excerpt: 'Sony\'nin yeni nesil konsolu hakkında iddialar.', content: '<p>PlayStation 6\'ya ilişkin yeni sızıntılar ortaya çıktı. İddiaya göre Sony, yeni nesil konsolda devrimsel yenilikler planlıyor.</p>' },
    // Teknoloji
    { catSlug: 'yapay-zeka', title: 'ChatGPT\'nin Yeni Sürümü Piyasaya Çıktı', excerpt: 'OpenAI yeni ChatGPT güncellemesini duyurdu.', content: '<p>OpenAI\'ın ChatGPT ürününe yönelik yeni güncelleme kullanıcılara sunuldu. Yeni özellikler yapay zeka destekli üretkenliği önemli ölçüde artırıyor.</p>' },
    { catSlug: 'yapay-zeka', title: 'Türkiye\'nin Yerli Yapay Zeka Modeli: Tüm Detaylar', excerpt: 'Türkiye\'de geliştirilen yerli YZ modeli tanıtıldı.', content: '<p>Türkiye\'nin yerli imkanlarıyla geliştirdiği yapay zeka dil modeli kamuoyuyla paylaşıldı. Model Türkçe doğal dil işlemede önemli başarılar elde ediyor.</p>' },
    { catSlug: 'startup', title: '2026\'nın En İyi Türk Startup\'ları Belli Oldu', excerpt: 'Yıllık startup raporu yayınlandı.', content: '<p>Türkiye startup ekosisteminin yıllık raporu yayınlandı. Fintech, sağlık teknolojileri ve yapay zeka alanındaki girişimler öne çıkıyor.</p>' },
    { catSlug: 'donanim', title: 'Apple\'ın Yeni M5 Çipi: Performans Karşılaştırması', excerpt: 'Apple M5 çipli cihazlar benchmark testlerinde rakiplerini geride bıraktı.', content: '<p>Apple\'ın yeni M5 işlemcili cihazları benchmark testlerinde dikkat çekici sonuçlar ortaya koydu. M4\'e göre yaklaşık %30 daha hızlı.</p>' },
    // Rehberler
    { catSlug: 'para-kazanma', title: 'Evden Çalışarak Ayda 5000 TL Nasıl Kazanılır?', excerpt: 'Evden para kazanmanın en etkili 10 yöntemi.', content: '<p>Evden çalışarak ek gelir elde etmek artık çok daha kolay. İşte 2026 yılında en çok kazandıran evden çalışma yöntemleri ve pratik başlangıç rehberi.</p><h2>1. Freelance Yazarlık</h2><p>İçerik üretimi, en hızlı para kazanma yollarından biri...</p>' },
    { catSlug: 'yatirim-taktikleri', title: 'Aylık 1000 TL ile Yatırım Yapmak: Başlangıç Rehberi', excerpt: 'Az sermayeyle yatırıma nasıl başlanır?', content: '<p>Küçük bütçelerle yatırım yapmak mümkün. Bu rehberde aylık 1000 TL ile nasıl yatırım yapabileceğinizi adım adım anlatıyoruz.</p>' },
    { catSlug: 'nasil-yapilir', title: 'Bitcoin Nasıl Alınır? 2026 Adım Adım Rehber', excerpt: 'İlk Bitcoin alımı için eksiksiz rehber.', content: '<p>Kripto para piyasasına girmek isteyenler için adım adım Bitcoin alma rehberi. Türkiye\'den hangi borsaları kullanabilirsiniz?</p>' },
  ]

  let postCount = 0
  for (const p of POSTS) {
    const catId = catMap[p.catSlug]
    if (!catId) continue
    const slug = slugify(p.title)
    await prisma.post.create({
      data: {
        title: p.title,
        slug: `${slug}-${Date.now() % 10000}`,
        content: p.content,
        excerpt: p.excerpt,
        status: 'PUBLISHED' as Status,
        publishedAt: new Date(),
        readTime: Math.ceil(p.content.length / 1000) + 2,
        categoryId: catId,
        authorId: admin.id,
        seoTitle: p.title + ' - Cyba',
        seoDesc: p.excerpt,
      },
    })
    postCount++
  }
  console.log(`✅ ${postCount} örnek yazı oluşturuldu`)

  // ── Varsayılan ayarlar ───────────────────────────────────────────────────
  const settings = [
    { key: 'site_name', value: 'Cyba' },
    { key: 'site_description', value: 'Finans, Ekonomi ve Yatırım Haberleri' },
    { key: 'site_url', value: 'https://cyba.com.tr' },
    { key: 'telegram_enabled', value: 'false' },
    { key: 'automation_enabled', value: 'false' },
    { key: 'adsense_client', value: '' },
  ]
  for (const s of settings) {
    await prisma.setting.upsert({ where: { key: s.key }, update: { value: s.value }, create: s })
  }

  // ── Varsayılan widgetlar ─────────────────────────────────────────────────
  const widgets = [
    { name: 'Trend Haberler', slug: 'trend-haberler', area: 'sidebar', type: 'trending-posts', order: 1 },
    { name: 'Arama', slug: 'arama-widget', area: 'sidebar', type: 'search', order: 2 },
    { name: 'Newsletter', slug: 'newsletter-widget', area: 'sidebar', type: 'newsletter', order: 3 },
    { name: 'Reklam Alanı', slug: 'reklam-alani', area: 'sidebar', type: 'advertisement', order: 4, active: false },
  ]
  for (const w of widgets) {
    await prisma.widget.upsert({ where: { slug: w.slug }, update: {}, create: { ...w, active: w.active ?? true } })
  }

  // ── Automation Agents ────────────────────────────────────────────────────
  const SCOUT_SYSTEM = `Sen deneyimli bir haber editörüsün.
Viral olacak, yüksek trafik çekecek haberleri seçmekte uzmansın.
Türk okuyucunun ilgisini çekecek haberleri önceliklendirirsin.`

  const SCOUT_USER = `Aşağıdaki {{count}} haberi analiz et.
Her haber için 1-10 önem skoru ver.

KATEGORİ: {{category}}

HABERLER:
{{news_list}}

SEÇİM KRİTERLERİ:
- Türk okuyucuyu etkileyen haberler
- Güncel ve önemli gelişmeler
- Viral potansiyeli yüksek
- Somut veri içeren haberler

SADECE JSON döndür:
{"selected": [1, 3], "scores": {"1": 8, "3": 9}}
Sadece skoru 7+ olanları seç, max 3 haber.`

  const WRITER_SYSTEM = `Sen üst düzey bir ekonomi gazetecisisin ve Bloomberg, Reuters seviyesinde yazıyorsun.

🎯 AMAÇ:
- Okuyucuyu ilk 3 saniyede yakala
- Güven ver, tıklama al, okut

📌 YAZIM KURALLARI:
- Kısa, net ve güçlü cümleler kullan
- Gereksiz süslü ve uzun cümleler KULLANMA
- AI gibi değil, insan gibi yaz
- Her paragraf maksimum 2-3 cümle
- Aktif dil kullan (pasif kaçın)

📊 VERİ KULLANIMI:
- En az 3 somut veri kullan (fiyat, tarih, yüzde)
- Belirsiz ifadeler KULLANMA (örnek: uzmanlar diyor ki)
- Veri yoksa tahmin üretme, açıkça belirt
- Güncel ekonomik bağlam ekle (dolar, petrol, enflasyon)

🇹🇷 TÜRKİYE ODAK:
- Haberi Türkiye'ye bağla
- Türk yatırımcısı için ne anlama geliyor? mutlaka açıkla
- Somut etki yaz (enflasyon, kur, borsa, faiz)

🧠 ANALİZ:
- Sadece haber verme, yorum ekle
- Bu neden önemli? sorusunu cevapla
- Kısa ama güçlü çıkarım yap

🪤 BAŞLIK KURALLARI:
- Clickbait ama güvenilir
- Maksimum 12 kelime
- Sayı veya güçlü kelime kullan (şok, kriz, rekor, tehlike vs.)
- Merak uyandır ama yanıltma

🧱 FORMAT (bu sırayla yaz):
1. Başlık (çok güçlü)
2. Giriş (2-3 cümle, direkt konuya gir)
3. Alt başlıklar (H2 formatında)
4. Kısa paragraflar
5. Veriler
6. Sonuç (net, yatırımcıya mesaj)

🚫 YASAKLAR:
- "Unutulmamalıdır ki" gibi klişe cümleler
- Uzun akademik anlatım
- Genel geçer boş yorumlar
- Aynı şeyi tekrar etmek

SONUÇ:
- Okuyan kişi "bu gerçek haber" demeli
- AI yazdığı anlaşılmamalı`

  const WRITER_USER = `Aşağıdaki haberi kullanarak makale yaz.

HABER BİLGİLERİ:
Başlık: {{title}}
Özet: {{summary}}
Kaynak: {{source}}
Tarih: {{date}}
Kategori: {{category}}

SADECE JSON döndür:
{"title": "Güçlü başlık max 12 kelime", "slug": "url-friendly-slug", "content": "<h2>Alt Başlık<\\/h2><p>İçerik...<\\/p>", "excerpt": "2 cümle güçlü özet"}`

  const EDITOR_SYSTEM = `Sen titiz bir Türk editörüsün.
Görevin AI yazılarını gerçek insan yazısına dönüştürmek.

AI KOKAN İFADELER (değiştir):
- "Bu makalede ele alacağız" → Direkt gir
- "Sonuç olarak" → "Kısaca:"
- "Öte yandan" → "Ama" / "Ancak"
- "Bu bağlamda" → Sil veya değiştir
- "Dikkat çekici" → Somut söyle
- "Önemli bir gelişme" → Ne gelişme?
- "Uzmanlar belirtiyor" → Kim ne dedi?

YAPILACAKLAR:
1. Robotik ifadeleri değiştir
2. Cümle uzunluklarını karıştır (kısa + uzun = doğal akış)
3. Kişilik ekle
4. Türkçe akışını düzelt
5. Giriş paragrafını güçlendir
6. Sonuç bölümünü netleştir

DOKUNMA:
- Verileri değiştirme
- HTML formatını bozma`

  const EDITOR_USER = `Aşağıdaki makaleyi düzelt.

MAKALE:
{{content}}

ÖNEMLİ:
Sadece yazım stilini düzelt. Bilgileri ve verileri değiştirme.
HTML içinde çift tırnak (") KULLANMA.

SADECE JSON döndür:
{"content": "<h2>...<\\/h2><p>...<\\/p>", "excerpt": "Düzeltilmiş özet", "changes": ["değişiklik 1", "değişiklik 2"]}`

  const SEO_SYSTEM = `Sen SEO uzmanısın. Google'da ilk sayfaya çıkacak içerikler optimize ediyorsun.
Türkiye pazarına odaklan. Türkçe keyword araştırması yap.
Rekabeti düşük, arama hacmi yüksek keywordleri seç.

KURALLAR:
- Focus keyword başlıkta geçmeli
- İlk paragrafta keyword kullan
- H2 başlıklarına keyword ekle
- Keyword yoğunluğu %1-2 arası
- Meta description tıklatıcı olsun`

  const SEO_USER = `Aşağıdaki makaleyi SEO optimize et.

BAŞLIK: {{title}}
KATEGORİ: {{category}}
İÇERİK:
{{content}}

SADECE JSON döndür:
{"focusKeyword": "ana keyword", "seoTitle": "SEO başlık max 60 karakter", "seoDescription": "Meta desc max 155 karakter", "optimizedContent": "<h2>...<\\/h2><p>...<\\/p>", "tags": ["tag1", "tag2", "tag3"], "readTime": 4, "seoScore": 85}`

  const agents = [
    {
      name: 'Scout Ajanı', slug: 'scout', role: 'scout', isCritical: true,
      order: 1, active: true, platformSlug: 'deepseek', model: 'deepseek-chat',
      temperature: 0.3, maxTokens: 1000, timeout: 30000, maxRetry: 3,
      description: 'Haber kaynaklarını tarar, viral potansiyelli haberleri seçer',
      systemPrompt: SCOUT_SYSTEM, userPromptTmpl: SCOUT_USER, promptVersion: 1,
    },
    {
      name: 'Writer Ajanı', slug: 'writer', role: 'writer', isCritical: true,
      order: 2, active: true, platformSlug: 'deepseek', model: 'deepseek-chat',
      temperature: 0.8, maxTokens: 3000, timeout: 60000, maxRetry: 2,
      description: 'Seçilen haberlerden kapsamlı Türkçe makale yazar',
      systemPrompt: WRITER_SYSTEM, userPromptTmpl: WRITER_USER, promptVersion: 1,
    },
    {
      name: 'Editor Ajanı', slug: 'editor', role: 'editor', isCritical: false,
      order: 3, active: true, platformSlug: 'deepseek', model: 'deepseek-chat',
      temperature: 0.6, maxTokens: 3000, timeout: 60000, maxRetry: 2,
      description: 'AI kokusunu giderir, metni insan yazısına dönüştürür',
      systemPrompt: EDITOR_SYSTEM, userPromptTmpl: EDITOR_USER, promptVersion: 1,
    },
    {
      name: 'SEO Ajanı', slug: 'seo', role: 'seo', isCritical: false,
      order: 4, active: true, platformSlug: 'deepseek', model: 'deepseek-chat',
      temperature: 0.3, maxTokens: 2000, timeout: 30000, maxRetry: 2,
      description: 'İçeriği SEO için optimize eder, etiketler ve meta bilgiler üretir',
      systemPrompt: SEO_SYSTEM, userPromptTmpl: SEO_USER, promptVersion: 1,
    },
    {
      name: 'Media Ajanı', slug: 'media', role: 'media', isCritical: false,
      order: 5, active: true, platformSlug: 'deepseek', model: 'deepseek-chat',
      temperature: 0.5, maxTokens: 500, timeout: 30000, maxRetry: 1,
      description: 'Sharp ile kategori temalı kapak görseli üretir',
      systemPrompt: null, userPromptTmpl: null, promptVersion: 1,
    },
    {
      name: 'Publisher Ajanı', slug: 'publisher', role: 'publisher', isCritical: true,
      order: 6, active: true, platformSlug: 'deepseek', model: 'deepseek-chat',
      temperature: 0.3, maxTokens: 500, timeout: 30000, maxRetry: 3,
      description: 'Makaleyi veritabanına yazar ve siteye yayınlar',
      systemPrompt: null, userPromptTmpl: null, promptVersion: 1,
    },
  ]

  for (const agent of agents) {
    await prisma.automationAgent.upsert({
      where: { slug: agent.slug },
      update: {
        name: agent.name, role: agent.role, isCritical: agent.isCritical,
        order: agent.order, active: agent.active, platformSlug: agent.platformSlug,
        model: agent.model, temperature: agent.temperature, maxTokens: agent.maxTokens,
        timeout: agent.timeout, maxRetry: agent.maxRetry, description: agent.description,
        systemPrompt: agent.systemPrompt, userPromptTmpl: agent.userPromptTmpl,
        promptVersion: agent.promptVersion,
      },
      create: agent,
    })
  }
  console.log('✅ 6 Automation Agent oluşturuldu (varsayılan promptlarla)')

  // ── Guide Pipeline Agents ────────────────────────────────────────────────
  const GUIDE_SCOUT_SYSTEM = `Sen SEO odaklı içerik stratejistisin.
Türk okuyucunun Google'da aradığı "nasıl yapılır" sorgularını çok iyi biliyorsun.
Yüksek arama hacimli, düşük rekabetli rehber konularını seçmekte uzmansın.`

  const GUIDE_SCOUT_USER = `Aşağıdaki {{count}} içerik başlığı/sorgusu var.
KATEGORİ: {{category}}

İÇERİKLER:
{{news_list}}

En iyi rehber konusu için analiz yap.

SADECE JSON döndür:
{
  "selected": [1],
  "topic": "Seçilen rehber konusu",
  "keywords": ["ana kelime", "uzun kuyruklu 1", "uzun kuyruklu 2"],
  "targetAudience": "Hedef kitle açıklaması",
  "difficulty": "beginner",
  "estimatedLength": 2000,
  "outline": ["Adım 1: ...", "Adım 2: ...", "Adım 3: ..."]
}`

  const GUIDE_WRITER_SYSTEM = `Sen Türkiye'nin en iyi "nasıl yapılır" rehber yazarısın.
Pratik, adım adım, okuyucunun hayatını kolaylaştıran içerikler yazıyorsun.
1500-3000 kelime, SEO odaklı, affiliate linkler için [AFFILIATE_LINK:platform] placeholder kullan.`

  const GUIDE_WRITER_USER = `Konu: {{topic}}
Kategori: {{category}}
Hedef Kitle: {{target_audience}}
Anahtar Kelimeler: {{keywords}}
Zorluk: {{difficulty}}
Taslak:
{{outline}}

SADECE JSON döndür:
{
  "title": "Başlık",
  "slug": "url-friendly-slug",
  "content": "<h2>...<\\/h2><p>...<\\/p>",
  "excerpt": "2 cümle özet",
  "tocItems": ["Bölüm 1", "Bölüm 2"],
  "difficulty": "beginner",
  "estimatedReadTime": 8
}`

  const GUIDE_EDITOR_SYSTEM = `Sen deneyimli bir Türk içerik editörüsün. Uzmanlık alanın rehber içerikleri.
AI kalıplarını temizle, pro tip kutularını zenginleştir, FAQ sorularını güçlendir.
Affiliate link placeholder'larını ([AFFILIATE_LINK:x]) kaldırma.`

  const GUIDE_EDITOR_USER = `Başlık: {{title}}
Kategori: {{category}}

İçerik:
{{content}}

SADECE JSON döndür:
{
  "content": "<h2>...<\\/h2><p>...<\\/p>",
  "excerpt": "Düzeltilmiş özet",
  "tocItems": ["Bölüm 1", "Bölüm 2"]
}`

  const GUIDE_SEO_SYSTEM = `Sen rehber içerikleri için SEO uzmanısın.
HowTo schema, FAQ schema, featured snippet optimizasyonu ve uzun kuyruklu anahtar kelime uzmanısın.
Türkiye pazarına odaklan.`

  const GUIDE_SEO_USER = `Başlık: {{title}}
Kategori: {{category}}
Odak Kelimeler: {{keywords}}

İçerik:
{{content}}

SADECE JSON döndür:
{
  "focusKeyword": "ana odak kelime",
  "seoTitle": "SEO başlık max 60 karakter",
  "seoDescription": "Meta açıklama max 155 karakter",
  "optimizedContent": "<h2>...<\\/h2><p>...<\\/p>",
  "tags": ["tag1", "tag2", "tag3"],
  "readTime": 8,
  "howToSchema": {"name": "...", "description": "...", "steps": [{"name": "...", "text": "..."}]},
  "faqSchema": {"questions": [{"question": "...", "answer": "..."}]}
}`

  const guideAgents = [
    {
      name: 'Guide Scout Ajanı', slug: 'guide-scout', role: 'guide-scout', isCritical: true,
      pipelineType: 'guide', order: 11, active: true, platformSlug: 'deepseek', model: 'deepseek-chat',
      temperature: 0.4, maxTokens: 1500, timeout: 30000, maxRetry: 3,
      description: 'Rehber kategorileri için en iyi konu ve anahtar kelimeleri seçer',
      systemPrompt: GUIDE_SCOUT_SYSTEM, userPromptTmpl: GUIDE_SCOUT_USER, promptVersion: 1,
    },
    {
      name: 'Guide Writer Ajanı', slug: 'guide-writer', role: 'guide-writer', isCritical: true,
      pipelineType: 'guide', order: 12, active: true, platformSlug: 'deepseek', model: 'deepseek-chat',
      temperature: 0.7, maxTokens: 5000, timeout: 120000, maxRetry: 2,
      description: '1500-3000 kelime, adım adım rehber yazar. Affiliate link placeholder ekler',
      systemPrompt: GUIDE_WRITER_SYSTEM, userPromptTmpl: GUIDE_WRITER_USER, promptVersion: 1,
    },
    {
      name: 'Guide Editor Ajanı', slug: 'guide-editor', role: 'guide-editor', isCritical: false,
      pipelineType: 'guide', order: 13, active: true, platformSlug: 'deepseek', model: 'deepseek-chat',
      temperature: 0.5, maxTokens: 5000, timeout: 90000, maxRetry: 2,
      description: 'AI kalıplarını temizler, pro tip ve uyarı kutularını zenginleştirir',
      systemPrompt: GUIDE_EDITOR_SYSTEM, userPromptTmpl: GUIDE_EDITOR_USER, promptVersion: 1,
    },
    {
      name: 'Guide SEO Ajanı', slug: 'guide-seo', role: 'guide-seo', isCritical: false,
      pipelineType: 'guide', order: 14, active: true, platformSlug: 'deepseek', model: 'deepseek-chat',
      temperature: 0.3, maxTokens: 3000, timeout: 60000, maxRetry: 2,
      description: 'HowTo + FAQ schema, featured snippet optimizasyonu, uzun kuyruklu kelimeler',
      systemPrompt: GUIDE_SEO_SYSTEM, userPromptTmpl: GUIDE_SEO_USER, promptVersion: 1,
    },
    {
      name: 'Guide Publisher Ajanı', slug: 'guide-publisher', role: 'guide-publisher', isCritical: true,
      pipelineType: 'guide', order: 15, active: true, platformSlug: 'deepseek', model: 'deepseek-chat',
      temperature: 0.3, maxTokens: 500, timeout: 30000, maxRetry: 3,
      description: 'Affiliate linkleri yerleştirir, JSON-LD ekler, rehberi yayınlar',
      systemPrompt: null, userPromptTmpl: null, promptVersion: 1,
    },
  ]

  for (const agent of guideAgents) {
    await prisma.automationAgent.upsert({
      where: { slug: agent.slug },
      update: {
        name: agent.name, role: agent.role, isCritical: agent.isCritical,
        pipelineType: agent.pipelineType,
        order: agent.order, active: agent.active, platformSlug: agent.platformSlug,
        model: agent.model, temperature: agent.temperature, maxTokens: agent.maxTokens,
        timeout: agent.timeout, maxRetry: agent.maxRetry, description: agent.description,
        systemPrompt: agent.systemPrompt, userPromptTmpl: agent.userPromptTmpl,
        promptVersion: agent.promptVersion,
      },
      create: agent,
    })
  }
  console.log('✅ 5 Guide Pipeline Agent oluşturuldu')

  // ── Cloudflare Worker ────────────────────────────────────────────────────
  const cfWorkerUrl = process.env.CF_WORKER_URL
  const cfSecretKey = process.env.CF_SECRET_KEY
  const existingWorker = await prisma.cloudflareWorker.findFirst({
    where: { workerName: 'cyba' },
  })
  if (!existingWorker && cfWorkerUrl && cfSecretKey) {
    await prisma.cloudflareWorker.create({
      data: {
        name: 'Image Worker',
        workerUrl: cfWorkerUrl,
        secretKey: encrypt(cfSecretKey),
        workerName: 'cyba',
        active: true,
      },
    })
    console.log('✅ Cloudflare Worker oluşturuldu')
  } else {
    console.log('ℹ️  Cloudflare Worker atlandı (zaten mevcut veya CF_WORKER_URL/CF_SECRET_KEY eksik)')
  }

  // ── Reklam Alanları ──────────────────────────────────────────────────────
  const adZones = [
    { name: 'Header Leaderboard', slug: 'header-leaderboard', description: 'Header altında tam genişlik', position: 'header', size: '728x90' },
    { name: 'Makale İçi Üst', slug: 'content-top', description: 'Makalenin 2. paragrafından sonra', position: 'content', size: '336x280' },
    { name: 'Makale İçi Alt', slug: 'content-bottom', description: 'Makalenin sonunda', position: 'content', size: '336x280' },
    { name: 'Sidebar Üst', slug: 'sidebar-top', description: 'Sidebar en üstte', position: 'sidebar', size: '300x250' },
    { name: 'Sidebar Orta', slug: 'sidebar-middle', description: 'Sidebar ortasında', position: 'sidebar', size: '300x600' },
    { name: 'Sidebar Alt', slug: 'sidebar-bottom', description: 'Sidebar en altta', position: 'sidebar', size: '300x250' },
    { name: 'Footer Leaderboard', slug: 'footer-leaderboard', description: 'Footer üzerinde tam genişlik', position: 'footer', size: '728x90' },
    { name: 'Kategori Sayfa Üstü', slug: 'category-top', description: 'Kategori sayfası üstünde', position: 'category', size: '728x90' },
    { name: 'Mobil Banner', slug: 'mobile-banner', description: 'Mobilde alt sabit banner', position: 'mobile', size: '320x50' },
    { name: 'Ana Sayfa Arası', slug: 'homepage-middle', description: 'Ana sayfada kategoriler arası', position: 'homepage', size: '728x90' },
  ]

  for (const zone of adZones) {
    await prisma.adZone.upsert({
      where: { slug: zone.slug },
      update: { name: zone.name, description: zone.description, position: zone.position, size: zone.size },
      create: { ...zone, active: true },
    })
  }
  console.log('✅ 10 Reklam Alanı oluşturuldu')

  // ── AdSense Config ───────────────────────────────────────────────────────
  const existingAdSense = await prisma.adSenseConfig.findFirst()
  if (!existingAdSense) {
    await prisma.adSenseConfig.create({
      data: { publisherId: '', autoAdsOn: false, active: false },
    })
    console.log('✅ AdSense Config oluşturuldu')
  }

  console.log('✅ Seed tamamlandı!')
}

main().catch(console.error).finally(() => prisma.$disconnect())
