# Feature: PWA manifest and service worker

**Slug**: pwa-and-service-worker   **Area**: [platform-and-infra](../modules/platform-and-infra.md)   **Status**: partial   **Last verified against code**: 2026-10-30

## What it does
The app ships a web app manifest, icons and a hand-written service worker (`public/sw.js`) that precaches a few assets, caches pages for offline fallback and handles Web Push display. The manifest and icons are live (linked from the root layout), so a browser can offer "install". The service worker is never registered, so offline caching and push display are inactive. There is no custom install prompt.

## Entry points
- Browser reads `/manifest.json` via `metadata.manifest` (`src/app/layout.tsx:9`).
- `/sw.js` is served statically from `public/` and is public in middleware (`src/middleware.ts:12`), but nothing requests it.
- Icon generation: `node scripts/generate-icons.js` (manual, broken as located).

## Files
- `public/manifest.json` (84 lines) - manifest.
- `public/sw.js:1-131` - install/activate/fetch/push/notificationclick.
- `src/components/layout/ServiceWorkerRegistration.tsx:1-20` - `navigator.serviceWorker.register('/sw.js')`, logs success/failure. Grep for imports of it in `src/` finds none; `src/components/layout/Providers.tsx` renders only `PostHogInit`, `Toaster`, children. Reported-never-mounted claim is CONFIRMED.
- `src/app/layout.tsx:5-47` - metadata (`manifest`, `icons`, `appleWebApp`), viewport `themeColor '#0A2540'` (line 25), manual apple meta tags in `<head>`.
- `public/icons/icon-{72,96,128,144,152,192,384,512}.png`, `icon-192.svg` (unused), `public/favicon.ico` (tracked), `src/app/icon.png` (tracked); `src/app/favicon.ico` does NOT exist.
- `scripts/generate-icons.js:1-51` - sharp-based generator.

## Request / response contract
No API. Static assets only. Middleware lets `/icons/`, `/manifest.json`, `/sw.js`, `/favicon.ico`, `/icon.png` through unauthenticated (`middleware.ts:5-14`).

## Step-by-step flow
1. Manifest: `name 'GCCStartup — Global Company Formation'`, `short_name 'GCCStartup'`, `start_url '/'`, `scope '/'`, `display 'standalone'`, `orientation 'portrait-primary'`, `background_color '#F9F6F0'`, `theme_color '#14204A'`, 8 PNG icons each `purpose:"any maskable"`, `categories [business, finance]`, `screenshots []`, 3 shortcuts (`/tools/tax-calculator`, `/tools`, `/dashboard`) all using `icon-96.png`.
2. If the registration component were mounted: `install` opens `gccstartup-static-v1` and `cache.addAll(['/', '/manifest.json', '/icons/icon-192.png', '/icons/icon-512.png'])` (one failing URL rejects the whole install), then `skipWaiting()`. `activate` deletes every cache key except `gccstartup-static-v1` and `gccstartup-dynamic-v1`, then `clients.claim()`. `CACHE_NAME='gccstartup-v1'` (`sw.js:1`) is unused.
3. `fetch` handler (`:37-87`): non-GET -> not intercepted. `/api*` or cross-origin -> `respondWith(fetch(request).catch(() => new Response('Offline',{status:503})))` (this also wraps PostHog and R2 presigned downloads). Navigations -> network-first; every response (any status, including redirects and errors) is cloned into `gccstartup-dynamic-v1`; on network failure serve cached page or cached `/`. Everything else same-origin GET -> cache-first, then network, caching `response.ok`.
4. Push display: see [web-push](web-push.md) (`sw.js:90-131`).

## Data
Browser Cache Storage only: `gccstartup-static-v1`, `gccstartup-dynamic-v1`. No server state. Nothing is versioned beyond the cache name suffix `v1`; entries are never expired or size-limited.

## Business rules and constants
- Theme colour mismatch: manifest `#14204A` vs viewport `#0A2540` (`layout.tsx:25`) vs email navy `#0A2540`; AGENTS.md says navy `#14204A`.
- All manifest icons claim `maskable` although they are rounded-rect artwork with the "G"/"STARTUP" text near edges (generator `generate-icons.js:12-17`); maskable cropping can clip text (visual, unverified).
- Offline experience is "whatever was cached or the home page"; there is no offline page.

