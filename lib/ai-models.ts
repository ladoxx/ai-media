export interface AiModel {
  id: string
  name: string
  free?: boolean
  speed?: 'hızlı' | 'orta' | 'yavaş'
  contextWindow?: string
}

export interface PlatformMeta {
  slug: string
  name: string
  icon: string
  color: string
  description: string
  howToGet: string
  pricing: string
  defaultModel: string
  defaultBaseUrl?: string
  models: AiModel[]
}

export const AI_MODELS: Record<string, AiModel[]> = {
  gemini: [
    { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', free: true, speed: 'hızlı', contextWindow: '1M' },
    { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', free: true, speed: 'hızlı', contextWindow: '1M' },
    { id: 'gemini-1.5-flash-8b', name: 'Gemini 1.5 Flash 8B', free: true, speed: 'hızlı', contextWindow: '1M' },
    { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', free: false, speed: 'yavaş', contextWindow: '2M' },
  ],
  openrouter: [
    // ── Ücretsiz modeller ──────────────────────────────────────────────
    { id: 'google/gemini-2.0-flash-exp:free', name: 'Gemini 2.0 Flash (Ücretsiz)', free: true, speed: 'hızlı', contextWindow: '1M' },
    { id: 'google/gemini-flash-1.5-8b:free', name: 'Gemini 1.5 Flash 8B (Ücretsiz)', free: true, speed: 'hızlı', contextWindow: '1M' },
    { id: 'deepseek/deepseek-chat:free', name: 'DeepSeek V3 (Ücretsiz)', free: true, speed: 'orta', contextWindow: '64K' },
    { id: 'deepseek/deepseek-r1:free', name: 'DeepSeek R1 Reasoning (Ücretsiz)', free: true, speed: 'yavaş', contextWindow: '64K' },
    { id: 'meta-llama/llama-3.3-70b-instruct:free', name: 'Llama 3.3 70B (Ücretsiz)', free: true, speed: 'orta', contextWindow: '128K' },
    { id: 'meta-llama/llama-3.1-8b-instruct:free', name: 'Llama 3.1 8B (Ücretsiz)', free: true, speed: 'hızlı', contextWindow: '128K' },
    { id: 'mistralai/mistral-7b-instruct:free', name: 'Mistral 7B (Ücretsiz)', free: true, speed: 'hızlı', contextWindow: '32K' },
    { id: 'qwen/qwen-2.5-72b-instruct:free', name: 'Qwen 2.5 72B (Ücretsiz)', free: true, speed: 'orta', contextWindow: '32K' },
    { id: 'microsoft/phi-4:free', name: 'Microsoft Phi-4 (Ücretsiz)', free: true, speed: 'orta', contextWindow: '16K' },
    { id: 'nousresearch/hermes-3-llama-3.1-405b:free', name: 'Hermes 3 Llama 405B (Ücretsiz)', free: true, speed: 'yavaş', contextWindow: '128K' },
    // ── Ücretli modeller ───────────────────────────────────────────────
    { id: 'google/gemini-flash-1.5', name: 'Gemini Flash 1.5 (Ücretli)', free: false, speed: 'hızlı' },
    { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet (Ücretli)', free: false, speed: 'orta' },
    { id: 'openai/gpt-4o', name: 'GPT-4o (Ücretli)', free: false, speed: 'orta' },
    { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini (Ücretli)', free: false, speed: 'hızlı' },
  ],
  huggingface: [
    { id: 'mistralai/Mixtral-8x7B-Instruct-v0.1', name: 'Mixtral 8x7B', free: true, speed: 'yavaş' },
    { id: 'meta-llama/Llama-3.2-11B-Vision-Instruct', name: 'Llama 3.2 11B', free: true, speed: 'yavaş' },
    { id: 'microsoft/Phi-3.5-mini-instruct', name: 'Phi 3.5 Mini', free: true, speed: 'orta' },
    { id: 'HuggingFaceH4/zephyr-7b-beta', name: 'Zephyr 7B', free: true, speed: 'orta' },
  ],
  groq: [
    { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B', free: true, speed: 'hızlı', contextWindow: '128K' },
    { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B Instant', free: true, speed: 'hızlı', contextWindow: '128K' },
    { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B', free: true, speed: 'hızlı', contextWindow: '32K' },
    { id: 'gemma2-9b-it', name: 'Gemma2 9B', free: true, speed: 'hızlı', contextWindow: '8K' },
  ],
  anthropic: [
    { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', free: false, speed: 'orta' },
    { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku', free: false, speed: 'hızlı' },
    { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus', free: false, speed: 'yavaş' },
  ],
  openai: [
    { id: 'gpt-4o', name: 'GPT-4o', free: false, speed: 'orta' },
    { id: 'gpt-4o-mini', name: 'GPT-4o Mini (Ucuz)', free: false, speed: 'hızlı' },
    { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', free: false, speed: 'hızlı' },
  ],
  deepseek: [
    { id: 'deepseek-chat', name: 'DeepSeek V3 (Chat)', free: false, speed: 'hızlı', contextWindow: '64K' },
    { id: 'deepseek-reasoner', name: 'DeepSeek R1 (Reasoner)', free: false, speed: 'yavaş', contextWindow: '64K' },
  ],
}

export const PLATFORM_META: PlatformMeta[] = [
  {
    slug: 'gemini',
    name: 'Google Gemini',
    icon: '🤖',
    color: '#4285f4',
    description: 'Google\'un üretken AI modeli. Ücretsiz tier ile güçlü.',
    howToGet: 'aistudio.google.com → API Keys',
    pricing: 'Ücretsiz / $0.075 per 1M token',
    defaultModel: 'gemini-1.5-flash',
    models: AI_MODELS.gemini,
  },
  {
    slug: 'openrouter',
    name: 'OpenRouter',
    icon: '🔀',
    color: '#7c3aed',
    description: 'Tek API ile 100+ AI modeline erişim.',
    howToGet: 'openrouter.ai → Keys',
    pricing: 'Model bazlı değişir ($0 - $30/1M token)',
    defaultModel: 'meta-llama/llama-3.3-70b-instruct:free',
    defaultBaseUrl: 'https://openrouter.ai/api/v1',
    models: AI_MODELS.openrouter,
  },
  {
    slug: 'huggingface',
    name: 'HuggingFace',
    icon: '🤗',
    color: '#ff9d00',
    description: 'Açık kaynak AI modelleri. Ücretsiz serverless inference.',
    howToGet: 'huggingface.co/settings/tokens',
    pricing: 'Ücretsiz başlangıç / Pro $9/ay',
    defaultModel: 'mistralai/Mixtral-8x7B-Instruct-v0.1',
    models: AI_MODELS.huggingface,
  },
  {
    slug: 'groq',
    name: 'Groq',
    icon: '⚡',
    color: '#f97316',
    description: 'Dünyanın en hızlı AI inference (500+ token/sn). Ücretsiz.',
    howToGet: 'console.groq.com → API Keys',
    pricing: 'Ücretsiz / 14.400 req/gün',
    defaultModel: 'llama-3.3-70b-versatile',
    models: AI_MODELS.groq,
  },
  {
    slug: 'anthropic',
    name: 'Claude API',
    icon: '🧠',
    color: '#b45309',
    description: 'Anthropic\'in Claude modelleri. En kaliteli içerik üretimi.',
    howToGet: 'console.anthropic.com → API Keys',
    pricing: '$0.25 - $15 per 1M token',
    defaultModel: 'claude-3-5-haiku-20241022',
    models: AI_MODELS.anthropic,
  },
  {
    slug: 'openai',
    name: 'OpenAI',
    icon: '🌐',
    color: '#10a37f',
    description: 'ChatGPT\'nin arkasındaki API. Geniş ekosistem.',
    howToGet: 'platform.openai.com → API Keys',
    pricing: '$0.15 - $30 per 1M token',
    defaultModel: 'gpt-4o-mini',
    models: AI_MODELS.openai,
  },
  {
    slug: 'deepseek',
    name: 'DeepSeek',
    icon: '🐋',
    color: '#0ea5e9',
    description: 'Çin\'in en güçlü AI modeli. GPT-4 kalitesinde, çok ucuz.',
    howToGet: 'platform.deepseek.com → API Keys',
    pricing: '$0.27 / 1M token (V3) · $0.55 / 1M (R1)',
    defaultModel: 'deepseek-chat',
    models: AI_MODELS.deepseek,
  },
]

export function getPlatformMeta(slug: string): PlatformMeta | undefined {
  return PLATFORM_META.find((p) => p.slug === slug)
}
