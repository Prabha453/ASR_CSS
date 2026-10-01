# ASR CSS Mobile — Individual Screens Design Brief

> Hand this document to a design AI / designer.  
> Product: **ASR CSS Management System** (Corporate Secretarial Services)  
> Module: **Entity Management → Individuals**  
> Platform: **Mobile (iOS / Android)**  
> Audience: Corporate secretaries, compliance staff, admins  

---

## 1. Design context

### Brand (must match existing app)

| Token | Value | Usage |
|-------|-------|-------|
| Primary | `#405189` | Headers, primary buttons, active states |
| Success | `#0ab39c` | Active status |
| Warning | `#f7b84b` | Pending |
| Danger | `#f06548` | Delete, high risk |
| Info | `#299cdb` | Accents |
| Purple | `#6559cc` | Gradients |
| Background | `#f3f6f9` | Screen body |
| Card | `#ffffff` | Cards / forms |
| Text | `#212529` | Primary text |
| Muted | `#878a99` | Labels, meta |
| Border | `#e9ebec` | Dividers |

**Hero gradient:** `#405189 → #6559cc → #299cdb` (135°)  
**Font:** Poppins (or close sans)  
**Style:** Enterprise SaaS — clean cards, soft radius (~14–16px), light shadows, no consumer/fintech look, no purple-on-white cliché layouts beyond brand tokens above.

### Navigation entry points

- Bottom tab **Entities** → hub card **Individuals**
- Drawer → Entity Management → Individuals
- Dashboard quick action **Add Individual** → Add form

### Related screens already designed (match language)

Company Profile uses:

- Blue **curved gradient header**
- **Pill tabs on the header** (active = white pill + blue underline; inactive = translucent)
- White summary card under header
- Content cards with label/value rows
- Round blue **edit FAB**
- Soft red **Delete** button at bottom

**Individuals should feel like the sibling of Company Profile**, not a different product.

---

## 2. Screen map (3 screens)

```
Individuals List
   ├─ tap card ──────────► Individual View (profile)
   ├─ menu → Edit ───────► Add/Edit Wizard (edit mode)
   ├─ menu → Delete
   └─ FAB (+) ───────────► Add/Edit Wizard (create mode)

Individual View
   ├─ Edit FAB ──────────► Add/Edit Wizard (edit mode)
   └─ Delete
```

---

## 3. Screen A — Individual List

### Purpose
Browse, search, filter, and open personal entities (directors, shareholders, contacts).

### Layout (top → bottom)

1. **Primary header bar** (`#405189`)
   - Left: hamburger / back (context-dependent)
   - Title (left-aligned): **Individuals**
   - Subtitle: **Manage personal entities**
   - Right: notifications (optional), profile avatar (optional)

2. **Search row** (on primary header background)
   - Full-width search field
   - Placeholder: `Search by name or ID...`
   - Optional: filter icon (advanced filters — see below)

3. **Content sheet** (white/grey, rounded top corners ~24px overlapping header)

4. **Status KPI segmented tabs** (white card)
   - Segments: **All | Active | Inactive | Pending**
   - Each shows **count on top**, **label below**
   - Active segment has soft tint matching status color

5. **Result meta**
   - e.g. `128 individuals found` (count emphasized in primary)

6. **List of Individual cards** (scrollable, infinite load)

7. **FAB** — round primary `+` bottom-right → Add Individual

### Individual list card content

| Element | Spec |
|---------|------|
| Avatar | Initials on colored circle/square (hash colors from brand set) |
| Title | Full name (bold, 2 lines max) |
| Meta line 1 | `ID: S1234567A` · optional `Client: C-001` |
| Meta line 2 | Primary email **or** mobile |
| Badges | Status pill (dot + label) · Nationality chip · Risk chip |
| Overflow | `⋮` menu → View / Edit / Delete |

### Status badge colors

| Status | Text | Background |
|--------|------|------------|
| Active | `#0ab39c` | `#EAFBF7` |
| Inactive | `#878a99` | `#F4F4F4` |
| Pending | `#f7b84b` | `#FFF4E8` |

### Risk chip colors

