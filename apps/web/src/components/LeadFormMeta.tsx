'use client'

import { useEffect, useRef, useState } from 'react'

type TurnstileApi = {
  render: (container: HTMLElement, options: { sitekey: string; action: string; callback: (token: string) => void; 'expired-callback': () => void }) => string
  remove: (widgetId: string) => void
}

declare global {
  interface Window {
    turnstile?: TurnstileApi
  }
}

let turnstileScript: Promise<void> | null = null

function loadTurnstile() {
  if (window.turnstile) return Promise.resolve()
  if (turnstileScript) return turnstileScript
  turnstileScript = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-gcc-turnstile]')
    const script = existing ?? document.createElement('script')
    script.addEventListener('load', () => resolve(), { once: true })
    script.addEventListener('error', () => reject(new Error('Turnstile failed to load')), { once: true })
    if (!existing) {
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
      script.async = true
      script.defer = true
      script.dataset.gccTurnstile = 'true'
      document.head.appendChild(script)
    }
  })
  return turnstileScript
}

export function buildLeadPayload(form: HTMLFormElement): Record<string, FormDataEntryValue | boolean | number> {
  const fields = Object.fromEntries(new FormData(form).entries()) as Record<string, FormDataEntryValue | boolean | number>
  const token = fields['cf-turnstile-response']
  const hasConsentControl = Boolean(form.elements.namedItem('emailConsent'))
  delete fields['cf-turnstile-response']
  return {
    ...fields,
    ...(hasConsentControl ? { emailConsent: fields.emailConsent === 'true' } : {}),
    startedAt: Number(fields.startedAt),
    ...(typeof token === 'string' && token ? { turnstileToken: token } : {}),
  }
}

/** Shared anti-bot signals plus explicit, unchecked marketing consent. */
export function LeadFormMeta({ emailConsent = false }: { emailConsent?: boolean }) {
  const [startedAt, setStartedAt] = useState('')
  const [config, setConfig] = useState<{ siteKey: string | null; policyVersion: string }>({ siteKey: null, policyVersion: 'privacy-2026-08-01' })
  const [turnstileToken, setTurnstileToken] = useState('')
  const widgetContainer = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setStartedAt(String(Date.now()))
    fetch('/api/lead', { headers: { Accept: 'application/json' } })
      .then((response) => (response.ok ? response.json() : null))
      .then((value) => {
        if (value && typeof value.policyVersion === 'string') {
          setConfig({ siteKey: typeof value.turnstileSiteKey === 'string' ? value.turnstileSiteKey : null, policyVersion: value.policyVersion })
        }
      })
      .catch(() => undefined)
  }, [])

  useEffect(() => {
    if (!config.siteKey || !widgetContainer.current) return
    let widgetId: string | undefined
    let cancelled = false
    loadTurnstile()
      .then(() => {
        if (!cancelled && window.turnstile && widgetContainer.current) {
          widgetId = window.turnstile.render(widgetContainer.current, {
            sitekey: config.siteKey!,
            action: 'lead_submit',
            callback: setTurnstileToken,
            'expired-callback': () => setTurnstileToken(''),
          })
        }
      })
      .catch(() => undefined)
    return () => {
      cancelled = true
      if (widgetId && window.turnstile) window.turnstile.remove(widgetId)
    }
  }, [config.siteKey])

  return (
    <>
      <div aria-hidden="true" style={{ position: 'absolute', left: '-10000px', width: 1, height: 1, overflow: 'hidden' }}>
        <label>
          Leave this field empty
          <input name="website" type="text" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      <input type="hidden" name="startedAt" value={startedAt} readOnly />
      <input type="hidden" name="consentPolicyVersion" value={config.policyVersion} readOnly />
      <input type="hidden" name="turnstileToken" value={turnstileToken} readOnly />
      {config.siteKey && <div ref={widgetContainer} style={{ marginBottom: 'var(--space-4)' }} />}
      {emailConsent && (
        <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: 'var(--text-secondary)', marginBottom: 'var(--space-4)' }}>
          <input type="checkbox" name="emailConsent" value="true" style={{ marginTop: 3 }} />
          <span>
            Email me occasional GCC Startup news and offers. Optional; unsubscribe anytime. See our <a href="/privacy">privacy policy</a>.
          </span>
        </label>
      )}
    </>
  )
}