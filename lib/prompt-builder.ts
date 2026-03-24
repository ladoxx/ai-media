/**
 * Replaces {{variable}} placeholders in a template string.
 *
 * Supported variables:
 *   {{title}}     → News title
 *   {{summary}}   → News summary
 *   {{source}}    → News source
 *   {{date}}      → News date
 *   {{category}}  → Category slug
 *   {{content}}   → Article HTML content
 *   {{count}}     → Number of news items
 *   {{news_list}} → Formatted list of news items
 *   {{site_name}} → Site name
 */
export function buildPrompt(
  template: string,
  variables: Record<string, string>,
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key: string) => {
    return Object.prototype.hasOwnProperty.call(variables, key)
      ? variables[key]
      : match
  })
}

/** All variable names recognised by the prompt builder */
export const PROMPT_VARIABLES = [
  { key: 'title',     description: 'Haber başlığı' },
  { key: 'summary',   description: 'Haber özeti' },
  { key: 'source',    description: 'Haber kaynağı' },
  { key: 'date',      description: 'Haber tarihi' },
  { key: 'category',  description: 'Kategori adı' },
  { key: 'content',   description: 'Makale HTML içeriği' },
  { key: 'count',     description: 'Haber sayısı' },
  { key: 'news_list', description: 'Haber listesi (numaralı)' },
  { key: 'site_name', description: 'Site adı (Cyba)' },
] as const
