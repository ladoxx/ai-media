import { prisma } from '@/lib/db'
import { getAdapter } from '@/lib/ai-adapters'
import { decrypt } from '@/lib/crypto'

const CATEGORY_STYLES: Record<string, string> = {
  'finans':                   'financial charts, golden coins, stock market, professional studio lighting, dark background, 4K',
  'borsa':                    'stock market charts, trading screen, bull market, BIST, professional photography',
  'kripto':                   'bitcoin gold coin, cryptocurrency, blockchain visualization, dark moody atmosphere',
  'altin-doviz':              'gold bars, currency exchange, financial district, luxury setting',
  'ekonomi':                  'world economy, global business, corporate office, statistical charts, professional',
  'turkiye-ekonomisi':        'Istanbul skyline, Turkish economy, Bosphorus bridge, modern city',
  'dunya-ekonomisi':          'world globe, international finance, global markets, skyscrapers',
  'enflasyon-faiz':           'inflation concept, rising prices, bank building, financial stress',
  'sirket-haberleri':         'corporate boardroom, business meeting, company headquarters',
  'gayrimenkul':              'modern architecture, luxury apartment, real estate, city skyline at dusk',
  'konut-projeleri':          'construction site, modern housing project, urban development',
  'kira-satilik':             'residential building, keys, for sale sign, cozy home',
  'yatirim-firsatlari':       'investment growth, diamond, profitable opportunity, golden chance',
  'oyun':                     'gaming setup, neon lights, modern gaming controller, dramatic lighting',
  'oyun-haberleri':           'video game controller, gaming arena, neon background',
  'pc-konsol':                'gaming PC setup, console, high tech equipment, RGB lighting',
  'e-spor':                   'esports arena, competitive gaming, tournament stage, crowd',
  'teknoloji':                'futuristic technology, AI visualization, circuit board, blue glow',
  'yapay-zeka':               'artificial intelligence, neural network visualization, robot, futuristic interface',
  'startup':                  'startup office, innovation hub, whiteboard, entrepreneurship',
  'donanim':                  'computer hardware, GPU chip, circuit board, cutting edge tech',
  'rehberler':                'clean minimal workspace, step by step guide, organized desk, professional',
  'nasil-yapilir':            'tutorial concept, instruction manual, how-to steps, learning',
  'para-kazanma':             'money growth, financial success, laptop work from home, passive income',
  'yatirim-taktikleri':       'investment strategy, chess pieces, stock chart, financial planning board',
  'yatirim-rehberleri':       'investment guide, portfolio diversification, financial advisor desk',
}

const SYSTEM_PROMPT = `You are an expert at writing image generation prompts for Flux AI.
Create a professional news website cover image prompt.
Rules:
- Write in English only
- No human faces (copyright issues)
- Photorealistic or highly detailed digital art style
- Professional news photography aesthetic
- No text or letters in image
- High quality, 4K, sharp focus, dramatic lighting
- Cinematic composition
Return ONLY the prompt text, nothing else. No explanation, no quotes.`

export async function buildImagePrompt(title: string, category: string): Promise<string> {
  const mainCategory = category.split('/').pop() || category.split('/')[0]
  const style = CATEGORY_STYLES[mainCategory]
    || CATEGORY_STYLES[category.split('/')[0]]
    || 'professional editorial photography, dark moody atmosphere, 4K, high quality'

  // Shortened title for context (avoid sending too much to AI)
  const shortTitle = title.slice(0, 120)

  try {
    const platform = await prisma.aiPlatform.findFirst({
      where: { active: true, isPrimary: true },
    }) ?? await prisma.aiPlatform.findFirst({ where: { active: true } })

    if (!platform) {
      return buildFallbackPrompt(mainCategory, style)
    }

    const apiKey = decrypt(platform.apiKey)
    const adapter = getAdapter(platform.slug, apiKey)

    const result = await adapter.generate(
      SYSTEM_PROMPT,
      `News title: "${shortTitle}"\nCategory visual style: ${style}\n\nCreate a Flux AI image generation prompt for this news article cover image.`,
      { temperature: 0.7, maxTokens: 200 },
    )

    const prompt = result.content.trim()
    if (prompt.length < 20) {
      return buildFallbackPrompt(mainCategory, style)
    }
    return prompt
  } catch {
    return buildFallbackPrompt(mainCategory, style)
  }
}

function buildFallbackPrompt(category: string, style: string): string {
  return `${style}, highly detailed, professional lighting, no text, no people, cinematic composition, 4K ultra sharp`
}