## Auth, permissions, security
- If registered, authenticated HTML (dashboard, vault, notifications) would be stored in `gccstartup-dynamic-v1` and never cleared on logout (`LogoutButton`/logout API do not touch caches). On a shared device, going offline could show a previous user's pages. Cache-first for non-navigation GETs could also serve stale RSC payloads for the same URL (Vary handling not verified).
- `next.config.mjs` sets no headers for `/sw.js` (no `Cache-Control: no-cache`, no `Service-Worker-Allowed`), so update propagation relies on browser defaults (unverified).
- Not an AGENTS.md protected file, but `Dockerfile`/CI are.

## Failure modes and edge cases
- Currently inert: `navigator.serviceWorker.ready` never resolves, which also hangs `PushNotificationToggle` (see web-push).
- Install prompt: no `beforeinstallprompt`/`appinstalled` handling anywhere (grep of `src`, `public`). Whether Chrome/Edge show the native install affordance without a registered SW is browser-version dependent (unverified); Safari iOS uses the manual apple meta tags.
- `scripts/generate-icons.js` is broken as located: it resolves `path.join(__dirname,'public','icons')` where `__dirname` is `scripts/`, so PNGs land in `scripts/public/icons`, and the later write to `scripts/src/app/favicon.ico` fails with ENOENT (swallowed by `.catch(console.error)` at `:51`). Icons currently committed in `public/icons` were produced some other way. Its colours (`#14204A` background, orange `#F26522` G) differ from the AGENTS.md gold.
- `addAll` with `/` redirecting for logged-in users would still succeed; an HTTP error on any listed URL fails install.

## Tests
None. Worth writing:
1. Unit: parse `public/manifest.json` and assert every `src` exists on disk, sizes match file dimensions, `start_url` is `/` (guards icon drift).
2. Component: render `Providers` and assert `navigator.serviceWorker.register` called with `/sw.js` (jsdom stub) once registration is wired.
3. SW logic via `service-worker-mock` or a Node harness: `/api/x` offline -> 503 `Offline`; navigation offline with a cached entry -> cached HTML; unauthenticated route list excluded from cache (after fix).
4. Script: run the icon generator against a temp dir (after fixing paths) and assert 8 PNGs + favicon exist.
5. Playwright (manual): Lighthouse PWA audit passes after registering the SW.

## Known bugs and gaps
- `ServiceWorkerRegistration` not mounted (`Providers.tsx`), so PWA offline and Web Push are dead.
- `sw.js` caches authenticated pages and all statuses; `CACHE_NAME` unused; wraps cross-origin requests in 503 fallbacks.
- `generate-icons.js` writes to the wrong folders.
- Theme colour inconsistency; all icons marked `maskable`; `icon-192.svg` unused; no `beforeinstallprompt` UI.

## Change guide
- Activate: add `<ServiceWorkerRegistration />` to `Providers.tsx` ONLY after (a) excluding `/dashboard`, `/vault`, `/profile`, `/notifications`, `/checkout`, `/admin`, `/api` from the navigation cache or caching only the offline shell, (b) clearing caches on logout (`caches.keys()` delete + `postMessage`), (c) bumping cache names (`-v2`) so `activate` purges old entries.
- Fix the generator: use `path.join(__dirname, '..', 'public', ...)`; keep `sharp` as a devDependency (standalone image does not need it).
- Keep manifest, `layout.tsx` viewport and `generate-icons.js` colours in sync; add separate maskable icons with safe padding.
- Android/FCM readiness: in a Capacitor app (`capacitor://` or `https://localhost` origin) do not register this service worker; guard with `Capacitor.isNativePlatform()`. Push moves to native FCM (see [web-push](web-push.md)). The manifest is still used for the browser/TWA install path. Bundled-asset Capacitor builds cannot use the `gcc_session` cookie flow cross-origin, so token auth is a prerequisite.

## Related features
[web-push](web-push.md), [session-and-route-guard](session-and-route-guard.md), [deploy-and-ci](deploy-and-ci.md), [client-dashboard](client-dashboard.md), [profile-and-support](profile-and-support.md)
