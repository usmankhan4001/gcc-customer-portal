import { Envelope, Phone, ChatCircle } from '@phosphor-icons/react/dist/ssr';
import BannerHeader from '@/components/portal/BannerHeader';

const CONTACTS = [
  { href: 'mailto:support@gccstartup.com', Icon: Envelope, title: 'E-mail', note: 'support@gccstartup.com', external: false },
  { href: 'tel:+97337728231', Icon: Phone, title: 'Call', note: 'Speak directly with our team', external: false },
  { href: 'https://wa.me/97337728231', Icon: ChatCircle, title: 'WhatsApp', note: 'Fastest response time', external: true },
];

export default function Support() {
  return (
    <div className="wrap admin-page pb-24">
      <BannerHeader title="Support" subtitle="We are here to help" />

      <div className="admin-section-head">
        <h2>Online support</h2>
      </div>
      <div style={{ display: 'grid', gap: 'var(--space-3)', maxWidth: 720 }}>
        {CONTACTS.map(({ href, Icon, title, note, external }) => (
          <a
            key={title}
            href={href}
            {...(external ? { target: '_blank', rel: 'noreferrer' } : {})}
            className="card"
            style={{
              display: 'flex', alignItems: 'center', gap: 'var(--space-4)',
              minHeight: 64, padding: 'var(--space-4)',
              textDecoration: 'none', color: 'var(--text-primary)',
            }}
          >
            <Icon size={24} weight="duotone" style={{ color: 'var(--orange)', flexShrink: 0 }} />
            <span>
              <strong style={{ display: 'block' }}>{title}</strong>
              <span className="admin-form-note" style={{ margin: 0 }}>{note}</span>
            </span>
          </a>
        ))}
      </div>
    </div>
  );
}
