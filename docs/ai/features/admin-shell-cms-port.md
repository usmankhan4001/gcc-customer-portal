# Feature: Admin shell (port of the gccstartup-cms admin design)

**Slug**: admin-shell-cms-port   **Area**: [admin-operations](../modules/admin-operations.md)   **Status**: working   **Last verified against code**: 2026-11-02

## What it does
`/admin/**` uses the same shell as the gccstartup-cms admin: a slim light sidebar on desktop with a "Day to day" group and a collapsible "Technical" group, a phone header with the page title (and a back arrow on detail pages), a bottom tab bar with a More sheet, and the CMS list, card, form and table styling for page content.

## Files
- `src/app/admin/layout.tsx` - server layout, renders the shell (access is enforced by `src/middleware.ts`).
- `src/app/admin/AdminLayoutShell.tsx` - client shell (sidebar, header, bottom bar, More sheet, logout).
- `src/app/admin/admin-nav.ts` - the one nav list: sidebar, bottom-bar tabs and titles all derive from it. To add an admin page, add one entry here.
- `src/styles/admin/*.css` - the CMS admin stylesheets, vendored unchanged from the CMS repo (`admin.css`, `admin-shell.css`, `admin-responsive.css`, `admin-lists.css`, `admin-pages.css`). Imported in `src/styles/globals.css` inside Tailwind's `components` layer, so Tailwind utilities still win.

## Rules
- Pages put their content directly inside the shell (`.admin-main-inner`); use CMS classes (`admin-page`, `admin-table`, `admin-card-stack`, `admin-form-*`, `admin-tabs`, ...) rather than new Tailwind layouts, so admin pages stay consistent and phone-friendly.
- Day items that have a `tab` label appear in the bottom bar and are hidden from the More sheet (CMS behaviour).
- Left out of the port: the CMS command search (⌘K), install prompts and toast provider.
- The old "Staff Settings" link pointed at a page that does not exist and was dropped.

## Tests
None for the shell itself (visual). `npm run verify` covers build and typecheck. Checked in a browser at phone (375px), tablet (800px) and desktop (1280px) widths.

## Known gaps
Page content of the five admin pages still uses the older layouts (wide tables overflow on phones) until each page is restyled.
