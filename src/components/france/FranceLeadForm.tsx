'use client';

import { useState, type FormEvent } from 'react';
import {
  ACTIVITY,
  JURISDICTION,
  RESIDENCY,
  TIMELINE,
  UI,
  type Locale,
} from '@/lib/france/content';
import styles from './france.module.css';

type Residency = (typeof RESIDENCY)[number];

const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'] as const;

function readUtm(): Record<string, string> {
  const out: Record<string, string> = {};
  try {
    const params = new URLSearchParams(window.location.search);
    for (const k of UTM_KEYS) {
      const v = params.get(k);
      if (v) out[k] = v.slice(0, 120);
    }
  } catch {
    // no window or blocked: leave UTMs empty
  }
  return out;
}

/** Same qualification form on all six pages. Residency first: it decides whether a human follows up. */
export function FranceLeadForm({ locale, slug, cta }: { locale: Locale; slug: string; cta: string }) {
  const t = UI[locale];
  const [residency, setResidency] = useState<Residency | ''>('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'ok' | 'error'>('idle');
  const [fieldError, setFieldError] = useState(false);
  const [staying, setStaying] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    // Honeypot: real visitors never fill this.
    if (String(data.get('company_website') ?? '') !== '') return;

    const email = String(data.get('email') ?? '').trim();
    const whatsapp = String(data.get('whatsapp') ?? '').trim();
    const contactConsent = data.get('consent_contact') === 'on';
    const marketingConsent = data.get('consent_marketing') === 'on';
    if (!residency || !email || !contactConsent) {
      setFieldError(true);
      return;
    }
    setFieldError(false);
    setStatus('sending');

    const now = new Date().toISOString();
    const jurisdiction = String(data.get('jurisdiction') ?? 'undecided');
    const qualified = residency !== 'staying_france';

    try {
      const res = await fetch('/api/leads/capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source_tool: 'france_landing',
          email,
          whatsapp_number: whatsapp || undefined,
          tool_input: {
            landing_slug: slug,
            locale,
            residency,
            activity: String(data.get('activity') ?? ''),
            jurisdiction,
            timeline: String(data.get('timeline') ?? ''),
            ...readUtm(),
            contact_consent: true,
            contact_consent_text: t.consentContact,
            // `consent` is the marketing opt-in the PDF requires us to record, with the wording and time.
            consent: marketingConsent,
            consent_text: marketingConsent ? t.consentMarketing : undefined,
            consented_at: now,
          },
          tool_result: { qualified, follow_up: qualified ? 'staff_call' : 'email_explainer_only' },
          signals: {
            primaryInterestJurisdiction: jurisdiction === 'uae' || jurisdiction === 'hong-kong' ? jurisdiction : undefined,
            wantsRelocation: residency === 'moving_12m',
          },
        }),
      });
      if (!res.ok) throw new Error(String(res.status));
      setStaying(!qualified);
      setStatus('ok');
    } catch {
      setStatus('error');
    }
  }

  if (status === 'ok') {
    return (
      <div className={styles.thanks} role="status">
        <h3>{staying ? t.stayTitle : t.okTitle}</h3>
        <p>{staying ? t.stayBody : t.okBody}</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate aria-describedby={fieldError ? 'france-form-error' : undefined}>
      <h2 className={styles.formTitle}>{t.formTitle}</h2>
      <p className={styles.formLead}>{t.formLead}</p>

      <fieldset className={styles.fieldset}>
        <legend>{t.residencyQ}</legend>
        {RESIDENCY.map((r) => (
          <label key={r} className={styles.radio}>
            <input type="radio" name="residency" value={r} checked={residency === r} onChange={() => setResidency(r)} />
            <span>{t.residency[r]}</span>
          </label>
        ))}
      </fieldset>

      <div className={styles.grid2}>
        <div className="field">
          <label htmlFor="fr-activity">{t.activityQ}</label>
          <select id="fr-activity" name="activity" defaultValue="freelance_services">
            {ACTIVITY.map((a) => (
              <option key={a} value={a}>
                {t.activity[a]}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="fr-jur">{t.jurisdictionQ}</label>
          <select id="fr-jur" name="jurisdiction" defaultValue="hong-kong">
            {JURISDICTION.map((j) => (
              <option key={j} value={j}>
                {t.jurisdiction[j]}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="field">
        <label htmlFor="fr-time">{t.timelineQ}</label>
        <select id="fr-time" name="timeline" defaultValue="1_3_months">
          {TIMELINE.map((x) => (
            <option key={x} value={x}>
              {t.timeline[x]}
            </option>
          ))}
        </select>
      </div>
      <p className={styles.note}>{t.restricted}</p>

      <div className={styles.grid2}>
        <div className="field">
          <label htmlFor="fr-email">{t.email}</label>
          <input id="fr-email" name="email" type="email" autoComplete="email" required inputMode="email" />
        </div>
        <div className="field">
          <label htmlFor="fr-wa">
            {t.whatsapp} {t.optional}
          </label>
          <input id="fr-wa" name="whatsapp" type="tel" autoComplete="tel" inputMode="tel" placeholder="+33 6 12 34 56 78" />
        </div>
      </div>

      {/* Honeypot, hidden from people and assistive tech. */}
      <div className={styles.hp} aria-hidden="true">
        <label>
          Website
          <input name="company_website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <label className={styles.check}>
        <input type="checkbox" name="consent_contact" required />
        <span>{t.consentContact}</span>
      </label>
      <label className={styles.check}>
        <input type="checkbox" name="consent_marketing" />
        <span>{t.consentMarketing}</span>
      </label>

      {fieldError && (
        <p id="france-form-error" role="alert" className={styles.error}>
          {t.errorFields}
        </p>
      )}
      {status === 'error' && (
        <p role="alert" className={styles.error}>
          {t.errorGeneric}
        </p>
      )}

      <button type="submit" className="btn btn-primary" disabled={status === 'sending'} style={{ width: '100%' }}>
        {status === 'sending' ? t.sending : cta}
      </button>
    </form>
  );
}
