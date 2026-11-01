# CMS admin UI: how to build an admin page

The portal's `/admin/**` uses the gccstartup-cms admin design (see `docs/ai/features/admin-shell-cms-port.md`). The stylesheets are in `src/styles/admin/*.css` (read them for the exact rules) plus the older shared classes in `src/styles/components.css`. Build pages with these classes and the `PageHeader` component, not new Tailwind layouts. Everything must work at 375px wide (phone) and 1280px (desktop).

## Page skeleton
```tsx
import { PageHeader } from '@/components/admin/PageHeader';

<div className="wrap admin-page">
  <PageHeader eyebrow="Operations" title="Leads" subtitle="One sentence on what this page is for." actions={<button className="btn btn-primary">Add</button>} />
  {/* toolbar, then one of: loading, error, empty, content */}
</div>
```
`wrap admin-page` is the page container (the shell already provides `.admin-main-inner`). One `<h1>` per page, from `PageHeader`.

## States
- Loading: `<div className="admin-state" role="status">Loading leads…</div>`
- Error: `<div className="cl-empty is-error" role="alert"><p>Could not load leads. Check your connection and try again.</p></div>`
- Empty: `<div className="cl-empty"><p>No leads yet.</p></div>`

## Toolbar (search and filters)
`<div className="cl-toolbar">` containing `<label className="cl-search"><svg/> <input .../></label>`, `<select>` filters, and filter chips (`cl-chips` wrapping `cl-chip` buttons; add `is-active` for the selected one). Inside a card use `admin-table-card` around toolbar and table.

## Tables (they become stacked cards on phones automatically)
```tsx
<div className="admin-table-wrap">
  <table className="admin-table">
    <thead><tr><th>Contact</th><th className="hide-phone">Source</th><th className="is-right">Amount</th></tr></thead>
    <tbody>
      <tr className="is-link" tabIndex={0} onClick={...}>
        <td>…</td><td className="hide-phone">…</td><td className="is-right">…</td>
      </tr>
    </tbody>
  </table>
</div>
```
Mark secondary columns `hide-phone` (hidden on phones); first cell is the card title. Row actions go in a last `<td className="cl-cell-menu">` with `cl-icon-btn` buttons. Make clickable rows keyboard accessible.

## Other building blocks
- Badges: `badge` plus `badge-accent` (orange), `badge-info` (blue), `badge-success` (green), `badge-danger` (red). One mapping function from status to badge, unit-tested.
- Cards: `card`; stat cards in `<div className="admin-metrics-grid">` (one `card` per metric).
- Sections inside a page: `admin-section-head` for a heading row with an optional link; `admin-callout` / `admin-banner` for notices.
- Forms: `admin-form-card` > `admin-form-stack` with `admin-form-grid-2` for two columns, `admin-form-actions` for the buttons; note text in `admin-form-note`.
- Tabs: `admin-tabs` containing `admin-tab` buttons (add `active`).
- Pagination: `admin-pager`. Modals: `admin-modal` family (see `admin.css`).
- Buttons: `btn`, `btn-primary`. Colors and spacing only from CSS variables in `src/styles/tokens.css` (`var(--orange)`, `var(--space-4)`, ...); no hard-coded hex.

## Rules for a restyle
- Behavior does not change: same API calls, same data, same actions, same permissions. Move pure logic (formatting, filtering, status to badge mapping) into `src/lib/admin-ui/<page>.ts` with a unit test.
- Keep every existing interactive control reachable on a phone (tap targets at least 44px come from the CSS).
- No new dependencies, no new global CSS (add page-specific rules to a CSS module or use the existing classes).
