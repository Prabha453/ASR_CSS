# ASR CSS — Mobile Screen Specification

> Source: `css_frontend` (React web app) + `css_backend` API  
> Purpose: Hand this document to AI/design tools to generate mobile theme screens, UI mockups, and image assets for `css_mobile` (React Native / Expo).

---

## 1. Product Overview

| Item | Value |
|------|-------|
| **Product name** | ASR CSS Management System |
| **Full name** | Corporate Secretarial Services (CSS) |
| **Tagline** | ASR CSS Management System |
| **Footer** | © {year} CSS. Crafted with care by ASR |
| **Default page title** | `{Company/Port Title} \| CSS` or `ASR::Corporate Secretary System` |
| **Backend API** | `http://localhost:5002` (dev) |
| **Port-based tenancy** | User enters Port Number at login → resolves to tenant DB |

### Core modules (production screens)
1. Authentication (Login, Register, Forgot Password)
2. Dashboard
3. Entity Management — Company, Individual, Officials
4. User Management — Users, User Groups
5. Settings — Company Profile, Shares, User, Master Data

---

## 2. Brand & Theme Tokens

Use these consistently across all mobile screens.

### Colors

| Token | Hex | Usage |
|-------|-----|-------|
| **Primary** | `#405189` | Headers, buttons, active nav, brand hero |
| **Primary Dark** | `#364574` | Pressed states, dark accents |
| **Secondary / Blue** | `#3577f1` | Links, info accents |
| **Success** | `#0ab39c` | Active status, success badges, shares section |
| **Info / Cyan** | `#299cdb` | Info chips, gradients |
| **Warning** | `#f7b84b` | Pending, caution |
| **Danger** | `#f06548` | Errors, delete, high risk |
| **Purple** | `#6559cc` | Gradients, master settings accent |
| **Background** | `#f3f6f9` | App background |
| **Card** | `#ffffff` | Cards, form surfaces |
| **Border** | `#e9ebec` | Dividers, card borders |
| **Text** | `#212529` | Primary text |
| **Text Muted** | `#878a99` | Subtitles, labels, placeholders |

### Typography

| Role | Font |
|------|------|
| Primary | Poppins |
| Secondary | HK Grotesk (`hkgrotesk`) |

### Gradients (hero cards, auth background)

```
linear-gradient(135deg, #405189 → #6559cc → #299cdb)
```

### Logos & branding assets

| Asset | Web path / source |
|-------|-------------------|
| Logo (light) | `css_frontend/src/assets/images/logo-light.png` |
| Logo (dark) | `css_frontend/src/assets/images/logo-dark.png` |
| Logo (small) | `css_frontend/src/assets/images/logo-sm.png` |
| Login background | Particle animation on indigo gradient (`ParticlesAuth`) |
| Dynamic portal logo | API: `cp_port_logo_url` |
| Dynamic company logo | API: `cp_company_logo_url` |
| Dynamic favicon | API: `cp_port_fav_icon_url` |
| Login BG image | API: `cp_login_bg_image` (uploadable in settings) |

### Icons
- Remix Icon set (`ri-*`) on web — use equivalent Material / Ionicons on mobile
- Common icons: dashboard, building, team, settings, user, search, filter, add, edit, delete, eye

---

## 3. App Navigation (Mobile Bottom Tab + Drawer)

### Primary bottom tabs (recommended mobile IA)

| Tab | Icon idea | Screen |
|-----|-----------|--------|
| Home | dashboard | Dashboard |
| Entities | building | Entity hub (Company / Individual / Officials) |
| Users | team | User Management |
| Settings | settings | Settings |
| Profile | user | Profile / Account |

### Sidebar / drawer menu (matches web)

```
Dashboards          → /dashboard
Entity Management
  ├ Entity          → /company/list
  ├ Individual      → /individuals
  └ Officials       → /officials/entity
User Management
  ├ Users           → /user-management/users
  └ User Groups     → /user-management/user-groups
Settings            → /settings
```

### App shell components

