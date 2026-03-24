import { Metadata } from 'next'
import { StaticPageHero } from '@/components/site/StaticPageHero'

export const metadata: Metadata = { title: 'Çerez Politikası | Cyba' }

export default function CerezPolitikasiPage() {
  return (
    <div>
      <StaticPageHero title="Çerez Politikası" icon="🍪" />
      <div className="max-w-4xl mx-auto px-4 py-12 space-y-8 prose">
        <p className="text-[var(--text-muted)]">Bu sayfa, sitemizin çerez kullanımı hakkında bilgi vermektedir.</p>
        {[
          { title: 'Zorunlu Çerezler', content: 'Sitenin çalışması için gerekli teknik çerezlerdir. Devre dışı bırakılamazlar.' },
          { title: 'Analitik Çerezler', content: 'Site trafiğini analiz etmek ve içeriklerimizi geliştirmek için kullanılır.' },
          { title: 'Tercih Çerezleri', content: 'Tema seçimi gibi kullanıcı tercihlerinizi hatırlamak için kullanılır (ör: karanlık/aydınlık mod).' },
          { title: 'Çerezleri Yönetme', content: 'Tarayıcı ayarlarınızdan çerezleri dilediğiniz zaman silebilir veya devre dışı bırakabilirsiniz.' },
        ].map((s) => (
          <div key={s.title}>
            <h2 className="font-display font-bold text-xl text-[var(--text-primary)] mb-2">{s.title}</h2>
            <p className="text-[var(--text-muted)] leading-relaxed">{s.content}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
