import { generateContent } from '@/lib/ai-router'
import type { NewsItem, GeneratedArticle, LogFn } from '../types'

function buildPrompt(news: NewsItem[], category: string): string {
  const categoryLabels: Record<string, string> = {
    teknoloji: 'teknoloji',
    kripto: 'kripto para ve blockchain',
    gayrimenkul: 'gayrimenkul ve konut piyasası',
    oyun: 'oyun ve e-spor',
    'para-kazan': 'pasif gelir ve online para kazanma',
  }

  const categoryLabel = categoryLabels[category] || category

  const haberListesi = news
    .slice(0, 5)
    .map((n, i) => `${i + 1}. Başlık: "${n.title}"\n   Özet: ${n.summary || 'Detay yok'}\n   Kaynak: ${n.source}`)
    .join('\n\n')

  return `Sen Cyba haber sitesi için ${categoryLabel} alanında uzman Türk bir gazeteci/editörüsün.
Aşağıdaki ${news.slice(0, 5).length} haberi analiz ederek tek bir kapsamlı makale yaz.

HABERLER:
${haberListesi}

MAKALE KURALLARI:
- Dil: Türkçe (akıcı, doğal Türkçe)
- Uzunluk: 500-700 kelime
- Ton: Samimi ama profesyonel
- Okuyucu: Türk internet kullanıcıları
- İçeriği sentezle, sadece çevirme
- Türkiye perspektifinden değerlendir
- Somut veriler ve örnekler kullan

ÇIKTI FORMAT (sadece geçerli JSON döndür, başka hiçbir şey ekleme):
{
  "title": "SEO optimize, dikkat çekici Türkçe başlık (max 80 karakter)",
  "slug": "url-friendly-turkce-slug-tireyle-ayrilmis",
  "excerpt": "2 cümle özet (max 160 karakter)",
  "content": "<h2>Alt Başlık<\/h2><p>Paragraf içeriği...<\/p><h2>Başka Alt Başlık<\/h2><p>Devam...<\/p>",
  "tags": ["etiket1", "etiket2", "etiket3", "etiket4", "etiket5"],
  "seoTitle": "SEO başlığı (max 60 karakter)",
  "seoDesc": "Meta description (max 155 karakter)",
  "readTime": 4
}

ÖNEMLİ:
- SADECE ham JSON döndür. \`\`\`json bloğu, açıklama, "İşte JSON:" gibi şeyler YASAK
- HTML içerikte h2, h3, p, ul, li, blockquote kullan (attribute kullanma, class/id ekleme)
- HTML içinde çift tırnak (") KULLANMA, yoksa JSON bozulur
- Türkçe karakterler doğru olsun (ğ, ü, ş, ı, ö, ç)
- slug sadece küçük harf, tire ve İngilizce karakterler
- tags listesinde 3-6 etiket olsun`
}

function extractJson(raw: string): string | null {
  let s = raw.trim()

  // Strip markdown code fences (```json ... ``` or ``` ... ```)
  s = s.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '')

  // Find outermost { ... }
  const start = s.indexOf('{')
  const end = s.lastIndexOf('}')
  if (start === -1 || end === -1 || end <= start) return null

  return s.slice(start, end + 1)
}

function repairJson(jsonStr: string): string {
  // Remove trailing commas before } or ]
  return jsonStr.replace(/,(\s*[}\]])/g, '$1')
}