| Risk | Color |
|------|-------|
| Low | `#0ab39c` |
| Medium | `#f7b84b` |
| High | `#f06548` |
| Very High | `#c0392b` |

### Empty state
- Icon: people
- Title: **No individuals found**
- Body: Try adjusting search or add a new individual
- CTA: **Add Individual**

### Advanced filters (drawer / sheet — design optional)

- Status, Nationality
- DOB from / to
- Created from / to
- Risk (optional)
- Sort: Latest / Oldest / Name A–Z / Name Z–A

### States to design
Loading skeleton/spinner · Error + retry · Empty · Populated list · Pull-to-refresh

---

## 4. Screen B — Individual View (Profile)

### Purpose
Read-only profile with tabbed detail sections. Edit via FAB; delete via bottom action.

### Layout

#### Header (gradient, curved bottom ~28px)

```
[ ← ]   [Avatar initials]  Full Name
                           Individual Profile

[ Overview ] [ ID Docs ] [ Addresses ] [ Contacts ] [ Family ]
     ↑ pill tabs ON the blue header (same pattern as Company Profile)
```

**Tab pill rules**

| State | Background | Icon/Text | Extra |
|-------|------------|-----------|-------|
| Active | White | Primary blue | Blue underline bar under pill |
| Inactive | `rgba(255,255,255,0.14)` | White | — |

Tabs scroll horizontally if needed.

#### Body (light grey)

**When Overview is active — summary card first:**

| Left | Middle | Right |
|------|--------|-------|
| Person icon in soft circle | `ID: …` bold + `Nationality: …` muted | Status badge |

**Then section card(s)** depending on tab.

#### Floating + footer

- **Edit FAB** (pencil) bottom-right — primary circle
- **Delete Individual** full-width soft danger button below content

---

### Tab content specs

#### Tab 1 — Overview
Card title: **Personal Information**  
Rows (label left muted / value right bold):

- Full Name  
- Former Name  
- Alias  
- Gender  
- Date of Birth  
- Country of Birth  
- Nationality  
- Status *(badge)*  
- Risk Rating *(chip)*  
- Client No.  
- Notes  

Empty values show em dash `—`.

#### Tab 2 — ID Docs
One card per identification:

- Header: ID type name + card icon  
- ID Number  
- Issued Country  
- Issued Date  
- Expiry Date  
- Optional: document preview thumbnail (future)

Empty: “No ID documents recorded.”

#### Tab 3 — Addresses
One card per address:

- Title: Contact / Residential / Foreign  
- Full formatted address block  

Empty: “No addresses recorded.”

#### Tab 4 — Contacts
Single card list of rows:

- EMAIL / MOBILE / OFFICE / FAX (+ country code when phone)  
- Skype (if present)

Empty: “No contacts recorded.”

#### Tab 5 — Family
Card:

- Father / Mother / Spouse  
- Plus any extra relationship rows (type + related name)

---

## 5. Screen C — Add / Edit Individual (Wizard)

### Purpose
Create or update an individual via a **5-step wizard** (same screens for Add and Edit; title changes).

### Chrome

- Header: **Add Individual** or **Edit Individual** + back
- **Step indicator** (5 circles with icons + connectors)
  1. Personal (`person`)
  2. ID Docs (`card`)
  3. Address (`location`)
  4. Contact (`call`)
  5. Consent (`shield`)
- Step title under indicator
- Sticky footer: **Back** (secondary) + **Next** / **Create Individual** / **Save Changes** (primary)

### Step 1 — Personal

| Field | Type | Required |
|-------|------|----------|
| Full Name | text | Yes |
| Former Name | text | |
| Alias | text | |
| Gender | segmented / chips: Male, Female, Other, Prefer not to say | |
| Date of Birth | date `YYYY-MM-DD` | |
| Country of Birth | text | |
| Nationality | text | |
| Status | chips: Active, Pending, Inactive | |
| Risk Rating | chips: Low, Medium, High, Very High | |
| Father's Name | text | |
| Mother's Name | text | |
| Spouse's Name | text | |
| Notes | multiline | |

*(Web also has salutation, race, category checkboxes — nice-to-have on mobile.)*

### Step 2 — ID Documents

