# Crypto Mining Miles — Admin Panel Plan

> **Purpose:** A standalone Next.js app at `admin.cryptominingmiles.in` that lets non-developers edit every piece of content rendered by `crypto_mining_frontend`. Theme matches the marketing site — same mint/navy/cream tokens, same Space Grotesk + Inter + JetBrains Mono — so the admin feels like the editorial back office of the same brand, not a generic SaaS template.

---

## 0. Document layout (read in order)

1. Tech stack & non-negotiables
2. Theming — exact tokens reused from the frontend
3. Folder structure
4. Routing & screen list
5. Page-by-page UI specification
6. Data fetching & state
7. Auth flow
8. Forms, validation, autosave
9. Media library UX
10. Permissions matrix
11. Empty / loading / error / success patterns
12. Dev workflow
13. Build order

> **NOTE:** the admin reads/writes the API documented in `crypto_mining_backend/BACKEND_PLAN.md`. Everything below assumes those endpoints. If a backend endpoint changes, update both docs together.

---

## 1. Tech stack & non-negotiables

| Concern | Choice | Why |
|---|---|---|
| Framework | **Next.js 14.2.x** (App Router) | Same major version as frontend, shared mental model, RSC for fast page shells |
| Language | **TypeScript 5.x** strict | |
| Styling | **CSS variables + Tailwind 3.4** + the frontend's `globals.css` token block | Identical visual language to the marketing site |
| UI primitives | **Radix UI** (Dialog, Dropdown, Tabs, Toast, Tooltip, Switch) | Unstyled, accessible — we paint them with our tokens |
| Icons | **lucide-react** | Clean line set, pairs with the editorial typography |
| Forms | **react-hook-form + zod + @hookform/resolvers/zod** | Sharing zod schemas with backend keeps validation in lockstep |
| Tables | **@tanstack/react-table** | Headless, full TS, sorting/filtering/pagination |
| Data fetching | **@tanstack/react-query** | Cache invalidation per resource, optimistic updates, mutation states |
| Drag-reorder | **@dnd-kit/core + @dnd-kit/sortable** | For ordering products/plans/FAQ rows |
| Rich text | **Tiptap** (headless ProseMirror) | For long-form fields like product `tagline`, FAQ answers |
| Toasts | **sonner** | One-line API, matches our minimal aesthetic |
| Charts (later) | **recharts** | For lead/ticket dashboards |
| Date | **date-fns** | Tree-shakeable |
| Cookies / auth | Reuse backend's HTTP-only cookie session via `credentials: 'include'` fetch | No client-side token storage, no XSS attack surface |
| Image upload | Direct multipart POST to `/api/v1/admin/media/upload`, render Cloudinary URLs | |

**Non-negotiables:**

- **No CSS framework lock-in** — Tailwind for layout utilities only; all colors/typography come from the same `--mint-*`, `--navy-*`, `--cream*` tokens declared in the frontend.
- **No `any`** in app code outside narrow `catch` blocks.
- **Every form is autosave-aware**: optimistic updates with rollback on error; explicit "Save" button always shown for clarity, but background autosave kicks in 2 s after last edit.
- **Every list view supports**: search, filter, sort, paginate, bulk actions, inline status edit.
- **Every editor mirrors the frontend layout** so the admin feels like editing in place, not abstract JSON. (See screen specs below.)
- **Live preview pane** for page editors (HomePage, ContactPage, ServicePage, etc.) showing the rendered result with current edits via an iframe to the frontend dev URL with `?preview=<draft-id>`.

---

## 2. Theming — exact reuse from the frontend

Copy `crypto_mining_frontend/app/globals.css` token block verbatim into `crypto_mining_admin/app/globals.css`. The admin's "design system" *is* the frontend's design system — the only thing the admin adds is layout chrome.

### 2.1 Tokens (do not redefine — copy from frontend)

