import { Metadata } from 'next'
import { StaticPageHero } from '@/components/site/StaticPageHero'

export const metadata: Metadata = {
  title: 'Gizlilik Politikası | Cyba',
}

const SECTIONS = [
  { id: 'toplanan-bilgiler', title: '1. Toplanan Bilgiler', content: 'Site ziyaretleri sırasında IP adresi, tarayıcı bilgisi, gezinme davranışları ve bülten aboneliği kapsamında e-posta adresiniz gibi veriler toplanabilmektedir. Bu veriler, hizmet kalitesini artırmak amacıyla kullanılmaktadır.' },
  { id: 'cerezler', title: '2. Çerez Kullanımı', content: 'Sitemiz, kullanıcı deneyimini iyileştirmek amacıyla çerezler kullanmaktadır. Çerezler, tarayıcı ayarlarınızdan devre dışı bırakılabilir; ancak bu durumda bazı özelliklerin çalışmayabileceğini belirtmek isteriz.' },
  { id: 'veri-kullanimi', title: '3. Veri Kullanımı', content: 'Toplanan veriler; hizmet sunumu, kullanıcı deneyimi iyileştirmesi, güvenlik sağlanması ve yasal yükümlülüklerin yerine getirilmesi amacıyla kullanılmaktadır. Verileriniz üçüncü şahıslarla paylaşılmamaktadır.' },
  { id: 'haklariniz', title: '4. Haklarınız', content: 'Kişisel verilerinize erişim, düzeltme, silme ve itiraz haklarına sahipsiniz. Bu haklarınızı kullanmak için iletisim@cyba.com.tr adresine e-posta gönderebilirsiniz.' },
  { id: 'degisiklikler', title: '5. Politika Değişiklikleri', content: 'Bu gizlilik politikası zaman zaman güncellenebilir. Değişiklikler bu sayfada yayınlanacak ve önemli değişiklikler için kullanıcılar bilgilendirilecektir.' },
]

export default function GizlilikPage() {
  return (
    <div>
      <StaticPageHero title="Gizlilik Politikası" icon="🔒" />
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr] gap-10">
          {/* TOC */}
          <nav className="hidden lg:block">
            <div className="sticky top-24 bg-[var(--bg-card)] rounded-xl border border-[var(--border)] p-4">
              <p className="text-xs font-mono uppercase tracking-widest text-[var(--text-muted)] mb-3">İçindekiler</p>
              <ul className="space-y-2">
                {SECTIONS.map((s) => (
                  <li key={s.id}>
                    <a href={`#${s.id}`} className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">{s.title}</a>
                  </li>
                ))}
              </ul>
            </div>
          </nav>
          {/* Content */}
          <div className="space-y-8 prose">
            <p className="text-[var(--text-muted)]">Son güncelleme: Ocak 2025</p>
            {SECTIONS.map((s) => (
              <div key={s.id} id={s.id} className="scroll-mt-24">
                <h2 className="font-display font-bold text-xl text-[var(--text-primary)] mb-3">{s.title}</h2>
                <p className="text-[var(--text-muted)] leading-relaxed">{s.content}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