| Component | Description |
|-----------|-------------|
| **Header** | Hamburger, logo, search, notifications, profile avatar |
| **Sidebar** | Vertical menu with icons + labels |
| **Footer** | `© {year} CSS. Design & Develop by ASR` |
| **Breadcrumb** | Page hierarchy on inner screens |

---

## 4. Authentication Screens

### 4.1 Login — `/login` ⭐ Priority

**Screen title:** Sign In \| ASR CSS

**Layout:**
- Full-screen gradient / particle background (indigo `#405189`)
- Centered white card
- Logo at top (light variant)
- Subtitle: "ASR CSS Management System"

**Card content:**
- Heading: "Welcome Back!"
- Subtext: "Sign in to continue to ASR CSS."
- Error alert (red) on failure

**Form fields:**

| Field | Type | Placeholder | Required |
|-------|------|-------------|----------|
| Port Number | text | Enter port number | Yes |
| Email | email | Enter email | Yes |
| Password | password (toggle show/hide) | Enter password | Yes |

**Actions:**
- Primary button: **Sign In**
- Link: Forgot password → `/forgot-password`
- Link: Register → `/register`

**Mobile notes:** Port number is unique to this app (tenant resolver). Show keyboard-appropriate input types.

---

### 4.2 Register — `/register`

**Fields:** Email, Username (first name), Password, Confirm Password  
**Action:** Sign Up → redirect to login on success

---

### 4.3 Forgot Password — `/forgot-password`

**Fields:** Email  
**Action:** Send reset link

---

### 4.4 Logout — `/logout`

Clears session, redirects to login. No visible UI.

---

### 4.5 Template auth screens (low priority — Velzon demos)

24 demo routes under `/auth-*` (basic/cover variants): Sign In, Sign Up, Password Reset, Lock Screen, 404, 500, Offline, Two-Step Verify, etc. **Skip for mobile v1** unless needed as design reference.

---

## 5. Dashboard — `/dashboard` ⭐ Priority

**Screen title:** Dashboard \| ASR CSS

**Purpose:** Landing screen after login. Currently uses Velzon e-commerce template widgets (placeholder data).

### Sections

| Section | Content |
|---------|---------|
| **Greeting bar** | "Good Morning, {name}!", date range picker, "Add Product" CTA |
| **KPI widgets (4 cards)** | Total Earnings, Orders, Customers, My Balance — with animated numbers |
| **Revenue chart** | Line/area chart |
| **Sales by locations** | Map / chart |
| **Best selling products** | Product list |
| **Top sellers** | Rankings |
| **Store visits** | Chart |
| **Recent orders** | Data table |
| **Recent activity** | Right-side activity feed (toggleable panel) |

**Mobile recommendation:** Replace e-commerce placeholders with CSS-specific KPIs later (Total Companies, Individuals, Officials, Pending tasks). For v1 theme: 4 stat cards + 1 chart + recent activity list.

---

## 6. Entity Management — Company

### 6.1 Company List — `/company/list` ⭐ Priority

**Screen title:** Company List \| ASR CSS

**KPI strip (4 cards):**
- Total Companies
- Active
- Inactive
- Pending

**Toolbar:**
- Search (name / UEN / client no)
- Filters button → opens filter drawer
- View toggle: Table \| Card
- Record count
- **Add Company** button (primary)

**Table columns:**

| # | Company | UEN/Reg No | Client No | Status | Risk | Created | Actions |
|---|---------|------------|-----------|--------|------|---------|---------|

**Card view:** Avatar, company name, UEN, status badge, country, risk, created date

**Filter drawer (slide from right):**
- Status, Company Type, Entity Status, Corp Sec Status, Risk, Country, Region
- Incorporation date range, Created date range

**Row actions:** View, Edit, Delete (with confirmation modal)

---

### 6.2 Add / Edit Company — `/company/add`, `/company/edit/:entity_id` ⭐ Priority

**Screen title:** Add Company \| ASR CSS / Edit Company \| ASR CSS

**Layout:** 3-step wizard

| Step | Name | Sections |
|------|------|----------|
| 1 | Business Entity | Company Segregation (checkbox cards), Particulars, Registration Info, Business Entity type, Corp Sec particulars, Portfolio/Group/Holding, Principal Activities (SSIC), Service Category |
| 2 | Addresses | Tabs: Registered, Mailing, Business, Foreign, Other |
| 3 | Contact Details | Emails (multi), Mobiles (multi), Telephone, Fax, Website |

