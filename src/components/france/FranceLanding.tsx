import Link from 'next/link';
import { PAGES, REVIEW_MODE, UI, pagePath, type LandingPage, type Locale } from '@/lib/france/content';
import { FranceLeadForm } from './FranceLeadForm';
import styles from './france.module.css';

export function FranceLanding({ page, locale }: { page: LandingPage; locale: Locale }) {
  const copy = page[locale];
  const t = UI[locale];
  const other: Locale = locale === 'fr' ? 'en' : 'fr';

  return (
    <div lang={locale}>
      {REVIEW_MODE && <div className={styles.ribbon}>{t.ribbon}</div>}

      <header className={styles.top}>
        <Link href="/france" className={styles.brand}>
          GCC<b>.</b>Startup
        </Link>
        <Link href={pagePath(page.slug, other)} className={styles.lang} hrefLang={other} lang={other}>
          {t.switchLabel}
        </Link>
      </header>

      <section className={styles.hero}>
        <div className={styles.heroIn}>
          <p className={styles.eyebrow}>{t.brandTag}</p>
          <h1>{copy.h1}</h1>
          <p className={styles.adline}>{copy.adLine}</p>
          <p className={styles.lede}>{copy.lede}</p>
          <div>
            <a href="#formulaire" className="btn btn-primary">
              {copy.cta}
            </a>
          </div>
          <p className={styles.trust}>{t.trust}</p>
        </div>
      </section>

      <main id="main-content" className={styles.layout}>
        <div className={styles.sections}>
          {copy.sections.map((s, i) => (
            <section key={s.title} className={styles.card} aria-labelledby={`s${i}`}>
              <h2 id={`s${i}`}>
                <span aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
                {s.title}
              </h2>
              {s.body && <p>{s.body}</p>}
              {s.bullets && (
                <ul>
                  {s.bullets.map((b) => (
                    <li key={b}>{b}</li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>

        <aside id="formulaire" className={`${styles.card} ${styles.formCard}`}>
          <FranceLeadForm locale={locale} slug={page.slug} cta={copy.cta} />
        </aside>
      </main>

      <footer className={styles.foot}>{t.disclaimer}</footer>
    </div>
  );
}

/** Index of all twelve pages. Review aid only; noindex while REVIEW_MODE is on. */
export function FranceIndex() {
  return (
    <div lang="en">
      {REVIEW_MODE && <div className={styles.ribbon}>{UI.en.ribbon}</div>}
      <main id="main-content" style={{ maxWidth: 1180, margin: '0 auto', padding: '32px 20px 72px' }}>
        <h1 style={{ margin: '0 0 8px' }}>France campaign pages</h1>
        <p style={{ color: 'var(--text-secondary)', margin: '0 0 24px' }}>
          Six concepts, each in French and English. Review copy and layout on a phone as well as a desktop.
        </p>
        <div className={styles.hubGrid}>
          {PAGES.map((p) => (
            <div key={p.slug} className={styles.card}>
              <h2>
                <span>{p.num}</span>
                {p.fr.h1}
              </h2>
              <p style={{ marginBottom: 12 }}>{p.en.h1}</p>
              <p style={{ display: 'flex', gap: 12 }}>
                <Link href={pagePath(p.slug, 'fr')} hrefLang="fr" style={{ fontWeight: 700 }}>
                  Français
                </Link>
                <Link href={pagePath(p.slug, 'en')} hrefLang="en" style={{ fontWeight: 700 }}>
                  English
                </Link>
              </p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
