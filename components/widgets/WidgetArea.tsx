import { getWidgetsByArea } from '@/lib/widgets'
import { RecentPostsWidget } from './RecentPostsWidget'
import { NewsletterWidget } from './NewsletterWidget'
import { TrendingWidget } from './TrendingWidget'
import { SearchWidget } from './SearchWidget'
import { AdWidget } from './AdWidget'
import { CustomHtmlWidget } from './CustomHtmlWidget'
import { TagCloud } from '@/components/site/TagCloud'

interface Props {
  area: string
}

export async function WidgetArea({ area }: Props) {
  const widgets = await getWidgetsByArea(area)
  if (!widgets.length) return null

  return (
    <div className="space-y-6">
      {widgets.map((widget) => {
        const settings: Record<string, string> = JSON.parse(widget.settings || '{}')
        switch (widget.type) {
          case 'recent-posts':   return <RecentPostsWidget key={widget.id} settings={settings} />
          case 'newsletter':     return <NewsletterWidget key={widget.id} settings={settings} />
          case 'trending':       return <TrendingWidget key={widget.id} settings={settings} />
          case 'tag-cloud':      return <TagCloud key={widget.id} />
          case 'search':         return <SearchWidget key={widget.id} />
          case 'ad':             return <AdWidget key={widget.id} settings={settings} />
          case 'custom-html':    return <CustomHtmlWidget key={widget.id} settings={settings} />
          default:               return null
        }
      })}
    </div>
  )
}