**Key fields (Step 1):**
- Entity name*, former name, client no, status, company type
- UEN, FBRN, UF no, domestic bus no, ACRA no
- Country, risk, region, entity status, corp sec type
- Incorporation date, FYE, takeover date
- XBRL, mail redirection, public interest, remarks
- Segregations, business entity IDs, SSIC codes, service IDs, tags

**Address fields (Step 2):**
- Block, street, building, level, unit, city, state, postal, country
- Effective dates, default address flag

**Actions:** Previous, Next, Save/Update Company, Scan Document (OCR upload PDF/PNG/JPG), View (edit mode), All Companies link

**Mobile notes:** Wizard with step indicator at top. OCR scanner as optional bottom sheet. Long forms → scrollable sections per step.

---

### 6.3 Company View — `/company/view/:entity_id` ⭐ Priority

**Screen title:** View Company \| ASR CSS

**Layout:** Gradient hero card + tabbed content

**Hero card:** Company name, UEN, status badge, client no

**Tabs:**

| Tab | Content |
|-----|---------|
| Overview | Contact sidebar, registered address, tags; Company Information; Corp Sec Details |
| Addresses | Address cards by type |
| Contacts | Email, Mobile, Office, Fax, Website cards |
| Corp Sec | Key dates, XBRL/mail settings, principal activities/SSIC |

**Actions:** Back, Edit, Delete (modal)

---

## 7. Entity Management — Individual

### 7.1 Individual List — `/individuals` ⭐ Priority

**Screen title:** Individual List \| ASR CSS  
**Permission:** `individual/view`

**KPI strip:** Total, Active, Inactive, High Risk

**Toolbar:** Search, Filters drawer, table/card toggle, Add Individual

**Table columns:**

| # | Individual | Client No | Status | Gender | Nationality | Risk | Created | Actions |

**Filter drawer:** Status, Risk, Gender, Nationality, DOB range, Created range

**Row actions:** View, Edit, Delete

---

### 7.2 Add / Edit Individual — `/individual/add`, `/individual/edit/:id` ⭐ Priority

**Screen title:** Add Individual \| ASR CSS / Edit Individual \| ASR CSS

**Layout:** 5-step wizard

| Step | Name | Key content |
|------|------|-------------|
| 1 | Individual | Salutation, name*, former name, alias, gender, DOB, nationality, race, status, risk, notes; family names; category checkboxes (Director, Shareholder, etc.) |
| 2 | ID Documents | ID type*, ID no*, issued country/date, document upload (multi) |
| 3 | Address | Contact, Residential, Foreign tabs — address fields + proof upload |
| 4 | Contact Details | Email, mobile, telephone, fax, Skype; service checkboxes |
| 5 | Consent | Email, App, WhatsApp notification opt-out toggles |

**Actions:** Previous, Next, Save, Scan Document (OCR)

---

### 7.3 Individual View — `/individual/:id` ⭐ Priority

**Tabs:** Overview, ID Documents, Addresses, Contacts, Relationships

**Actions:** Back, Edit, Delete

---

## 8. Entity Management — Officials

### 8.1 Entity Officials Hub — `/officials/entity` ⭐ Priority

**Screen title:** Entity Officials \| ASR CSS

**KPI strip:** Total Entities, Active, Inactive, Pending

**Filters:** Entity name search, Status (All/Active/Inactive/Pending)

**Table:**

| Company | UEN | Client No | Status | Officials Count | Actions |

**Row actions:**
- "Select Officials" dropdown → role-specific list
- "View All Officials"
- Drawer: officials grouped by role type tabs, edit/remove per official

---

### 8.2 Official List — `/officials/:slug/list`

**Layout:** Entity header hero (company name, UEN, status) + officials table for one role type

**Toolbar:** Search, table/card toggle, Add Official

**Table columns:** #, Name, Sub-roles, Appointment, Cessation, Status, Actions

**Actions:** Edit, Remove (delete modal)

