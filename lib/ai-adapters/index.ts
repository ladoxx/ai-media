import { DeepSeekAdapter } from './deepseek'

export function getAdapter(platformSlug: string, apiKey: string) {
  switch (platformSlug) {
    case 'deepseek':
      return new DeepSeekAdapter(apiKey)
    default:
      return new DeepSeekAdapter(apiKey)
  }
}
