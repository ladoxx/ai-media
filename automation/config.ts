export interface CategorySources {
  rss: string[]
  reddit: string[]
  youtube: string[]
  newsapi: string[]
}

export const SOURCES: Record<string, CategorySources> = {
  borsa: {
    rss: [
      'https://news.google.com/rss/search?q=borsa+hisse+BIST&hl=tr&gl=TR&ceid=TR:tr',
      'https://feeds.finance.yahoo.com/rss/2.0/headline?s=^BIST100&region=TR&lang=tr-TR',
    ],
    reddit: ['stocks', 'investing', 'SecurityAnalysis'],
    youtube: ['borsa haberleri', 'hisse senedi analizi'],
    newsapi: ['BIST100', 'borsa istanbul', 'stocks turkey'],
  },
  kripto: {
    rss: [
      'https://coindesk.com/arc/outboundfeeds/rss/',
      'https://cointelegraph.com/rss',
      'https://decrypt.co/feed',
      'https://news.google.com/rss/search?q=bitcoin+kripto&hl=tr&gl=TR&ceid=TR:tr',
    ],
    reddit: ['CryptoCurrency', 'Bitcoin', 'ethereum'],
    youtube: ['bitcoin news', 'kripto para', 'crypto analysis'],
    newsapi: ['bitcoin', 'ethereum', 'cryptocurrency', 'crypto'],
  },
  'altin-doviz': {
    rss: [
      'https://news.google.com/rss/search?q=gold+price+dolar+altin&hl=tr&gl=TR&ceid=TR:tr',
    ],
    reddit: ['Gold', 'forex', 'investing'],
    youtube: ['gold price', 'altın analizi', 'dolar analizi'],
    newsapi: ['gold price', 'forex', 'USD EUR TRY'],
  },
  analizler: {
    rss: [
      'https://news.google.com/rss/search?q=piyasa+analiz&hl=tr',
      'https://feeds.finance.yahoo.com/rss/2.0/headline',
    ],
    reddit: ['investing', 'SecurityAnalysis', 'finance'],
    youtube: ['piyasa analizi', 'market analysis'],
    newsapi: ['market analysis', 'financial analysis', 'piyasa analiz'],
  },
  'turkiye-ekonomisi': {
    rss: [
      'https://news.google.com/rss/search?q=türkiye+ekonomi+TCMB&hl=tr&gl=TR&ceid=TR:tr',
    ],
    reddit: ['turkey', 'Economics'],
    youtube: ['türkiye ekonomisi', 'TCMB faiz'],
    newsapi: ['Turkey economy', 'TCMB', 'Turkish lira', 'enflasyon'],
  },
  'dunya-ekonomisi': {
    rss: [
      'https://feeds.bbci.co.uk/news/business/rss.xml',
      'https://www.economist.com/finance-and-economics/rss.xml',
    ],
    reddit: ['worldnews', 'Economics', 'economy'],
    youtube: ['world economy', 'Fed interest rate'],
    newsapi: ['world economy', 'Fed', 'ECB', 'global markets'],
  },
  'enflasyon-faiz': {
    rss: [
      'https://news.google.com/rss/search?q=enflasyon+faiz+TCMB+türkiye&hl=tr&gl=TR&ceid=TR:tr',
    ],
    reddit: ['turkey', 'Economics', 'inflation'],
    youtube: ['enflasyon türkiye', 'faiz kararı'],
    newsapi: ['inflation Turkey', 'interest rate', 'TCMB'],
  },
  'sirket-haberleri': {
    rss: [
      'https://news.google.com/rss/search?q=şirket+haber+halka+arz+türkiye&hl=tr&gl=TR&ceid=TR:tr',
    ],
    reddit: ['stocks', 'investing', 'SecurityAnalysis'],
    youtube: ['şirket haberleri', 'halka arz'],
    newsapi: ['corporate news', 'IPO', 'company earnings Turkey'],
  },
  gayrimenkul: {
    rss: [
      'https://news.google.com/rss/search?q=gayrimenkul+konut+kira+türkiye&hl=tr&gl=TR&ceid=TR:tr',
    ],
    reddit: ['realestateinvesting', 'RealEstate'],
    youtube: ['real estate investing', 'gayrimenkul yatırım'],
    newsapi: ['real estate Turkey', 'housing market', 'konut fiyatları'],
  },
  'konut-projeleri': {
    rss: [
      'https://news.google.com/rss/search?q=konut+proje+TOKİ+inşaat&hl=tr&gl=TR&ceid=TR:tr',
    ],
    reddit: ['realestateinvesting'],
    youtube: ['konut projeleri', 'TOKİ başvuru'],
    newsapi: ['housing project Turkey', 'TOKİ'],
  },
  'kira-satilik': {
    rss: [
      'https://news.google.com/rss/search?q=kira+satılık+ev+konut+türkiye&hl=tr&gl=TR&ceid=TR:tr',
    ],
    reddit: ['realestateinvesting', 'RealEstate'],
    youtube: ['kira artışı türkiye', 'ev satın alma'],
    newsapi: ['rental market Turkey', 'housing prices', 'kira'],
  },
  'yatirim-firsatlari': {
    rss: [
      'https://news.google.com/rss/search?q=gayrimenkul+yatırım&hl=tr',
    ],
    reddit: ['realestateinvesting', 'investing'],
    youtube: ['gayrimenkul yatırım fırsatı', 'real estate investment'],
    newsapi: ['real estate investment', 'property investment turkey'],
  },
  'tapu-hukuk': {
    rss: [
      'https://news.google.com/rss/search?q=tapu+hukuk+konut&hl=tr',
    ],
    reddit: ['legaladvice', 'realestate'],
    youtube: ['tapu işlemleri', 'konut hukuku'],
    newsapi: ['tapu', 'konut hukuk', 'property law turkey'],
  },
  'bolgesel-analiz': {
    rss: [
      'https://news.google.com/rss/search?q=istanbul+ankara+izmir+konut&hl=tr',
    ],
    reddit: ['Turkey', 'realestate'],
    youtube: ['istanbul gayrimenkul', 'ankara konut piyasası'],
    newsapi: ['istanbul real estate', 'ankara konut', 'izmir gayrimenkul'],
  },
  'oyun-haberleri': {
    rss: [
      'https://www.ign.com/rss/articles',
      'https://kotaku.com/rss',
    ],
    reddit: ['gaming', 'Games'],
    youtube: ['oyun haberleri', 'game news 2026'],
    newsapi: ['video games', 'gaming news', 'steam'],
  },
  'mobil-oyunlar': {
    rss: [
      'https://news.google.com/rss/search?q=mobile+game+2026',
      'https://toucharcade.com/feed/',
    ],
    reddit: ['androidgaming', 'iosgaming', 'MobileGaming'],
    youtube: ['mobile game news', 'mobil oyun'],
    newsapi: ['mobile game', 'iOS game', 'Android game', 'mobil oyun'],
  },
  'pc-konsol': {
    rss: [
      'https://www.pcgamer.com/rss/',
      'https://www.eurogamer.net/?format=rss',
    ],
    reddit: ['pcgaming', 'PS5', 'xboxone'],
    youtube: ['PC gaming', 'PlayStation news', 'Xbox'],
    newsapi: ['PlayStation', 'Xbox', 'Nintendo', 'PC gaming'],
  },
  'oyun-incelemeleri': {
    rss: [
      'https://www.ign.com/rss/reviews',
      'https://news.google.com/rss/search?q=game+review+2026',
    ],
    reddit: ['patientgamers', 'Games', 'gaming'],
    youtube: ['game review', 'oyun inceleme'],
    newsapi: ['game review', 'oyun inceleme', 'best games 2026'],
  },
  'e-spor': {
    rss: [
      'https://www.espn.com/esports/rss',
      'https://news.google.com/rss/search?q=esports+e-spor&hl=tr&gl=TR&ceid=TR:tr',
    ],
    reddit: ['esports', 'leagueoflegends', 'GlobalOffensive'],
    youtube: ['esports news', 'e-spor haberleri'],
    newsapi: ['esports', 'gaming tournament', 'e-spor'],
  },
  'yapay-zeka': {
    rss: [
      'https://techcrunch.com/category/artificial-intelligence/feed/',
      'https://news.google.com/rss/search?q=yapay+zeka+AI+ChatGPT&hl=tr&gl=TR&ceid=TR:tr',
    ],
    reddit: ['artificial', 'MachineLearning', 'ChatGPT'],
    youtube: ['yapay zeka haberleri', 'AI news 2026'],
    newsapi: ['artificial intelligence', 'ChatGPT', 'LLM', 'OpenAI'],
  },
  startup: {
    rss: [
      'https://techcrunch.com/category/startups/feed/',
      'https://news.google.com/rss/search?q=startup+girişim+türkiye&hl=tr&gl=TR&ceid=TR:tr',
    ],
    reddit: ['startups', 'entrepreneur'],
    youtube: ['startup news', 'girişimcilik'],
    newsapi: ['startup', 'venture capital', 'unicorn', 'girişim'],
  },
  uygulamalar: {
    rss: [
      'https://news.google.com/rss/search?q=uygulama+app+2026&hl=tr',
      'https://techcrunch.com/category/apps/feed/',
    ],
    reddit: ['androidapps', 'iphone', 'software'],
    youtube: ['app news', 'uygulama haberleri'],
    newsapi: ['new app', 'app update', 'mobile app', 'uygulama'],
  },
  teknoloji: {
    rss: [
      'https://www.theverge.com/rss/index.xml',
      'https://news.google.com/rss/search?q=teknoloji+türkiye&hl=tr&gl=TR&ceid=TR:tr',
    ],
    reddit: ['technology', 'tech'],
    youtube: ['teknoloji haberleri', 'tech news'],
    newsapi: ['technology', 'tech news', 'innovation'],
  },
  donanim: {
    rss: [
      'https://www.tomshardware.com/rss/news.xml',
      'https://news.google.com/rss/search?q=donanım+CPU+GPU+bilgisayar&hl=tr&gl=TR&ceid=TR:tr',
    ],
    reddit: ['hardware', 'buildapc', 'nvidia'],
    youtube: ['PC hardware news', 'GPU review'],
    newsapi: ['GPU', 'CPU', 'hardware', 'RTX', 'AMD'],
  },
  'nasil-yapilir': {
    rss: [
      'https://news.google.com/rss/search?q=nasıl+yapılır+rehber+ipucu&hl=tr&gl=TR&ceid=TR:tr',
      'https://feeds.howtogeek.com/HowToGeek',
    ],
    reddit: ['LifeProTips', 'personalfinance', 'learnprogramming'],
    youtube: ['nasıl yapılır', 'how to guide türkçe'],
    newsapi: ['how to', 'guide', 'tutorial', 'tips'],
  },
  'para-kazanma': {
    rss: [
      'https://news.google.com/rss/search?q=para+kazanma+gelir+yatırım+türkiye&hl=tr&gl=TR&ceid=TR:tr',
    ],
    reddit: ['personalfinance', 'financialindependence', 'passive_income'],
    youtube: ['para kazanma yolları', 'online para kazanma'],
    newsapi: ['passive income', 'make money online', 'freelance'],
  },
  'yatirim-taktikleri': {
    rss: [
      'https://news.google.com/rss/search?q=yatırım+strateji+portföy+borsa&hl=tr&gl=TR&ceid=TR:tr',
      'https://feeds.finance.yahoo.com/rss/2.0/headline?s=INVESTING&region=TR&lang=tr-TR',
    ],
    reddit: ['investing', 'ValueInvesting', 'stocks'],
    youtube: ['yatırım stratejisi', 'portföy yönetimi'],
    newsapi: ['investment strategy', 'portfolio', 'stock market tips'],
  },
}