---

### 8.3 Add / Edit Official — `/officials/:slug/add`, `/officials/:slug/edit/:official_id`

**Sections:**
1. Select Entity — Individual / Company toggle + browse/lookup modal
2. Entity detail panel — read-only summary
3. Appointment dates — type (Proposed/Effective) + date, Cessation type + date
4. Sub-roles — checkbox rows with appointment/cessation dates
5. Representative (if applicable) — individual lookup

**Actions:** Save Official, Cancel/Back

---

## 9. User Management

### 9.1 Users — `/user-management/users` ⭐ Priority

**Screen title:** Users \| ASR CSS

**Toolbar:** Search, status filter, Add User

**Table:** Name, Email, Role, Status, Group, Last Login, Actions

**Add/Edit modal fields:**
- First name, last name, email, password
- Role: Super Admin / Admin / Manager / Staff / Viewer / Client
- Status, user group, phone

**Permission modal:** Module × action matrix (view/create/edit/delete)

**Row actions:** Permissions, Edit, Delete

---

### 9.2 User Groups — `/user-management/user-groups`

**Table:** Group name, description, user count, status, Actions

**Add/Edit modal:** Group name, description, status, permission matrix

**Permission modules:** Dashboard, Company, Individual, Officials, Users, User Groups, Settings

---

## 10. Settings — `/settings` ⭐ Priority

**Screen title:** Settings \| ASR CSS

**Layout:** Left section sidebar + right tabbed content (on mobile: stack → section list → sub-screens)

### 10.1 Company Profile (section: general)

**Sub-tabs:**

| Tab | Key fields |
|-----|------------|
| Company Profile | Entity name*, registration no, country, currency, registered/mailing address, address history; uploads: company logo, portal logo, favicon, login background; timezone, port title, theme style |
| Decimal Settings | Share decimal places (no. of share, paid-up, issued) |
| Contact Information | Multiple emails, reply emails, phone numbers |
| Email Configuration | SMTP: from name, sending email, reply email, AWS SES, default email selector |

**Action per tab:** Save

---

### 10.2 Shares Settings (section: shares)

| Tab | Content |
|-----|---------|
| Share Certificate Settings | Payment toggles for certificates, allotment, transfer |
| Share Transfer Settings | Transaction numbering — prefix + color per transaction type |

---

### 10.3 User Settings (section: user)

| Tab | Fields |
|-----|--------|
| Change Password | Current password, new password, confirm password |
| Designation Master | (stub — same password form currently) |

---

### 10.4 Master Settings (section: master) — 24 CRUD screens

**Pattern for all:** Searchable table + Add/Edit modal + Delete confirmation

#### Common Masters
Salutations, Regions, Races, Tags (with color), Softwares, CSS Status

#### Company & Entity Masters
Company Types, Company Segregations, Business Entities, Related Industries, Company SSIC Codes, Corporate Secretary Types, Entity Service Categories, Entity Status (with color), Company Events, Product And Services

#### Share & Financial Masters
Share Class, Type Of Fee, Transaction Types

#### Template & Document Masters
Template Categories, Register Footer

#### Official / Member Masters
Member Types, Officials (with config modal for sub-roles), Official Sub Roles

**Mobile recommendation:** Settings → Master list → individual CRUD screen. Avoid nesting all 24 in one view.

---

## 11. Profile Screens

### 11.1 Simple Profile — `/profile` (template demo — low priority)

Velzon demo: cover photo, avatar, tabs (Overview, Activities, Projects, Documents)

### 11.2 User Profile — `/profile-1`

**Fields:** Username, email, user ID, profile photo upload  
**Action:** Update profile

---

## 12. Common UI Patterns (reuse on mobile)

### List screen pattern
```
[ KPI cards row — horizontal scroll ]
[ Search bar + Filter icon + Add button ]
[ Table rows OR Card grid ]
[ Pagination / load more ]
```

### Detail view pattern
```
[ Gradient hero — name, status badge, key ID ]
[ Tab bar: Overview | Addresses | Contacts | ... ]
[ Tab content — label/value rows or cards ]
[ FAB or bottom bar: Edit | Delete ]
```