```css
:root {
  --mint-50:  #F4FBE8;
  --mint-100: #E8F7D4;
  --mint-200: #D4F0B0;
  --mint-300: #B8E68A;
  --mint-400: #A8E063;
  --mint-500: #8FCB48;
  --cream:    #FBFBF3;
  --cream-2:  #F5F4E8;
  --navy-900: #0A1628;
  --navy-800: #0F1F38;
  --navy-700: #1A2D4A;
  --navy-500: #3B4A66;
  --navy-300: #6B7A8F;
  --ink:      #0A1628;
  --radius:    14px;
  --radius-lg: 22px;
  --font-display: 'Space Grotesk', sans-serif;
  --font-body:    'Inter', system-ui, sans-serif;
  --font-mono:    'JetBrains Mono', monospace;
}
```

### 2.2 Admin-specific design rules

- **Sidebar**: `var(--navy-900)` background, mint dot indicator next to active route, mono labels in `letter-spacing: 0.15em` uppercase (matches the frontend's section tags).
- **Top bar**: `var(--cream)` background, search on left, environment pill (`PROD` / `STAGING` / `DEV`) on right, user avatar/menu far right.
- **Cards**: `var(--cream-2)` background, `1px solid rgba(10,22,40,0.08)`, `--radius-lg` corners — same as `mag-card` style on the frontend.
- **Primary button**: identical to frontend `.btn-primary` (navy bg, mint text, dot prefix). Reuse the class.
- **Section tags**: small mono labels with mint dot — used to label every form section and keep the editorial feel consistent.
- **Status pills**: mint for success/published, amber (`#E8B547`) for warning/draft, navy for neutral, soft red (`#EF5350`) for danger/error. Pill = pill-style `padding: 5px 12px; border-radius: 999px; font-family: var(--font-mono); font-size: 10px; text-transform: uppercase`.
- **Empty states**: large mono `// no data yet` line + optional illustration glyph + a primary CTA. Same vibe as the frontend's "No miners in this category yet."
- **Loading**: skeletons in `cream-2` with subtle shimmer; never blank white.
- **Errors**: inline below field (mono red), or a sonner toast for global failures.

### 2.3 Component mapping (frontend → admin parity)

| Frontend element | Admin reuse |
|---|---|
| `.btn-primary`, `.btn-ghost`, `.dot` | Copy the CSS verbatim, reuse |
| `.section-tag` | Reuse as form section header |
| `.dotgrid`, glow blob | Use sparingly — login screen, dashboard hero card |
| `--font-display` for headings, `--font-mono` for labels and metadata | Identical hierarchy |
| Input style from `contact/page.tsx` | Lift into `<TextField />` primitive |
| Stat boxes (`StatBox` in profitability) | Reuse for dashboard metrics |
| Timeline component (`Timeline` in track-ticket) | Reuse for ticket detail view in admin |
| Pulse dot | Reuse for "live" / "syncing" indicators |

---

## 3. Folder structure

```
crypto_mining_admin/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   ├── forgot-password/page.tsx
│   │   └── reset-password/[token]/page.tsx
│   ├── (admin)/                    # protected by middleware.ts
│   │   ├── layout.tsx              # sidebar + topbar
│   │   ├── page.tsx                # /admin → redirects to /dashboard
│   │   ├── dashboard/page.tsx
│   │   ├── content/
│   │   │   ├── home/page.tsx
│   │   │   ├── shop/page.tsx
│   │   │   ├── profitability/page.tsx
│   │   │   ├── contact/page.tsx
│   │   │   ├── service-request/page.tsx
│   │   │   ├── track-ticket/page.tsx
│   │   │   ├── nav/page.tsx
│   │   │   └── footer/page.tsx
│   │   ├── products/
│   │   │   ├── page.tsx                  # list
│   │   │   ├── new/page.tsx              # create
│   │   │   └── [id]/page.tsx             # edit
│   │   ├── plans/
│   │   │   ├── page.tsx
│   │   │   ├── new/page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── leads/
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── tickets/
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── media/page.tsx
│   │   ├── settings/
│   │   │   ├── page.tsx                  # site settings
│   │   │   ├── seo/page.tsx
│   │   │   ├── users/page.tsx            # super-admin only
│   │   │   └── audit-log/page.tsx
│   │   └── account/page.tsx              # current user profile
│   ├── api/
│   │   └── auth/                          # thin Next route handlers that proxy to backend if cross-domain cookies need help (optional)
│   ├── layout.tsx                         # root: fonts, providers
│   ├── globals.css                        # token block + admin shell styles
│   └── icon.svg
├── components/
│   ├── shell/
│   │   ├── Sidebar.tsx
│   │   ├── Topbar.tsx
│   │   ├── EnvironmentPill.tsx
│   │   ├── UserMenu.tsx
│   │   ├── Breadcrumb.tsx
│   │   └── PageHeader.tsx
│   ├── primitives/
│   │   ├── Button.tsx
│   │   ├── TextField.tsx
│   │   ├── TextArea.tsx
│   │   ├── Select.tsx
│   │   ├── Switch.tsx
│   │   ├── Pill.tsx
│   │   ├── SectionTag.tsx
│   │   ├── Card.tsx
│   │   ├── EmptyState.tsx
│   │   ├── Skeleton.tsx
│   │   ├── DataTable.tsx
│   │   ├── ConfirmDialog.tsx
│   │   ├── Toast.tsx
│   │   └── PreviewFrame.tsx
│   ├── editors/
│   │   ├── HomePageEditor.tsx
│   │   ├── ContactPageEditor.tsx
│   │   ├── ProfitabilityPageEditor.tsx
│   │   ├── ServiceRequestPageEditor.tsx
│   │   ├── ShopPageEditor.tsx
│   │   ├── TrackTicketPageEditor.tsx
│   │   ├── ProductEditor.tsx
│   │   ├── PlanEditor.tsx
│   │   ├── FaqListEditor.tsx
│   │   ├── StepListEditor.tsx
│   │   ├── FeatureListEditor.tsx
│   │   ├── StatsListEditor.tsx
│   │   ├── ContactMethodsEditor.tsx
│   │   ├── NavLinksEditor.tsx
│   │   └── RichTextEditor.tsx          # Tiptap wrapper
│   ├── lists/
│   │   ├── ProductsTable.tsx
│   │   ├── PlansTable.tsx
│   │   ├── LeadsTable.tsx
│   │   ├── TicketsTable.tsx
│   │   ├── UsersTable.tsx
│   │   └── AuditLogTable.tsx
│   └── media/
│       ├── MediaPicker.tsx
│       ├── MediaUploadArea.tsx
│       └── MediaGrid.tsx
├── lib/
│   ├── api.ts                            # fetch wrapper, includes credentials
│   ├── queryClient.ts
│   ├── auth.ts                           # current user helper, role checks
│   ├── env.ts
│   ├── format.ts                         # currency, dates, hashrate
│   ├── slug.ts
│   ├── zod-resolver.ts                   # rhf+zod glue
│   └── routes.ts                         # central route map
├── hooks/
│   ├── useAuth.ts
│   ├── useCurrentUser.ts
│   ├── useAutosave.ts
│   ├── useTablePager.ts
│   ├── useToast.ts
│   └── useConfirm.ts
├── schemas/                              # zod schemas mirroring backend validators
│   ├── product.schema.ts
│   ├── plan.schema.ts
│   ├── home.schema.ts
│   ├── contact.schema.ts
│   ├── profitability.schema.ts
│   ├── service.schema.ts
│   ├── lead.schema.ts
│   ├── ticket.schema.ts
│   ├── user.schema.ts
│   └── siteSettings.schema.ts
├── types/
│   └── api.ts                            # typed responses matching backend
├── middleware.ts                         # redirects unauthenticated to /login
├── public/
├── .env.example
├── package.json
├── tailwind.config.ts                    # imports tokens, sets fonts
├── tsconfig.json
├── next.config.js
└── README.md
```

**Run on port 3002** (`next dev -p 3002`) so frontend (3001) and admin (3002) can run side-by-side locally.

---

## 4. Routing & screen list

| Path | Screen | Role |
|---|---|---|
| `/login` | Login | public |
| `/forgot-password`, `/reset-password/[token]` | Password reset flow | public |
| `/dashboard` | Overview — counts, recent leads, recent tickets, latest audit entries | any admin |
| `/content/home` | HomePage editor (Hero, StatsMarquee, StatsGrid, WhyUs, HowItWorks, FAQ, FooterCTA — sectioned tabs) | editor+ |
| `/content/shop` | ShopPage editor (filters, GST note, trust strip, hero) | editor+ |
| `/content/profitability` | ProfitabilityPage editor (miners, network params, FAQ, hero) | editor+ |
| `/content/contact` | ContactPage editor (methods, facility, subjects, stats, hero) | editor+ |
| `/content/service-request` | ServiceRequestPage editor (why card, issue types, priority levels, hero) | editor+ |
| `/content/track-ticket` | TrackTicketPage editor (copy strings, hero) | editor+ |
| `/content/nav` | Nav links + footer quick links | editor+ |
| `/content/footer` | Footer copy + social | editor+ |
| `/products` | Products table (list / search / filter / sort / drag-reorder / bulk publish-unpublish) | editor+ |
| `/products/new` | Create product (full editor) | editor+ |
| `/products/[id]` | Edit product (full editor) | editor+ |
| `/plans` | Plans table | editor+ |
| `/plans/new`, `/plans/[id]` | Plan editor | editor+ |
| `/leads` | Leads inbox (table) | support+ |
| `/leads/[id]` | Lead detail + notes | support+ |
| `/tickets` | Tickets table | support+ |
| `/tickets/[id]` | Ticket detail (timeline editor — reuse frontend `Timeline`, with add-step / mark-active controls) | support+ |
| `/media` | Media library | editor+ |
| `/settings` | Site settings (brand, contact, facility, social, footer, live counters, SEO defaults) | editor+ |
| `/settings/seo` | Per-page SEO overrides | editor+ |
| `/settings/users` | Users CRUD | super-admin |
| `/settings/audit-log` | Audit log viewer | super-admin |
| `/account` | Current user profile + change password | any |

---

## 5. Page-by-page UI specification

> Common pattern: every page has a `PageHeader` (breadcrumb + title + actions like "Save" / "Publish" / "New"), a body, and a sticky bottom save-bar when there are unsaved changes.

### 5.1 Login (`/login`)

- Centered card on `var(--cream)` background with mint dot grid behind.
- Logo + brand mark at top (reuse `LogoMark` component).
- Form: email, password.
- Errors inline. Lockout message after 5 fails.
- "Forgot password" link below the button.
- Subtle floating mint coin — same vibe as the frontend Hero — to keep brand cohesion.

### 5.2 Dashboard (`/dashboard`)

Grid of stat cards (reuse `StatBox` style):
- Total products (published / draft)
- Total plans
- Open leads (24h / 7d / all)
- Open tickets by priority (color-coded pills)
- Last 5 leads + last 5 tickets (mini-tables linking to detail)
- Last 10 audit log entries (super-admin only)

### 5.3 HomePage editor (`/content/home`)

Two-column layout:

- **Left:** sectioned form (vertical tab list — Hero / StatsMarquee / StatsGrid / WhyUs / HowItWorks / FAQ / FooterCTA). Each tab opens the matching subform. Add/remove/reorder rows via drag handles.
- **Right:** sticky `PreviewFrame` showing `https://localhost:3001?preview=draft` with current changes injected via postMessage.
- Top bar shows unpublished-changes badge ("● 3 unsaved fields") and "Publish" button. Autosave drafts every 2 s; "Publish" promotes draft → live document.

### 5.4 Product editor (`/products/new`, `/products/[id]`)

Tabbed editor mirroring the product detail page sections so the editor's mental model = the public page:

1. **Overview** — slug (auto-suggest from name), name, shortName, subName, edition, sku, tag (dropdown of common: BESTSELLER, POPULAR, GPU MINING, NEW, HIGH ROI, LITECOIN, custom), algo (dropdown), stock, available toggle, isPublished toggle, sortOrder.
2. **Pricing** — pricePaise (number with ₹ live preview), silencerPricePaise.
3. **Performance specs** — table editor for `specs.performance` (key/value rows, drag to reorder).
4. **Power specs** — same.
5. **Physical specs** — same.
6. **Connectivity specs** — same.
7. **Top-card stats** — hashrate, hashrateNum, hashrateUnit, power, powerNum, efficiency, efficiencyNum, noise, noiseNum, contract.
8. **Tagline** — multi-line, max 280 chars (Tiptap with bold/italic only).
9. **Box contents** — list editor for `boxItems[]` (icon, label, sub).
10. **Electrical requirements** — table editor for `electricalReqs`.
11. **Media** — hero image picker + gallery picker (drag-reorder, alt text inline).
12. **Related products** — multi-select picker (slug-based).
13. **SEO** — title, description, og image picker.

Right-side `PreviewFrame` showing `/shop/[slug]?preview=draft`.

### 5.5 Plan editor (`/plans/new`, `/plans/[id]`)

Single column form (small surface):
- slug, tag, name, currency (USD/INR), price (live converted preview to the other currency), hashrate, duration, durationMonths (auto-derived), featured toggle, features list (drag-reorder), cta label/href, sortOrder, isPublished.

### 5.6 Leads (`/leads`)

`DataTable` columns: `Created`, `Name`, `Email`, `Subject`, `Status` (inline pill dropdown), `Assigned`, `Source`. Filters: status, date range, free-text. Bulk actions: mark spam / assign / export CSV. Row click → `/leads/[id]`.

Detail view: header card (name, email, phone, subject pill), full message, timestamps, IP/UA, status changer, assignee picker, notes thread (append-only, monospace timestamps).

### 5.7 Tickets (`/tickets`, `/tickets/[id]`)

List view: `Ticket ID`, `Customer`, `Issue type`, `Priority` (pill), `Status` (pill), `ETA`, `Assigned`, `Updated`. Sort default by `updatedAt` desc.

Detail view (the marquee admin screen):
- **Header card** — same dark navy block as the public ticket page. Editable: status, ETA (date+time picker), priority, assignedTo.
- **Timeline editor** — reuse the public `Timeline` component but in edit mode: drag steps to reorder; click any step to edit label/desc/time/done/active flags; "Add step" button below the last step. "Mark next step active" shortcut. Saving a step also writes the matching audit entry.
- **Notes** — internal-only notes sidebar (not exposed publicly).
- **Attachments** — gallery, upload more.
- **Customer info** — read-only.

### 5.8 ProfitabilityPage editor (`/content/profitability`)

- **Hero** subform.
- **Miners** table editor (name, hashrate, power, algo). Drag-reorder.
- **Network params** — 4 collapsible cards (BTC / ETH / LTC / KAS) each with difficulty, blockReward, blockTime, symbol, priceINR fields. Real-time validation against numeric ranges.
- **Defaults** — selectedMinerIndex, electricityRate, months.
- **FAQ** rows.
- Right panel: live calculator preview (run the same JS as the public page against current draft values so the editor sees what the user will see).

### 5.9 ContactPage editor (`/content/contact`)

- **Hero** subform.
- **Methods** list editor (icon, method, primary, secondary, href, cta, accent toggle, sortOrder).
- **Facility** subform.
- **Enquiry subjects** — chip input (add/remove tags).
- **Numbers section** — section tag, headline, description, stats list editor (idx, value, prefix, suffix, decimals, label, hint), ticker line.

### 5.10 ServiceRequestPage editor (`/content/service-request`)

- **Hero** subform.
- **Why card** — section tag, headline, italic, features list editor (icon picker, title, desc), direct contact (phone, email).
- **Issue types** — chip input.
- **Priority levels** — chip input (default 4 standard).

### 5.11 ShopPage editor (`/content/shop`)

- **Hero** subform.
- **Filter algorithms** — chip input (the buttons on the filter bar).
- **GST note** string.
- **Trust strip** — 4 (or N) cards (icon, label, desc).

### 5.12 TrackTicketPage editor (`/content/track-ticket`)

- Pure copy editor: search placeholder, not-found message, empty hint, escalation copy, hero.

### 5.13 NavLinks editor (`/content/nav`)

- Drag-reorder list of navbar links + a separate drag-reorder list of footer quick links (since `FooterCTA.tsx` has its own array). Add/remove rows. Each row: label, href, external toggle, isPublished.

### 5.14 Site settings (`/settings`)

Tabbed:
1. **Brand** — name, tagline, est year, logo upload, favicon upload.
2. **Contact** — sales phone/email, support email, institutional email, hours.
3. **Facility** — address, lat/lng, display string, city label, map embed, tour policy.
4. **Legal** — GST, CIN, privacy/terms URLs.
5. **Social** — handles.
6. **Footer** — copyright text, coordinates line.
7. **Live counters** — minersOnline, networkHashratePHs, paidOutUSDM, uptimePct, daysMining.
8. **SEO defaults** — title, description, og image, twitter handle.

### 5.15 Users (`/settings/users`)

Table: name, email, role pill, last login, status. Detail: edit role, reset password (sends email), deactivate.

### 5.16 Audit log (`/settings/audit-log`)

DataTable: when, actor, action, entity, entityId, IP. Click row → modal with `before` / `after` JSON diff (use `jsondiffpatch` or simple side-by-side).

### 5.17 Media library (`/media`)

Grid of thumbnails grouped by folder (products / logos / pages / misc). Top: search, filter by folder, "Upload" button (drag-and-drop area). Click thumbnail → drawer with full metadata, used-by references (which products/pages link this asset), copy-URL, delete.

---

## 6. Data fetching & state

- `lib/api.ts` exports a thin `apiFetch(path, init)` that:
  - Prepends `NEXT_PUBLIC_API_URL`.
  - Adds `credentials: 'include'`.
  - Adds `X-CSRF-Token` from a cookie helper for mutations.
  - Throws typed `ApiError` on non-2xx.
- React Query keys follow `[resource, action, params]` convention:
  - `['products', 'list', { page, q, algo }]`
  - `['products', 'detail', id]`
  - `['home']`, `['contact']`, etc. for singletons
- Mutations call `queryClient.invalidateQueries(...)` for the touched resource and any list views.
- Optimistic updates on toggles (publish/unpublish, status changes).
- All resource hooks live in `hooks/api/<resource>.ts` (e.g. `useProducts`, `useProduct(id)`, `useUpdateProduct()`).

---

## 7. Auth flow

- `middleware.ts` checks the cookie (`access_token`) on every `/admin/*` request. If absent, redirect to `/login?next=<path>`.
- `/login` posts to `POST /api/v1/auth/login` with `credentials: include`. On 200 the cookie is set by the backend; admin then router-pushes to `next` or `/dashboard`.
- A background `useCurrentUser()` hook hits `GET /api/v1/auth/me` once on mount; on 401 it triggers `POST /api/v1/auth/refresh`; on second 401 it logs out and redirects.
- Logout button → `POST /api/v1/auth/logout` → router-push `/login`.

---

## 8. Forms, validation, autosave

- Every form is a typed react-hook-form instance with a zod resolver. The same zod schema lives in `schemas/` and ideally is shared with the backend (publish backend zod schemas as a package, or copy-paste with a comment pointing at the backend file).
- **Autosave** via `useAutosave({ form, save, debounceMs: 2000, enabled: isDirty })`:
  - Debounced 2 s after last change.
  - PATCH only the dirty fields (rhf gives `formState.dirtyFields`).
  - Shows "Saving…" → "Saved 12s ago" pill in the header.
  - On error, falls back to manual save and shows a toast.
- **Manual Save**: always-visible primary button — pushes immediately, ignores debounce.
- **Publish**: separate button on page editors that flips `isPublished: true` and writes `publishedAt`.
- **Unsaved-changes guard**: if the user navigates away with dirty fields and autosave hasn't flushed, show a confirmation dialog.

---

## 9. Media library UX

- Drag-and-drop anywhere on `/media` to upload.
- File picker fallback: button + hidden `<input type="file" multiple>`.
- Live progress per file (multipart upload to `/api/v1/admin/media/upload`).
- After upload: thumbnail appears in grid, focused, drawer opens for alt-text edit.
- **MediaPicker** component used inside product/page editors: opens a modal of the library with single/multi select + an "Upload new" tab.
- Show "used by" reference list when viewing a media item; warn before deleting.

---

## 10. Permissions matrix

| Route | super-admin | editor | support |
|---|:-:|:-:|:-:|
| `/dashboard` | ✓ | ✓ | ✓ |
| `/content/*` | ✓ | ✓ | read-only |
| `/products/*`, `/plans/*` | ✓ | ✓ | read-only |
| `/leads/*` | ✓ | ✓ | ✓ |
| `/tickets/*` | ✓ | ✓ | ✓ |
| `/media` | ✓ | ✓ | read-only |
| `/settings` (site) | ✓ | ✓ | — |
| `/settings/users` | ✓ | — | — |
| `/settings/audit-log` | ✓ | — | — |

Sidebar hides routes the user can't see. Forbidden URLs return a 403 page rendered inside the admin shell.

---

## 11. Empty / loading / error / success patterns

- **Loading**: skeleton blocks matching the eventual layout. Sidebar items always render immediately.
- **Empty**: `<EmptyState>` with mono `// no <thing> yet` line, optional illustration glyph, primary CTA ("Add your first product").
- **Error**: inline error card on the affected section; toast for global ops; "Retry" button next to the error.
- **Success**: sonner toast for one-shot actions, "Saved 12s ago" pill for autosave, full-card success message for major events (e.g. user invited).

---

## 12. Dev workflow

```bash
# from repo root
cd crypto_mining_admin
cp .env.example .env
npm install
npm run dev          # next dev -p 3002
```

`.env.example`:
```ini
NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
NEXT_PUBLIC_FRONTEND_URL=http://localhost:3001
```

`package.json` scripts:
```json
{
  "scripts": {
    "dev":   "next dev -p 3002",
    "build": "next build",
    "start": "next start -p 3002",
    "lint":  "next lint",
    "type-check": "tsc --noEmit"
  }
}
```

Add the same Tailwind config + globals.css token block as the frontend on day one.

---

## 13. Build order (phase by phase)

| Phase | Scope | Outcome |
|---|---|---|
| **0. Bootstrap** | Next.js 14 init, Tailwind, token css, fonts, base layout shell with sidebar + topbar, route map, login screen | `/login` looks like the brand |
| **1. Auth** | Login form, useCurrentUser, middleware redirect, logout | Can sign in and reach `/dashboard` |
| **2. Dashboard** | Cards (counts), recent activity tables (read-only) | Static-ish dashboard pulling backend `/admin/*` summary endpoints |
| **3. Products** | List table + create + edit + delete + reorder + media picker for hero/gallery | Products fully editable from admin |
| **4. Plans** | Same shape as products (smaller form) | Plans editable |
| **5. HomePage editor** | Sectioned editor, autosave, publish, preview frame | Whole homepage editable; frontend home reflects edits |
| **6. Other page editors** | Shop, Profitability, Contact, ServiceRequest, TrackTicket — same pattern | Every page editable |
| **7. Nav + Site Settings** | NavLinks editor, settings tabs | Brand info / footer / social all editable |
| **8. Leads** | Inbox + detail + notes | Support team can triage |
| **9. Tickets** | Inbox + detail + timeline editor | Support team can run service ops |
| **10. Media library** | Upload area, grid, picker integration with editors | Image management end-to-end |
| **11. Users + Audit log (super-admin)** | Users CRUD, audit viewer with diffs | Compliance-ready |
| **12. Polish** | Empty/loading/error states, keyboard shortcuts (`g d` → dashboard, `n` → new of current resource), bulk actions, CSV export for leads/tickets | Production polish |
| **13. Tests + CI** | Playwright e2e on critical flows (login, edit a product, edit homepage, submit a ticket update), GH Actions | Green pipeline |

---

## 14. Open decisions (Vikrant to confirm before phase 5)

1. **Live preview** — iframe to the frontend dev URL is the simplest path. Confirm acceptable, or do we need a static SSR preview generated on-demand?
2. **Rich text scope** — Tiptap with bold/italic/links only, or a richer toolbar? Recommend minimal — the marketing site doesn't render markdown anywhere today.
3. **Deploy target** — Vercel for the admin makes sense given Next.js. Confirm.
4. **2FA on admin login** — TOTP via `otplib`? Recommend yes for super-admin role, optional for others.
5. **Localization** — only English right now; no i18n scaffolding unless confirmed.

---

**End of plan.** Once Vikrant approves and the backend Phase 0–2 is up, the admin starts at Phase 0 here. The two repos can develop in parallel from Phase 3 onward (admin Phase 3 ≈ backend Phase 4).