function parseArticleJson(raw: string): GeneratedArticle | null {
  const jsonStr = extractJson(raw)
  if (!jsonStr) return null

  // Try 1: direct parse
  // Try 2: after basic repair
  // Try 3: field-by-field extraction as last resort
  let parsed: Record<string, unknown> | null = null

  try {
    parsed = JSON.parse(jsonStr)
  } catch {
    try {
      parsed = JSON.parse(repairJson(jsonStr))
    } catch {
      // Last resort: regex-extract individual fields
      const title = raw.match(/"title"\s*:\s*"([^"]+)"/)?.[1]
      const slug = raw.match(/"slug"\s*:\s*"([^"]+)"/)?.[1]
      const excerpt = raw.match(/"excerpt"\s*:\s*"([^"]+)"/)?.[1]
      const seoTitle = raw.match(/"seoTitle"\s*:\s*"([^"]+)"/)?.[1]
      const seoDesc = raw.match(/"seoDesc"\s*:\s*"([^"]+)"/)?.[1]
      // content: grab everything between "content": " and the next unescaped "
      const contentMatch = raw.match(/"content"\s*:\s*"([\s\S]*?)",\s*"(?:tags|seoTitle|seoDesc|readTime)"/)
      const content = contentMatch?.[1]?.replace(/\\n/g, '\n').replace(/\\"/g, '"')
      const tagsMatch = raw.match(/"tags"\s*:\s*\[([^\]]*)\]/)
      const tags = tagsMatch ? tagsMatch[1].match(/"([^"]+)"/g)?.map((t) => t.replace(/"/g, '')) ?? [] : []
      if (title && content && slug) {
        parsed = { title, slug, excerpt: excerpt ?? '', content, tags, seoTitle: seoTitle ?? title, seoDesc: seoDesc ?? excerpt ?? '', readTime: 4 }
      }
    }
  }

  if (!parsed) return null
  if (!parsed.title || !parsed.content || !parsed.slug) return null

  return {
    title: String(parsed.title).trim(),
    slug: String(parsed.slug)
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 100),
    excerpt: String(parsed.excerpt || '').trim().slice(0, 200),
    content: String(parsed.content || ''),
    tags: Array.isArray(parsed.tags)
      ? parsed.tags.map(String).slice(0, 6)
      : [],
    seoTitle: String(parsed.seoTitle || parsed.title).trim().slice(0, 70),
    seoDesc: String(parsed.seoDesc || parsed.excerpt || '').trim().slice(0, 165),
    readTime: Math.max(1, Math.min(20, parseInt(String(parsed.readTime || '4'), 10) || 4)),
  }
}

export async function generateArticle(
  news: NewsItem[],
  category: string,
  log: LogFn = console.log,
): Promise<GeneratedArticle | null> {
  if (news.length === 0) {
    await log('⚠️ Yazı üretimi için haber bulunamadı')
    return null
  }

  const prompt = buildPrompt(news, category)
  await log(`🤖 AI yazı üretiyor: ${news.length} haber → 1 makale...`)

  try {
    const result = await generateContent(prompt)
    await log(`✓ AI yanıtı alındı (${result.tokens} token, ${result.platformName})`)

    const article = parseArticleJson(result.content)
    if (!article) {
      await log(`⚠️ AI yanıtı ayrıştırılamadı, yeniden deneniyor... (ilk ${result.content.slice(0, 80).replace(/\n/g, ' ')}...)`)
      // Retry with a simpler, stricter prompt
      const retryPrompt = `Aşağıdaki JSON şablonunu Türkçe makale bilgileriyle doldur. SADECE JSON döndür, başka hiçbir şey yazma.

{"title":"buraya başlık","slug":"url-slug-tireli","excerpt":"kısa özet","content":"<p>HTML içerik</p>","tags":["etiket1","etiket2"],"seoTitle":"SEO başlık","seoDesc":"meta açıklama","readTime":4}

Konu: ${result.content.slice(0, 200)}`
      const retry = await generateContent(retryPrompt)
      const retryArticle = parseArticleJson(retry.content)
      if (!retryArticle) {
        await log('❌ İkinci denemede de ayrıştırma başarısız, atlanıyor')
        return null
      }
      return retryArticle
    }

    return article
  } catch (err) {
    await log(`❌ AI yazı üretim hatası: ${err instanceof Error ? err.message : String(err)}`)
    return null
  }
}