### Wizard pattern
```
[ Step indicator: 1 — 2 — 3 ]
[ Section title ]
[ Form fields — grouped in cards ]
[ Bottom bar: Previous | Next / Save ]
```

### Master data CRUD pattern
```
[ Search + Add ]
[ Table list ]
[ Tap row → Edit modal / bottom sheet ]
[ Swipe or menu → Delete ]
```

### Status badges

| Status | Color |
|--------|-------|
| Active | `#0ab39c` (success) |
| Inactive | `#878a99` (muted) |
| Pending | `#f7b84b` (warning) |
| High Risk | `#f06548` (danger) |

---

## 13. Mobile Screen Priority (v1)

Build these first for theme / mockup generation:

| Priority | Screen | Route |
|----------|--------|-------|
| P0 | Splash / Home | — |
| P0 | Login | `/login` |
| P0 | Dashboard | `/dashboard` |
| P1 | Company List | `/company/list` |
| P1 | Company View | `/company/view/:id` |
| P1 | Company Add (wizard step 1) | `/company/add` |
| P1 | Individual List | `/individuals` |
| P1 | Individual View | `/individual/:id` |
| P1 | Officials Hub | `/officials/entity` |
| P2 | Users List | `/user-management/users` |
| P2 | Settings Hub | `/settings` |
| P2 | Company Profile Settings | `/settings` → general |
| P3 | Register, Forgot Password | `/register`, `/forgot-password` |
| P3 | User Groups, Master Settings CRUD | `/settings` → master |
| Skip | Velzon template demos | `/auth-*`, `/profile` |

---

## 14. AI Image / Mockup Prompt Hints

When generating mobile UI images, use:

- **Style:** Clean enterprise SaaS, light mode, rounded cards (16px radius), subtle shadows
- **Primary brand color:** Indigo `#405189`
- **Font feel:** Modern sans-serif (Poppins-like)
- **Platform:** iOS/Android mobile frames, portrait
- **Auth screen:** Dark indigo gradient background, white floating card, CSS logo, 3 input fields
- **List screens:** KPI chips at top, search bar, card list with status badges
- **Detail screens:** Gradient header card, tab navigation below hero
- **Settings:** Grouped list with colored section icons (indigo, green, red, purple)

### Example prompt (Login)
> Mobile app login screen for "ASR CSS Management System", corporate secretarial SaaS. Indigo gradient background (#405189), white rounded card, logo at top, fields for Port Number, Email, Password, primary Sign In button, minimalist enterprise UI, iOS style, Poppins font feel.

### Example prompt (Company List)
> Mobile company list screen for corporate secretarial app. Top KPI cards (Total, Active, Inactive, Pending), search bar with filter icon, company cards with name, UEN, green Active badge, primary color #405189, light gray background #f3f6f9, clean SaaS design.

---

## 15. Route Reference (Complete)

### Auth-protected (18 routes)
`/dashboard`, `/index`, `/settings`, `/company/list`, `/company/add`, `/company/edit/:entity_id`, `/company/view/:entity_id`, `/individuals`, `/individual/add`, `/individual/edit/:id`, `/individual/:id`, `/officials/entity`, `/officials/:slug/list`, `/officials/:slug/add`, `/officials/:slug/edit/:official_id`, `/user-management/users`, `/user-management/user-groups`, `/profile`, `/profile-1`

### Public (production)
`/login`, `/register`, `/forgot-password`, `/logout`

### Public (template demos — 20+ routes)
`/auth-signin-basic`, `/auth-signin-cover`, `/auth-signup-*`, `/auth-pass-reset-*`, `/auth-lockscreen-*`, `/auth-logout-*`, `/auth-success-msg-*`, `/auth-twostep-*`, `/auth-404-*`, `/auth-500`, `/auth-pass-change-*`, `/auth-offline`

---

## 16. Default Dev Credentials

| Field | Value |
|-------|-------|
| Port Number | `1001` |
| Email | `admin@example.com` |
| Password | `123456` |
| Role | SUPER_ADMIN |

---

*Generated from ASR CSS web frontend analysis for `css_mobile` React Native development.*
