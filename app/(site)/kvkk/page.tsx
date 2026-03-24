import { Metadata } from 'next'
import { StaticPageHero } from '@/components/site/StaticPageHero'

export const metadata: Metadata = { title: 'KVKK Aydınlatma Metni | Cyba' }

export default function KvkkPage() {
  return (
    <div>
      <StaticPageHero title="KVKK Aydınlatma Metni" icon="📋" />
      <div className="max-w-4xl mx-auto px-4 py-12 space-y-8 prose">
        <p className="text-[var(--text-muted)]">6698 sayılı Kişisel Verilerin Korunması Kanunu kapsamında hazırlanmıştır.</p>
        {[
          { title: '1. Veri Sorumlusu', content: 'Cyba, 6698 sayılı KVKK kapsamında veri sorumlusu sıfatıyla hareket etmektedir.' },
          { title: '2. İşlenen Veriler', content: 'Adınız, e-posta adresiniz, IP adresiniz ve gezinme verileriniz işlenebilmektedir.' },
          { title: '3. Amaç ve Hukuki Sebep', content: 'Verileriniz; hizmet sunumu, güvenlik ve yasal yükümlülükler kapsamında işlenmektedir.' },
          { title: '4. Haklarınız', content: 'KVKK 11. maddesi kapsamında; kişisel verilerinize erişim, düzeltme, silme ve itiraz haklarına sahipsiniz.' },
          { title: '5. İletişim', content: 'KVKK haklarınız için: iletisim@cyba.com.tr' },
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