export const MAX_POSTS_PER_CATEGORY = 2
export const MAX_SOURCE_ITEMS = 10
export const ONE_DAY_MS = 24 * 60 * 60 * 1000

export const CATEGORY_META: Record<string, { label: string; emoji: string; color: [string, string] }> = {
  borsa:               { label: 'BORSA',           emoji: '📈', color: ['#1a0a00', '#f7931a'] },
  kripto:              { label: 'KRİPTO',           emoji: '₿',  color: ['#1a0a00', '#f7931a'] },
  'altin-doviz':       { label: 'ALTIN & DÖVİZ',   emoji: '🥇', color: ['#1a0a00', '#f7931a'] },
  analizler:           { label: 'ANALİZLER',        emoji: '📊', color: ['#1a0a00', '#f7931a'] },
  'turkiye-ekonomisi': { label: 'TÜRKİYE EKONOMİSİ', emoji: '🇹🇷', color: ['#001a3d', '#3b82f6'] },
  'dunya-ekonomisi':   { label: 'DÜNYA EKONOMİSİ', emoji: '🌍', color: ['#001a3d', '#3b82f6'] },
  'enflasyon-faiz':    { label: 'ENFLASYON & FAİZ', emoji: '📉', color: ['#001a3d', '#3b82f6'] },
  'sirket-haberleri':  { label: 'ŞİRKET HABERLERİ', emoji: '🏢', color: ['#001a3d', '#3b82f6'] },
  gayrimenkul:         { label: 'GAYRİMENKUL',     emoji: '🏡', color: ['#001a0a', '#10b981'] },
  'konut-projeleri':   { label: 'KONUT',           emoji: '🏗️', color: ['#001a0a', '#10b981'] },
  'kira-satilik':      { label: 'KİRA & SATILIK',  emoji: '🔑', color: ['#001a0a', '#10b981'] },
  'yatirim-firsatlari': { label: 'YATIRIM FIRSATLARI', emoji: '💎', color: ['#001a0a', '#10b981'] },
  'tapu-hukuk':        { label: 'TAPU & HUKUK',    emoji: '📜', color: ['#001a0a', '#10b981'] },
  'bolgesel-analiz':   { label: 'BÖLGESEL ANALİZ', emoji: '🗺️', color: ['#001a0a', '#10b981'] },
  'oyun-haberleri':    { label: 'OYUN',            emoji: '🎮', color: ['#1a0040', '#a855f7'] },
  'mobil-oyunlar':     { label: 'MOBİL OYUNLAR',   emoji: '📱', color: ['#1a0040', '#a855f7'] },
  'pc-konsol':         { label: 'PC & KONSOL',     emoji: '🖥️', color: ['#1a0040', '#a855f7'] },
  'oyun-incelemeleri': { label: 'OYUN İNCELEMELERİ', emoji: '⭐', color: ['#1a0040', '#a855f7'] },
  'e-spor':            { label: 'E-SPOR',          emoji: '🏆', color: ['#1a0040', '#a855f7'] },
  'yapay-zeka':        { label: 'YAPAY ZEKA',      emoji: '🧠', color: ['#0d1117', '#00c896'] },
  startup:             { label: 'STARTUP',         emoji: '🚀', color: ['#0d1117', '#00c896'] },
  uygulamalar:         { label: 'UYGULAMALAR',     emoji: '📲', color: ['#0d1117', '#00c896'] },
  teknoloji:           { label: 'TEKNOLOJİ',       emoji: '🤖', color: ['#0d1117', '#00c896'] },
  donanim:             { label: 'DONANIM',         emoji: '💻', color: ['#0d1117', '#00c896'] },
}

