'use client'

import { useEffect } from 'react'
import Script from 'next/script'
import { useCookieConsent } from '@/components/consent/CookieConsent'
import { COOKIE_CONSENT_VERSION } from '@/lib/cookie-consent'

type Gtag = (...args: unknown[]) => void
type Fbq = (...args: unknown[]) => void

declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: Gtag
    fbq?: Fbq
    __gccGoogleConsentDefaulted?: boolean
    __gccMetaInitialized?: boolean
    __gccMetaPageViewTracked?: boolean
  }
}

type ConsentGatedAnalyticsProps = {
  ga4Id: string | null
  gtmId: string | null
  metaPixelId: string | null
}

export function ConsentGatedAnalytics({ ga4Id, gtmId, metaPixelId }: ConsentGatedAnalyticsProps) {
  const { choice, ready } = useCookieConsent()
  const analyticsGranted = ready && choice?.analytics === true
  const advertisingGranted = ready && choice?.advertising === true
  const hasGoogleTag = Boolean(ga4Id || gtmId)

  useEffect(() => {
    if (!hasGoogleTag) return

    window.dataLayer = window.dataLayer || []
    window.gtag = window.gtag || function gtag(...args: unknown[]) {
      window.dataLayer?.push(args)
    }

    if (!window.__gccGoogleConsentDefaulted) {
      window.gtag('consent', 'default', {
        analytics_storage: 'denied',
        ad_storage: 'denied',
        ad_user_data: 'denied',
        ad_personalization: 'denied',
        functionality_storage: 'granted',
        security_storage: 'granted',
        wait_for_update: 500,
      })
      window.__gccGoogleConsentDefaulted = true
    }

    const state = {
      necessary: 'granted',
      analytics: analyticsGranted ? 'granted' : 'denied',
      advertising: advertisingGranted ? 'granted' : 'denied',
      version: COOKIE_CONSENT_VERSION,
    }
    window.gtag('consent', 'update', {
      analytics_storage: state.analytics,
      ad_storage: state.advertising,
      ad_user_data: state.advertising,
      ad_personalization: state.advertising,
    })
    window.dataLayer.push({ event: choice ? 'gcc_consent_update' : 'gcc_consent_default', gcc_consent: state })
  }, [advertisingGranted, analyticsGranted, choice, hasGoogleTag])

  useEffect(() => {
    if (!window.fbq) return
    window.fbq('consent', advertisingGranted ? 'grant' : 'revoke')
  }, [advertisingGranted])

  return (
    <>
      {analyticsGranted && gtmId && (
        <Script id="gtm-base" data-container-id={gtmId} strategy="afterInteractive">
          {`(function(w,d,s,l){var e=d.getElementById('gtm-base'),i=e&&e.dataset.containerId;if(!i)return;w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+encodeURIComponent(i)+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer');`}
        </Script>
      )}

      {analyticsGranted && ga4Id && (
        <>
          <Script id="ga4-library" src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(ga4Id)}`} strategy="afterInteractive" />
          <Script id="ga4-base" data-measurement-id={ga4Id} strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];window.gtag=window.gtag||function(){dataLayer.push(arguments)};var e=document.getElementById('ga4-base'),i=e&&e.dataset.measurementId;if(i){gtag('js',new Date());gtag('config',i,{send_page_view:true});}`}
          </Script>
        </>
      )}

      {advertisingGranted && metaPixelId && (
        <Script id="meta-pixel-base" data-pixel-id={metaPixelId} strategy="afterInteractive">
          {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');var e=document.getElementById('meta-pixel-base'),i=e&&e.dataset.pixelId;if(i){if(!window.__gccMetaInitialized){fbq('init',i);window.__gccMetaInitialized=true}fbq('consent','grant');if(!window.__gccMetaPageViewTracked){fbq('track','PageView');window.__gccMetaPageViewTracked=true}}`}
        </Script>
      )}
    </>
  )
}