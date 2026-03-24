import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

async function isSuperAdmin() {
  const session = await getServerSession(authOptions)
  return (session?.user as { role?: string })?.role === 'SUPERADMIN'
}

// Default prompts indexed by agent slug
const DEFAULT_PROMPTS: Record<string, { systemPrompt: string; userPromptTmpl: string }> = {
  scout: {
    systemPrompt: `Sen deneyimli bir haber editörüsün.
Viral olacak, yüksek trafik çekecek haberleri seçmekte uzmansın.
Türk okuyucunun ilgisini çekecek haberleri önceliklendirirsin.`,
    userPromptTmpl: `Aşağıdaki {{count}} haberi analiz et.
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
Sadece skoru 7+ olanları seç, max 3 haber.`,
  },
  writer: {
    systemPrompt: `Sen üst düzey bir ekonomi gazetecisisin ve Bloomberg, Reuters seviyesinde yazıyorsun.

🎯 AMAÇ:
- Okuyucuyu ilk 3 saniyede yakala
- Güven ver, tıklama al, okut

📌 YAZIM KURALLARI:
- Kısa, net ve güçlü cümleler kullan
- AI gibi değil, insan gibi yaz
- Her paragraf maksimum 2-3 cümle

🇹🇷 TÜRKİYE ODAK:
- Haberi Türkiye'ye bağla
- Türk yatırımcısı için ne anlama geliyor? mutlaka açıkla

SONUÇ:
- Okuyan kişi "bu gerçek haber" demeli
- AI yazdığı anlaşılmamalı`,
    userPromptTmpl: `Aşağıdaki haberi kullanarak makale yaz.

HABER BİLGİLERİ:
Başlık: {{title}}
Özet: {{summary}}
Kaynak: {{source}}
Tarih: {{date}}
Kategori: {{category}}

SADECE JSON döndür:
{"title": "Güçlü başlık max 12 kelime", "slug": "url-friendly-slug", "content": "<h2>Alt Başlık<\\/h2><p>İçerik...<\\/p>", "excerpt": "2 cümle güçlü özet"}`,
  },
  editor: {
    systemPrompt: `Sen titiz bir Türk editörüsün.
Görevin AI yazılarını gerçek insan yazısına dönüştürmek.

AI KOKAN İFADELER (değiştir):
- "Bu makalede ele alacağız" → Direkt gir
- "Sonuç olarak" → "Kısaca:"
- "Öte yandan" → "Ama" / "Ancak"

DOKUNMA:
- Verileri değiştirme
- HTML formatını bozma`,
    userPromptTmpl: `Aşağıdaki makaleyi düzelt.

MAKALE:
{{content}}

ÖNEMLİ:
Sadece yazım stilini düzelt. Bilgileri ve verileri değiştirme.
HTML içinde çift tırnak (") KULLANMA.

SADECE JSON döndür:
{"content": "<h2>...<\\/h2><p>...<\\/p>", "excerpt": "Düzeltilmiş özet", "changes": ["değişiklik 1", "değişiklik 2"]}`,
  },
  seo: {
    systemPrompt: `Sen SEO uzmanısın. Google'da ilk sayfaya çıkacak içerikler optimize ediyorsun.
Türkiye pazarına odaklan. Türkçe keyword araştırması yap.
Rekabeti düşük, arama hacmi yüksek keywordleri seç.

KURALLAR:
- Focus keyword başlıkta geçmeli
- İlk paragrafta keyword kullan
- Meta description tıklatıcı olsun`,
    userPromptTmpl: `Aşağıdaki makaleyi SEO optimize et.

BAŞLIK: {{title}}
KATEGORİ: {{category}}
İÇERİK:
{{content}}

SADECE JSON döndür:
{"focusKeyword": "ana keyword", "seoTitle": "SEO başlık max 60 karakter", "seoDescription": "Meta desc max 155 karakter", "optimizedContent": "<h2>...<\\/h2><p>...<\\/p>", "tags": ["tag1", "tag2", "tag3"], "readTime": 4, "seoScore": 85}`,
  },
}

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  if (!await isSuperAdmin()) return NextResponse.json({ error: 'Yetkisiz' }, { status: 403 })

  const { slug } = await params
  const defaults = DEFAULT_PROMPTS[slug]

  if (!defaults) {
    return NextResponse.json({ error: 'Bu ajan için varsayılan prompt yok' }, { status: 400 })
  }

  const agent = await prisma.automationAgent.findUnique({ where: { slug } })
  if (!agent) return NextResponse.json({ error: 'Ajan bulunamadı' }, { status: 404 })

  // Backup current
  if (agent.systemPrompt || agent.userPromptTmpl) {
    await prisma.agentPromptHistory.create({
      data: {
        agentId: agent.id,
        systemPrompt: agent.systemPrompt || '',
        userPromptTmpl: agent.userPromptTmpl || '',
        version: agent.promptVersion || 1,
        note: 'Sıfırlama öncesi otomatik yedek',
      },
    })
  }

  const newVersion = (agent.promptVersion || 1) + 1
  await prisma.automationAgent.update({
    where: { slug },
    data: {
      systemPrompt: defaults.systemPrompt,
      userPromptTmpl: defaults.userPromptTmpl,
      promptVersion: newVersion,
    },
  })

  return NextResponse.json({ success: true, promptVersion: newVersion })
}
