// Placeholder for future translation support.
// Currently, the AI writer directly generates Turkish content.
// This module can be extended to translate non-Turkish sources via
// the AI router before feeding them to the article generator.

import type { NewsItem } from '../types'

/**
 * Filters news items to only those that are relevant (non-empty).
 * In the future, this could translate English summaries to Turkish.
 */
export function prepareNewsItems(items: NewsItem[]): NewsItem[] {
  return items
    .filter((item) => item.title && item.title.length > 10)
    .map((item) => ({
      ...item,
      summary: item.summary?.slice(0, 500) || '',
    }))
}