// ── New ALL_CATEGORIES config ─────────────────────────────────────────────────

export interface CategoryConfig {
  slug: string
  name: string
  pipeline: 'news' | 'guide'
  scheduleTime?: string  // "HH:MM" formatında
  scheduleDays?: number[] // 0=Pazar...6=Cumartesi, yoksa her gün
  sources: {
    rss: string[]
    newsapi?: string[]
    reddit?: string[]
    queries?: string[]  // guide için
  }
}

export const ALL_CATEGORIES: CategoryConfig[] = [
  // FİNANS
  { slug: 'finans/borsa', name: 'Borsa', pipeline: 'news', scheduleTime: '06:00',
    sources: {
      rss: ['https://feeds.finance.yahoo.com/rss/2.0/headline','https://news.google.com/rss/search?q=borsa+bist&hl=tr&gl=TR'],
      newsapi: ['BIST100','borsa istanbul','stock market turkey'],
      reddit: ['investing','stocks','stockmarket'],
    },
  },
  { slug: 'finans/kripto', name: 'Kripto', pipeline: 'news', scheduleTime: '06:10',
    sources: {
      rss: ['https://coindesk.com/arc/outboundfeeds/rss/','https://cointelegraph.com/rss','https://news.google.com/rss/search?q=kripto+bitcoin&hl=tr'],
      newsapi: ['bitcoin','ethereum','crypto','kripto'],
      reddit: ['CryptoCurrency','Bitcoin','ethereum'],
    },
  },
  { slug: 'finans/altin-doviz', name: 'Altın & Döviz', pipeline: 'news', scheduleTime: '06:20',
    sources: {
      rss: ['https://news.google.com/rss/search?q=altın+dolar+euro&hl=tr','https://news.google.com/rss/search?q=gold+price+USD'],
      newsapi: ['gold price','forex','USD TRY','altın fiyat'],
      reddit: ['forex','investing','Gold'],
    },
  },
  { slug: 'finans/analizler', name: 'Analizler', pipeline: 'news', scheduleTime: '06:30',
    sources: {
      rss: ['https://news.google.com/rss/search?q=piyasa+analiz&hl=tr','https://feeds.finance.yahoo.com/rss/2.0/headline'],
      newsapi: ['market analysis','financial analysis','piyasa analiz'],
      reddit: ['investing','SecurityAnalysis','finance'],
    },
  },
  // EKONOMİ
  { slug: 'ekonomi/turkiye-ekonomisi', name: 'Türkiye Ekonomisi', pipeline: 'news', scheduleTime: '06:40',
    sources: {
      rss: ['https://news.google.com/rss/search?q=türkiye+ekonomi+tcmb&hl=tr','https://news.google.com/rss/search?q=turkey+economy+inflation'],
      newsapi: ['Turkey economy','TCMB','türkiye enflasyon','Turkish lira'],
      reddit: ['turkey','Economics'],
    },
  },
  { slug: 'ekonomi/dunya-ekonomisi', name: 'Dünya Ekonomisi', pipeline: 'news', scheduleTime: '06:50',
    sources: {
      rss: ['https://feeds.bbci.co.uk/news/business/rss.xml','https://news.google.com/rss/search?q=world+economy+2026'],
      newsapi: ['world economy','global markets','IMF','World Bank'],
      reddit: ['Economics','worldnews','economy'],
    },
  },
  { slug: 'ekonomi/enflasyon-faiz', name: 'Enflasyon & Faiz', pipeline: 'news', scheduleTime: '07:00',
    sources: {
      rss: ['https://news.google.com/rss/search?q=enflasyon+faiz+türkiye&hl=tr','https://news.google.com/rss/search?q=inflation+interest+rate+2026'],
      newsapi: ['inflation','interest rate','enflasyon','faiz oranı'],
      reddit: ['Economics','personalfinance','investing'],
    },
  },
  { slug: 'ekonomi/sirket-haberleri', name: 'Şirket Haberleri', pipeline: 'news', scheduleTime: '07:10',
    sources: {
      rss: ['https://news.google.com/rss/search?q=şirket+haber+türkiye&hl=tr','https://feeds.finance.yahoo.com/rss/2.0/headline'],
      newsapi: ['company news','earnings','IPO','şirket haberleri'],
      reddit: ['stocks','investing','business'],
    },
  },
  // GAYRİMENKUL
  { slug: 'gayrimenkul/konut-projeleri', name: 'Konut Projeleri', pipeline: 'news', scheduleTime: '12:00',
    sources: {
      rss: ['https://news.google.com/rss/search?q=konut+proje+türkiye&hl=tr'],
      newsapi: ['konut projesi','housing project turkey','yeni proje'],
      reddit: ['realestate','Turkey'],
    },
  },
  { slug: 'gayrimenkul/kira-satilik', name: 'Kira & Satılık', pipeline: 'news', scheduleTime: '12:10',
    sources: {
      rss: ['https://news.google.com/rss/search?q=kira+fiyat+türkiye&hl=tr','https://news.google.com/rss/search?q=ev+fiyatları+2026&hl=tr'],
      newsapi: ['kira fiyat','konut fiyat','rent turkey','house price'],
      reddit: ['realestate','turkey'],
    },
  },
  { slug: 'gayrimenkul/yatirim-firsatlari', name: 'Yatırım Fırsatları', pipeline: 'news', scheduleTime: '12:20',
    sources: {
      rss: ['https://news.google.com/rss/search?q=gayrimenkul+yatırım&hl=tr'],
      newsapi: ['real estate investment','property investment turkey'],
      reddit: ['realestateinvesting','investing'],
    },
  },
  { slug: 'gayrimenkul/tapu-hukuk', name: 'Tapu & Hukuk', pipeline: 'news', scheduleTime: '12:30',
    sources: {
      rss: ['https://news.google.com/rss/search?q=tapu+hukuk+konut&hl=tr'],
      newsapi: ['tapu','konut hukuk','property law turkey'],
      reddit: ['legaladvice','realestate'],
    },
  },
  { slug: 'gayrimenkul/bolgesel-analiz', name: 'Bölgesel Analiz', pipeline: 'news', scheduleTime: '12:40',
    sources: {
      rss: ['https://news.google.com/rss/search?q=istanbul+ankara+izmir+konut&hl=tr'],
      newsapi: ['istanbul real estate','ankara konut','izmir gayrimenkul'],
      reddit: ['Turkey','realestate'],
    },
  },
  // OYUN
  { slug: 'oyun/oyun-haberleri', name: 'Oyun Haberleri', pipeline: 'news', scheduleTime: '13:00',
    sources: {
      rss: ['https://www.ign.com/rss/articles','https://kotaku.com/rss','https://www.pcgamer.com/rss/'],
      newsapi: ['gaming news','video game','oyun haberleri'],
      reddit: ['gaming','Games'],
    },
  },
  { slug: 'oyun/mobil-oyunlar', name: 'Mobil Oyunlar', pipeline: 'news', scheduleTime: '13:10',
    sources: {
      rss: ['https://news.google.com/rss/search?q=mobile+game+2026','https://toucharcade.com/feed/'],
      newsapi: ['mobile game','iOS game','Android game','mobil oyun'],
      reddit: ['androidgaming','iosgaming','MobileGaming'],
    },
  },
  { slug: 'oyun/pc-konsol', name: 'PC & Konsol', pipeline: 'news', scheduleTime: '13:20',
    sources: {
      rss: ['https://www.pcgamer.com/rss/','https://news.google.com/rss/search?q=playstation+xbox+nintendo+2026'],
      newsapi: ['PC gaming','PlayStation','Xbox','Nintendo','Steam'],
      reddit: ['pcgaming','PS5','XboxSeriesX','NintendoSwitch'],
    },
  },
  { slug: 'oyun/oyun-incelemeleri', name: 'Oyun İncelemeleri', pipeline: 'news', scheduleTime: '17:00',
    sources: {
      rss: ['https://www.ign.com/rss/reviews','https://news.google.com/rss/search?q=game+review+2026'],
      newsapi: ['game review','oyun inceleme','best games 2026'],
      reddit: ['patientgamers','Games','gaming'],
    },
  },
  { slug: 'oyun/e-spor', name: 'E-spor', pipeline: 'news', scheduleTime: '17:10',
    sources: {
      rss: ['https://news.google.com/rss/search?q=esports+tournament+2026'],
      newsapi: ['esports','e-spor','League of Legends','CS2','Valorant'],
      reddit: ['esports','leagueoflegends','GlobalOffensive'],
    },
  },
  // TEKNOLOJİ
  { slug: 'teknoloji/yapay-zeka', name: 'Yapay Zeka', pipeline: 'news', scheduleTime: '17:20',
    sources: {
      rss: ['https://techcrunch.com/category/artificial-intelligence/feed/','https://news.google.com/rss/search?q=yapay+zeka+AI+2026&hl=tr'],
      newsapi: ['artificial intelligence','ChatGPT','LLM','yapay zeka'],
      reddit: ['artificial','MachineLearning','ChatGPT'],
    },
  },
  { slug: 'teknoloji/startup', name: 'Startup', pipeline: 'news', scheduleTime: '17:30',
    sources: {
      rss: ['https://techcrunch.com/category/startups/feed/','https://news.google.com/rss/search?q=startup+türkiye+2026&hl=tr'],
      newsapi: ['startup funding','venture capital','girişim türkiye'],
      reddit: ['startups','entrepreneur','SaaS'],
    },
  },
  { slug: 'teknoloji/uygulamalar', name: 'Uygulamalar', pipeline: 'news', scheduleTime: '17:40',
    sources: {
      rss: ['https://news.google.com/rss/search?q=uygulama+app+2026&hl=tr','https://techcrunch.com/category/apps/feed/'],
      newsapi: ['new app','app update','mobile app','uygulama'],
      reddit: ['androidapps','iphone','software'],
    },
  },
  { slug: 'teknoloji/donanim', name: 'Donanım', pipeline: 'news', scheduleTime: '17:50',
    sources: {
      rss: ['https://www.theverge.com/rss/index.xml','https://news.google.com/rss/search?q=hardware+tech+2026'],
      newsapi: ['hardware','CPU','GPU','smartphone','donanım'],
      reddit: ['hardware','buildapc'],
    },
  },
  // REHBERLEr (Guide Pipeline) - Haftalık
  { slug: 'rehberler/nasil-yapilir', name: 'Nasıl Yapılır?', pipeline: 'guide', scheduleTime: '10:00', scheduleDays: [2],
    sources: {
      rss: [],
      queries: ['nasıl yapılır site:reddit.com','how to site:quora.com turkey','{keyword} adım adım rehber 2026'],
    },
  },
  { slug: 'rehberler/para-kazanma', name: 'Para Kazanma', pipeline: 'guide', scheduleTime: '10:00', scheduleDays: [4],
    sources: {
      rss: [],
      queries: ['evden para kazanma yolları 2026','online para kazanma türkiye','pasif gelir nasıl elde edilir','make money online turkey 2026'],
    },
  },
  { slug: 'rehberler/yatirim-taktikleri', name: 'Yatırım Taktikleri', pipeline: 'guide', scheduleTime: '10:00', scheduleDays: [6],
    sources: {
      rss: [],
      queries: ['yatırım taktikleri başlangıç 2026','borsa yatırım stratejisi','kripto yatırım rehberi','altın yatırımı mantıklı mı 2026'],
    },
  },
]

export const NEWS_CATEGORIES = ALL_CATEGORIES.filter(c => c.pipeline === 'news')
export const GUIDE_CATEGORIES_LIST = ALL_CATEGORIES.filter(c => c.pipeline === 'guide')

export function getCategoryConfig(slug: string): CategoryConfig | undefined {
  return ALL_CATEGORIES.find(c => c.slug === slug)
}

// Slug'ın son parçasını döndür (pipeline uyumu için)
export function getCategorySlugTail(slug: string): string {
  return slug.split('/').pop() || slug
}

// Legacy guide category set (eski kod uyumu için)
export const GUIDE_CATEGORY_SLUGS = new Set(
  GUIDE_CATEGORIES_LIST.map(c => getCategorySlugTail(c.slug))
)