| Field | Type |
|-------|------|
| ID Type | select / type id |
| ID Number | text |
| Issued Country | text |
| Issued Date | date |
| Expiry Date | date |
| Document upload | multi-file *(future / optional in design)* |
| Scan Document (OCR) | secondary action *(web has mock OCR — optional)* |

Allow multiple ID entries in full design; MVP may show one primary ID block + “Add another”.

### Step 3 — Address

Sub-tabs: **Contact | Residential | Foreign**

Per address:

- Block / House No.  
- Street Name  
- Building  
- Level / Unit  
- City / State  
- Postal Code  
- Country (default Singapore)  
- Proof of address upload *(optional in design)*  

Plus control: **Default address** = Contact / Residential / Foreign

### Step 4 — Contact Details

| Field | Type |
|-------|------|
| Email | email |
| Mobile | country code + number |
| Telephone | country code + number |
| Fax | country code + number |
| Skype | text |

*(Web also has preferred contact modes + service checkboxes — optional.)*

### Step 5 — Consent / Notices

iOS-style switches:

- Email notices  
- App notifications  
- WhatsApp notices  

Short helper text: “Notice preferences for this individual.”

### Validation UX
- Step 1: block Next if name empty (inline error under Full Name)
- Final step primary button shows loading while saving

---

## 6. Component inventory (for design system)

| Component | Used on |
|-----------|---------|
| App header (primary solid) | List, Wizard |
| Gradient profile header + on-header pills | View |
| Search field on primary | List |
| Status KPI segmented control | List |
| Individual person card | List |
| Status / risk / nationality badges | List, View |
| Summary identity card | View Overview |
| Info row list card | View tabs, Wizard sections |
| Wizard stepper | Add/Edit |
| Option chips / segmented pickers | Wizard |
| Switch rows | Consent step |
| Primary FAB (+ / pencil) | List / View |
| Danger outline delete button | View |
| Empty state | List + empty tabs |
| Action sheet / alert menu | List card `⋮` |

---

## 7. Content examples (use in mocks)

**Person:** `Tan Wei Ming`  
**ID:** `S9032145A` (NRIC)  
**Client:** `CL-1042`  
**Status:** Active  
**Nationality:** Singapore  
**Risk:** Low  
**Email:** `weiming.tan@email.com`  
**Mobile:** `+65 9123 4567`  
**DOB:** `12 Mar 1990`  
**Address (Contact):** `12 Orchard Road, #05-01, Singapore 238841`

Second sample (Pending): `Sarah Lim` · Passport `K8123456` · Medium risk · Malaysia

---

## 8. Motion & interaction notes

- Tab content: light fade (~180–200ms) on tab change  
- List: pull-to-refresh; load more near bottom  
- FAB: always above safe area / home indicator  
- Header pills: sticky with header (not inside scroll body)  
- Wizard: preserve form state across steps  

---

## 9. Design do / don’t

### Do
- Match **Company Profile** header + pill tab language for View  
- Keep list consistent with **Company List** (primary header + rounded sheet + cards + FAB)  
- Use initials avatars (people), not building icons  
- Keep one clear primary CTA per screen  

### Don’t
- Don’t invent a new color theme  
- Don’t put dense tables on mobile list (use cards)  
- Don’t hide Edit — keep FAB visible on View  
- Don’t overload Overview with appointments history (web has a side panel; mobile can defer “Appointment History” to a later tab if needed)  

---

## 10. Optional future (not required for first design pass)

- Appointment History tab (company roles held by this person)  
- Company Contacts grouped list  
- Multi-file ID / address proof previews  
- Real OCR scan panel  
- Category chips (Director, Shareholder, etc.)  
- Field change history (edit mode)

---

## 11. Deliverables requested from design AI

Please produce:

1. **Individual List** — light mode, phone frame (empty + populated)  
2. **Individual View** — Overview + one other tab (e.g. ID Docs)  
3. **Add Individual Wizard** — Step 1 and Step 5 (consent) at minimum; ideally all 5 steps  
4. Component close-ups: list card, status pills, header tabs, FAB  
5. Optional dark mode **only if** asked — default is light enterprise  

Export annotated frames with spacing notes (8 / 12 / 16 / 24) where possible.
