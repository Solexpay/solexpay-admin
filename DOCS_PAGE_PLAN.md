# Solexpay Developer Documentation Page — Implementation Plan

> **Source:** `api-docs (1).json` (OpenAPI 3.1.0, Spring Boot backend)  
> **Base URL:** `http://api.solexpay.com.ng`  
> **Swagger UI:** `http://api.solexpay.com.ng/swagger-ui/index.html`  
> **OpenAPI JSON:** `http://api.solexpay.com.ng/v3/api-docs`

---

## Table of Contents

1. [Files to Create](#1-files-to-create)
2. [Route Registration](#2-route-registration)
3. [Page Layout](#3-page-layout)
4. [Design Tokens & Style Rules](#4-design-tokens--style-rules)
5. [Component Patterns](#5-component-patterns)
6. [Left Navigation Structure](#6-left-navigation-structure)
7. [API Sections — Full Endpoint Detail](#7-api-sections--full-endpoint-detail)
   - 7.1 Authentication
   - 7.2 Account
   - 7.3 Wallet
   - 7.4 KYC Verification
   - 7.5 NIP Transfers
   - 7.6 P2P Transfers
   - 7.7 Transactions
   - 7.8 Loans
   - 7.9 Loan Repayment
   - 7.10 Savings
   - 7.11 Bills & VTU
   - 7.12 Notifications
   - 7.13 Admin Dashboard
   - 7.14 School Portal
8. [Global Response Envelope](#8-global-response-envelope)
9. [Schemas Reference Section](#9-schemas-reference-section)
10. [Error Codes Section](#10-error-codes-section)
11. [Angular Component Skeleton](#11-angular-component-skeleton)

---

## 1. Files to Create

| File | Purpose |
|---|---|
| `src/app/pages/docs.page.ts` | Main page component (standalone Angular) |

No other files need to be created. The route is added inline in `app.routes.ts`. No service file is needed — this is a fully static page with no API calls.

---

## 2. Route Registration

Open `src/app/app.routes.ts`. Add this entry to the routes array alongside the other public routes (login, terms, privacy). It must be **outside** any auth guard:

```typescript
{
  path: 'docs',
  loadComponent: () =>
    import('./pages/docs.page').then(m => m.DocsPageComponent),
  title: 'Developer API Reference — Solexpay'
}
```

---

## 3. Page Layout

The page is divided into three zones. No auth guard. No sidebar layout component — this is a self-contained full-page component.

```
┌──────────────────────────────────────────────────────────────────┐
│  HERO HEADER (full-width dark gradient)                          │
│  Logo · Title · Base URL chip · "Open Swagger UI" button        │
├───────────────────┬──────────────────────────────────────────────┤
│                   │                                              │
│  LEFT NAV         │  CONTENT AREA                               │
│  (sticky, 224px)  │  (scrollable, sections with anchor IDs)     │
│  Hidden < lg      │                                              │
│                   │                                              │
└───────────────────┴──────────────────────────────────────────────┘
│  FOOTER (base URL · copyright · swagger link)                    │
└──────────────────────────────────────────────────────────────────┘
```

**Outer wrapper:**  
`min-h-screen bg-surface`

**Hero + content container max-width:**  
`max-w-6xl mx-auto`

**Two-column content area:**  
`flex gap-8 px-4 py-10`

**Left nav column:**  
`hidden lg:block w-56 shrink-0`

**Main content column:**  
`flex-1 min-w-0 space-y-16`

---

## 4. Design Tokens & Style Rules

**CRITICAL:** Only use these Tailwind token classes. Never hardcode hex values.

| Purpose | Tailwind class |
|---|---|
| Page background | `bg-surface` |
| Card / endpoint container | `bg-surface-container-lowest` |
| Elevated inner block | `bg-surface-container` |
| Subtle background | `bg-surface-container-high` |
| Primary brand | `bg-primary`, `text-primary` |
| Primary light tint | `bg-primary/10` |
| Page heading | `text-on-surface font-bold` |
| Body / description | `text-on-surface-variant text-sm` |
| Muted label | `text-on-surface-variant text-xs` |
| Divider | `border-outline-variant` |
| GET badge | `bg-tertiary/10 text-tertiary` |
| POST badge | `bg-primary/10 text-primary` |
| PUT/PATCH badge | `bg-amber-100 text-amber-800` |
| DELETE badge | `bg-error/10 text-error` |
| Success state | `bg-tertiary/10 text-tertiary` |
| Error state | `bg-error/10 text-error` |
| Warning state | `bg-amber-100 text-amber-800` |
| Code / mono | `font-mono text-xs bg-surface-container rounded-lg px-1.5 py-0.5` |
| Code block | `font-mono text-xs bg-surface-container rounded-xl p-4 overflow-x-auto` |
| Card shadow | `shadow-[0_2px_12px_rgba(25,28,29,0.06)]` |
| Card hover shadow | `hover:shadow-[0_4px_20px_rgba(25,28,29,0.1)]` |
| Primary button shadow | `shadow-[0_4px_16px_rgba(0,91,191,0.3)]` |

**Hero gradient:** `bg-gradient-to-br from-[#001d3d] to-[#003566]`

**Border radius:**
- Cards: `rounded-2xl`
- Chips/badges: `rounded-lg`
- Code blocks: `rounded-xl`
- Buttons: `rounded-xl`

**Icons:** Material Symbols Outlined (already loaded globally in the app).  
Use `<span class="material-symbols-outlined">icon_name</span>` for all icons.

---

## 5. Component Patterns

### 5.1 Hero Section

```html
<div class="bg-gradient-to-br from-[#001d3d] to-[#003566] text-white px-6 py-16">
  <div class="max-w-6xl mx-auto">
    <!-- Logo row -->
    <div class="flex items-center gap-3 mb-5">
      <img src="/logo-icon.png" alt="Solexpay" class="h-10 w-auto drop-shadow-lg" />
      <span class="text-2xl font-bold tracking-tight">Solexpay</span>
    </div>

    <!-- Heading -->
    <h1 class="text-4xl font-bold mb-3 leading-tight">Developer API Reference</h1>
    <p class="text-blue-200 text-lg max-w-2xl leading-relaxed">
      Complete REST API for the Solexpay platform — authentication, wallets,
      loans, KYC, transfers, savings, bills, notifications, admin, and school portal.
    </p>

    <!-- CTA buttons -->
    <div class="flex flex-wrap gap-3 mt-7">
      <a href="http://api.solexpay.com.ng/swagger-ui/index.html" target="_blank"
         class="inline-flex items-center gap-2 bg-white text-[#001d3d] font-semibold
                text-sm px-4 py-2.5 rounded-xl hover:bg-blue-50 transition-colors
                shadow-[0_4px_16px_rgba(0,91,191,0.3)]">
        <span class="material-symbols-outlined text-[18px]">open_in_new</span>
        Interactive Swagger UI
      </a>
      <a href="http://api.solexpay.com.ng/v3/api-docs" target="_blank"
         class="inline-flex items-center gap-2 bg-white/10 border border-white/20
                text-white font-semibold text-sm px-4 py-2.5 rounded-xl
                hover:bg-white/20 transition-colors">
        <span class="material-symbols-outlined text-[18px]">data_object</span>
        OpenAPI JSON
      </a>
    </div>

    <!-- Base URL chip -->
    <div class="mt-8 inline-flex items-center gap-3 bg-white/10 border border-white/20
                rounded-xl px-5 py-3">
      <span class="text-xs text-blue-300 uppercase tracking-widest font-semibold">Base URL</span>
      <code class="font-mono text-sm text-white">http://api.solexpay.com.ng</code>
    </div>

    <!-- Version badge -->
    <div class="mt-4 inline-flex items-center gap-2 text-blue-300 text-sm">
      <span class="material-symbols-outlined text-[16px]">verified</span>
      OpenAPI 3.1.0 · v0
    </div>
  </div>
</div>
```

### 5.2 Authentication Banner

Place this at the very top of the content area, before the first section:

```html
<div class="bg-primary/8 border border-primary/20 rounded-2xl p-5 flex gap-4">
  <span class="material-symbols-outlined text-primary mt-0.5 shrink-0">lock</span>
  <div>
    <p class="font-semibold text-on-surface text-sm">Bearer Token Authentication</p>
    <p class="text-sm text-on-surface-variant mt-1">
      Protected endpoints require an
      <code class="font-mono bg-surface-container px-1.5 py-0.5 rounded text-xs">
        Authorization: Bearer &lt;token&gt;
      </code>
      header. Obtain a token from
      <code class="font-mono bg-surface-container px-1.5 py-0.5 rounded text-xs">
        POST /auth/admin/login
      </code>
      (admin) or
      <code class="font-mono bg-surface-container px-1.5 py-0.5 rounded text-xs">
        POST /school/auth/login
      </code>
      (school portal).
    </p>
  </div>
</div>
```

### 5.3 Method Badge

A TypeScript helper inside the component class:

```typescript
methodBadge(method: string): string {
  const map: Record<string, string> = {
    GET:    'bg-tertiary/10 text-tertiary',
    POST:   'bg-primary/10 text-primary',
    PUT:    'bg-amber-100 text-amber-800',
    PATCH:  'bg-amber-100 text-amber-800',
    DELETE: 'bg-error/10 text-error',
  };
  const color = map[method] ?? 'bg-surface-container text-on-surface-variant';
  return `inline-flex items-center font-mono font-bold text-xs px-2.5 py-1 rounded-lg uppercase ${color}`;
}
```

### 5.4 Endpoint Card

Each endpoint is a collapsible card. The `id` attribute is used for left-nav scroll targeting.

```html
<!-- Collapsed header (always visible) -->
<div class="bg-surface-container-lowest rounded-2xl border border-outline-variant
            shadow-[0_2px_12px_rgba(25,28,29,0.06)]
            hover:shadow-[0_4px_20px_rgba(25,28,29,0.1)] transition-shadow duration-200">

  <!-- Clickable header row -->
  <button (click)="toggle('endpoint-id')"
          class="w-full flex items-start gap-3 p-5 text-left">
    <!-- Method badge -->
    <span [class]="methodBadge('POST')">POST</span>
    <!-- Path -->
    <span class="font-mono text-sm text-on-surface font-medium flex-1">/auth/register</span>
    <!-- Summary -->
    <span class="text-sm text-on-surface-variant hidden sm:block">Register new user</span>
    <!-- Chevron -->
    <span class="material-symbols-outlined text-outline text-[20px] transition-transform"
          [class.rotate-180]="isExpanded('endpoint-id')">
      expand_more
    </span>
  </button>

  <!-- Expanded body -->
  @if (isExpanded('endpoint-id')) {
    <div class="px-5 pb-5 border-t border-outline-variant pt-4 space-y-4">
      <!-- Auth required chip -->
      <div class="flex items-center gap-2">
        <span class="material-symbols-outlined text-[16px] text-on-surface-variant">lock_open</span>
        <span class="text-xs text-on-surface-variant">Authentication: None required</span>
      </div>

      <!-- Description -->
      <p class="text-sm text-on-surface-variant">Description text here.</p>

      <!-- Request Body -->
      <div>
        <p class="text-xs font-semibold text-on-surface uppercase tracking-wider mb-2">
          Request Body
        </p>
        <pre class="font-mono text-xs bg-surface-container rounded-xl p-4 overflow-x-auto
                    text-on-surface leading-relaxed">...</pre>
      </div>

      <!-- Query Params table (when applicable) -->
      <div>
        <p class="text-xs font-semibold text-on-surface uppercase tracking-wider mb-2">
          Query Parameters
        </p>
        <div class="rounded-xl border border-outline-variant overflow-hidden">
          <table class="w-full text-xs">
            <thead class="bg-surface-container">
              <tr>
                <th class="text-left px-4 py-2.5 font-semibold text-on-surface-variant">Param</th>
                <th class="text-left px-4 py-2.5 font-semibold text-on-surface-variant">Type</th>
                <th class="text-left px-4 py-2.5 font-semibold text-on-surface-variant">Required</th>
                <th class="text-left px-4 py-2.5 font-semibold text-on-surface-variant">Description</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-outline-variant">
              <tr>
                <td class="px-4 py-2.5 font-mono text-primary">page</td>
                <td class="px-4 py-2.5 text-on-surface-variant">integer</td>
                <td class="px-4 py-2.5 text-on-surface-variant">No</td>
                <td class="px-4 py-2.5 text-on-surface-variant">0-indexed page number (default: 0)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Responses -->
      <div>
        <p class="text-xs font-semibold text-on-surface uppercase tracking-wider mb-2">
          Responses
        </p>
        <div class="space-y-2">
          <!-- 200 -->
          <div class="rounded-xl border border-outline-variant overflow-hidden">
            <div class="flex items-center gap-2 px-4 py-2 bg-tertiary/5 border-b border-outline-variant">
              <span class="bg-tertiary/10 text-tertiary font-mono font-bold text-xs
                           px-2 py-0.5 rounded-lg">200</span>
              <span class="text-xs text-on-surface-variant">OK</span>
            </div>
            <pre class="font-mono text-xs bg-surface-container p-4 overflow-x-auto
                        text-on-surface leading-relaxed">...</pre>
          </div>
          <!-- 4xx -->
          <div class="flex items-center gap-3 px-4 py-2.5 rounded-xl
                      border border-outline-variant bg-error/5">
            <span class="bg-error/10 text-error font-mono font-bold text-xs
                         px-2 py-0.5 rounded-lg">400</span>
            <span class="text-xs text-on-surface-variant">Bad request — validation failed</span>
          </div>
        </div>
      </div>
    </div>
  }
</div>
```

### 5.5 Section Header

Each group of endpoints gets a section heading:

```html
<section id="section-auth">
  <div class="flex items-center gap-3 mb-5">
    <div class="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
      <span class="material-symbols-outlined text-primary text-[18px]">key</span>
    </div>
    <div>
      <h2 class="text-xl font-bold text-on-surface">Authentication</h2>
      <p class="text-sm text-on-surface-variant mt-0.5">
        User registration, OTP, login, PIN management
      </p>
    </div>
  </div>
  <div class="space-y-3">
    <!-- endpoint cards -->
  </div>
</section>
```

### 5.6 Left Navigation

```html
<aside class="hidden lg:block w-56 shrink-0">
  <nav class="sticky top-6 max-h-[calc(100vh-5rem)] overflow-y-auto pr-2 space-y-1 text-sm">

    <!-- Group label -->
    <p class="text-xs font-semibold text-on-surface-variant uppercase tracking-wider
              px-3 py-2 mt-3 first:mt-0">Authentication</p>

    <!-- Nav item (active state) -->
    <button (click)="scrollTo('section-auth')"
            class="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left
                   transition-colors bg-primary/10 text-primary font-semibold">
      <span class="material-symbols-outlined text-[16px]">key</span>
      Authentication
    </button>

    <!-- Nav item (inactive state) -->
    <button (click)="scrollTo('section-wallet')"
            class="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left
                   transition-colors text-on-surface-variant hover:bg-surface-container
                   hover:text-on-surface">
      <span class="material-symbols-outlined text-[16px]">account_balance_wallet</span>
      Wallet
    </button>

  </nav>
</aside>
```

---

## 6. Left Navigation Structure

The nav maps exactly to section IDs in the content area.

```
Overview
  (just the auth banner + intro)

── USER FLOWS ──────────────────
Authentication          → #section-auth
  POST /auth/otp/registration
  POST /auth/register
  POST /auth/otp/pin-setup
  POST /auth/pin/set
  POST /auth/pin/change

Account                 → #section-account
  GET  /account/profile
  PUT  /account/profile

Wallet                  → #section-wallet
  GET  /wallets/balance
  POST /wallets/fund

KYC Verification        → #section-kyc
  POST /kyc/verify/bvn
  POST /kyc/verify/nin
  GET  /kyc/status
  GET  /kyc/check

NIP Transfers           → #section-nip
  POST /transfers/nip/name-enquiry
  POST /transfers/nip/fee-estimate
  POST /transfers/nip
  GET  /transfers/nip/banks
  GET  /transfers/nip/{transferId}

P2P Transfers           → #section-p2p
  POST /transfers/p2p/recipient-lookup
  POST /transfers/p2p
  GET  /transfers/p2p/history
  GET  /transfers/p2p/{transferId}

Transactions            → #section-transactions
  GET  /transactions
  GET  /transactions/{transactionId}
  GET  /transactions/{transactionId}/ledger-entries

Loans                   → #section-loans
  POST /loans/apply
  GET  /loans/my-loans
  GET  /loans/{loanId}
  GET  /loans/{loanId}/repayment-schedule
  POST /loans/{loanId}/student-accept
  POST /loans/{loanId}/student-cancel

Loan Repayment          → #section-repayment
  GET  /loans/{loanId}/repayments/schedule
  GET  /loans/{loanId}/repayments/balance
  POST /loans/{loanId}/repayments
  POST /loans/{loanId}/repayments/preview

Savings                 → #section-savings
  POST /savings/accounts
  GET  /savings/accounts
  GET  /savings/accounts/{accountId}
  POST /savings/deposit
  POST /savings/withdraw
  POST /savings/accounts/{accountId}/close
  GET  /savings/accounts/{accountId}/interest-history

Bills & VTU             → #section-bills
  POST /bills/airtime
  POST /bills/data
  GET  /bills/data/variations/{providerCode}
  POST /bills/{paymentId}/query
  GET  /bills/{paymentId}
  GET  /bills/history

Notifications           → #section-notifications
  GET  /notifications
  GET  /notifications/unread-count
  POST /notifications/{notificationId}/read
  POST /notifications/read-all
  DELETE /notifications/{notificationId}

── ADMIN ───────────────────────
Admin Dashboard         → #section-admin
  GET  /admin/dashboard/metrics
  GET  /admin/users
  GET  /admin/transactions
  GET  /admin/loans
  GET  /admin/loans/overdue
  POST /admin/users/{userId}/suspend
  POST /admin/users/{userId}/reactivate
  POST /admin/kyc/{verificationId}/approve
  POST /admin/broadcast

── SCHOOL PORTAL ───────────────
School Portal           → #section-school
  POST /school/auth/login
  GET  /school/dashboard
  GET  /school/students
  GET  /school/verifications/pending
  POST /school/loans/{loanId}/verify
  POST /loans/{loanId}/school-verify
  POST /loans/{loanId}/school-reject
  GET  /loans/school-pending

── OPS ─────────────────────────
Loan Operations         → #section-ops
  GET  /loans/ops-pending
  POST /loans/{loanId}/ops-approve
  POST /loans/{loanId}/ops-reject

── REFERENCE ───────────────────
Schemas                 → #section-schemas
Error Codes             → #section-errors
Webhooks                → #section-webhooks
```

**Section icons (Material Symbols):**

| Section | Icon |
|---|---|
| Authentication | `key` |
| Account | `person` |
| Wallet | `account_balance_wallet` |
| KYC | `verified_user` |
| NIP Transfers | `send` |
| P2P Transfers | `swap_horiz` |
| Transactions | `receipt_long` |
| Loans | `school` |
| Loan Repayment | `payments` |
| Savings | `savings` |
| Bills & VTU | `bolt` |
| Notifications | `notifications` |
| Admin Dashboard | `admin_panel_settings` |
| School Portal | `domain` |
| Loan Operations | `rate_review` |
| Schemas | `data_object` |
| Error Codes | `error` |
| Webhooks | `webhook` |

---

## 7. API Sections — Full Endpoint Detail

All amounts unless stated otherwise are in **Naira** (`amountNaira`) or **Kobo** (`amountKobo`). 100 kobo = 1 naira.  
All IDs are **UUID** format (`string, format: uuid`).  
All timestamps are **ISO 8601** (`string, format: date-time`).

---

### 7.1 Authentication

**Section ID:** `section-auth`  
**Tag:** `Authentication`  
**Description:** User registration flow (OTP → register), PIN management, and admin login.

---

#### `POST /auth/otp/registration`
**Summary:** Send OTP for registration  
**Auth:** None  
**Description:** Sends a 6-digit OTP to the provided phone number as the first step of user registration.

**Request Body** (`application/json`):
```json
{
  "phoneNumber": "08012345678"
}
```
- `phoneNumber`: required, pattern `^0[0-9]{10}$`

**Response 200:**
```json
{
  "success": true,
  "message": "OTP sent",
  "data": {
    "message": "OTP sent to your phone",
    "phoneNumber": "08012345678",
    "expiresAt": "2026-04-28T10:10:00Z",
    "reference": "otp-ref-abc123"
  },
  "timestamp": "2026-04-28T10:00:00Z"
}
```

---

#### `POST /auth/register`
**Summary:** Register new user  
**Auth:** None  
**Description:** Completes user registration. Requires a valid OTP obtained from `POST /auth/otp/registration`.

**Request Body:**
```json
{
  "phoneNumber": "08012345678",
  "firstName": "Chidi",
  "lastName": "Okafor",
  "otpCode": "123456"
}
```
- `phoneNumber`: required, pattern `^0[0-9]{10}$`
- `firstName`: max 120 chars
- `lastName`: max 120 chars
- `otpCode`: required, pattern `^[0-9]{6}$`

**Response 200:** `{ "success": true, "message": "Registration successful", "data": null, "timestamp": "..." }`

---

#### `POST /auth/otp/pin-setup`
**Summary:** Send OTP for PIN setup  
**Auth:** None  
**Description:** Triggers OTP for first-time PIN setup after registration.

**Request Body:** Same as `/auth/otp/registration` — `{ "phoneNumber": "08012345678" }`

**Response 200:** Same shape as `/auth/otp/registration` response.

---

#### `POST /auth/pin/set`
**Summary:** Set PIN for first time  
**Auth:** None  
**Description:** Sets a 4-digit transaction PIN. Requires OTP verification. PIN is used for wallet transactions.

**Request Body:**
```json
{
  "phoneNumber": "08012345678",
  "otpCode": "123456",
  "pin": "1234"
}
```
- `pin`: required, pattern `^[0-9]{4}$`

**Response 200:** `{ "success": true, "message": "PIN set successfully", "data": null }`

---

#### `POST /auth/pin/change`
**Summary:** Change existing PIN  
**Auth:** Bearer token  
**Description:** Changes an existing transaction PIN. All three fields are required and must be 4 digits.

**Request Body:**
```json
{
  "oldPin": "1234",
  "newPin": "5678",
  "confirmNewPin": "5678"
}
```

**Response 200:** `{ "success": true, "message": "PIN changed successfully", "data": null }`

---

### 7.2 Account

**Section ID:** `section-account`  
**Tag:** `Account`  
**Description:** User profile management.

---

#### `GET /account/profile`
**Auth:** Bearer token  
**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "phoneNumber": "08012345678",
    "firstName": "Chidi",
    "lastName": "Okafor",
    "email": "chidi@example.com"
  }
}
```

---

#### `PUT /account/profile`
**Auth:** Bearer token  
**Description:** Updates user profile. All fields are optional — only include fields to change.

**Request Body:**
```json
{
  "firstName": "Chidi",
  "lastName": "Okafor",
  "email": "chidi@example.com",
  "dateOfBirth": "1995-06-15",
  "address": "12 Akin Street",
  "city": "Lagos",
  "state": "Lagos"
}
```
- `firstName`, `lastName`: max 100 chars each
- `email`: max 255 chars

**Response 200:** `{ "success": true, "message": "Profile updated", "data": null }`

---

### 7.3 Wallet

**Section ID:** `section-wallet`  
**Tag:** `Wallet`

---

#### `GET /wallets/balance`
**Auth:** Bearer token  
**Response 200:**
```json
{
  "success": true,
  "data": {
    "walletId": "uuid",
    "accountNumber": "1234567890",
    "balanceNaira": 15000.00,
    "balanceKobo": 1500000,
    "status": "ACTIVE"
  }
}
```

---

#### `POST /wallets/fund`
**Summary:** Fund wallet via bank transfer  
**Auth:** Bearer token  
**Description:** Records an inbound bank transfer to fund the wallet.

**Request Body:**
```json
{
  "amountKobo": 500000,
  "sourceBank": "GTBank",
  "sourceAccountNumber": "0123456789",
  "sourceAccountName": "John Doe",
  "narration": "Wallet top-up",
  "reference": "TRF-2026-001"
}
```
- `amountKobo`: required, minimum 100 (= ₦1)

**Response 200:** `{ "success": true, "message": "Wallet funded successfully", "data": "TRF-2026-001" }`

---

### 7.4 KYC Verification

**Section ID:** `section-kyc`  
**Tag:** `KYC Verification`  
**Description:** Identity verification to upgrade user tier. Tier 0 = unverified. Tier 1/2 unlock higher transaction limits.

**KYC providers:** `PREMBLY`, `SMILE_ID`  
**KYC statuses:** `PENDING` → `PROCESSING` → `VERIFIED` | `FAILED` | `REJECTED`

---

#### `POST /kyc/verify/bvn`
**Auth:** Bearer token  
**Description:** Submits BVN for Tier 2 verification. User ID is extracted from the JWT by the backend.

**Request Body:**
```json
{ "bvn": "12345678901" }
```
- `bvn`: 11-digit number, pattern `^[0-9]{11}$`

**Response 200:**
```json
{
  "success": true,
  "data": {
    "verificationId": "uuid",
    "provider": "PREMBLY",
    "status": "PENDING",
    "idType": "BVN",
    "requestedTier": "TIER_2",
    "createdAt": "2026-04-28T10:00:00Z",
    "message": "Verification submitted"
  }
}
```

---

#### `POST /kyc/verify/nin`
**Auth:** Bearer token  
**Description:** Submits NIN for Tier 2 verification.

**Request Body:**
```json
{ "nin": "12345678901" }
```
- Same 11-digit pattern as BVN

**Response 200:** Same shape as BVN response with `"idType": "NIN"`.

---

#### `GET /kyc/status`
**Auth:** Bearer token  
**Description:** Returns full verification status for the current user.

**Response 200:**
```json
{
  "success": true,
  "data": {
    "verificationId": "uuid",
    "provider": "PREMBLY",
    "status": "VERIFIED",
    "idType": "BVN",
    "requestedTier": "TIER_2",
    "approvedTier": "TIER_2",
    "verifiedFirstName": "Chidi",
    "verifiedLastName": "Okafor",
    "verifiedPhone": "08012345678",
    "verifiedDateOfBirth": "1995-06-15",
    "submittedAt": "2026-04-28T10:00:00Z",
    "processedAt": "2026-04-28T10:01:00Z",
    "providerResponseCode": "00",
    "providerResponseMessage": "Successful"
  }
}
```

---

#### `GET /kyc/check`
**Auth:** Bearer token  
**Description:** Quick boolean check — has the current user completed KYC?

**Response 200:** `{ "success": true, "data": true }`

---

### 7.5 NIP Transfers

**Section ID:** `section-nip`  
**Tag:** `NIP Transfers`  
**Description:** Interbank (NIP/NBS) transfers to external bank accounts.

**Flow:** `name-enquiry` → `fee-estimate` → `initiate transfer`

---

#### `POST /transfers/nip/name-enquiry`
**Auth:** Bearer token (`bearerAuth`)  
**Description:** Verifies an external bank account and retrieves the account holder name before initiating a transfer. Store the `sessionId` from the response and pass it to the initiate endpoint.

**Request Body:**
```json
{
  "bankCode": "058",
  "accountNumber": "0123456789"
}
```
- `bankCode`: 3-digit, pattern `\d{3}`
- `accountNumber`: 10-digit, pattern `\d{10}`

**Response 200:**
```json
{
  "success": true,
  "data": {
    "success": true,
    "bankCode": "058",
    "bankName": "GTBank",
    "accountNumber": "0123456789",
    "accountName": "John Doe",
    "sessionId": "session-abc123",
    "message": "Account found"
  }
}
```

---

#### `POST /transfers/nip/fee-estimate`
**Auth:** Bearer token  
**Description:** Returns the fee and total deduction for a given transfer amount.

**Request Body:**
```json
{ "amount": 50000 }
```
- `amount`: minimum 100 (₦100)

**Response 200:**
```json
{
  "success": true,
  "data": {
    "transferAmount": 50000.00,
    "fee": 26.88,
    "total": 50026.88,
    "message": "Fee calculated"
  }
}
```

---

#### `POST /transfers/nip`
**Summary:** Initiate NIP transfer  
**Auth:** Bearer token  
**Description:** Executes the interbank transfer. Use `idempotencyKey` to safely retry on network failure.

**Request Body:**
```json
{
  "recipientBankCode": "058",
  "recipientAccountNumber": "0123456789",
  "recipientAccountName": "John Doe",
  "nameEnquirySessionId": "session-abc123",
  "amount": 50000,
  "description": "School fees",
  "pin": "1234",
  "idempotencyKey": "unique-key-001"
}
```
- `amount`: required, minimum 100
- `pin`: 4-digit pattern `\d{4}`

**Response 200:**
```json
{
  "success": true,
  "data": {
    "transferId": "uuid",
    "reference": "NIP-2026-001",
    "status": "PENDING",
    "amount": 50000.00,
    "fee": 26.88,
    "recipientBankCode": "058",
    "recipientAccountNumber": "0123456789",
    "recipientAccountName": "John Doe",
    "message": "Transfer initiated",
    "createdAt": "2026-04-28T10:00:00Z"
  }
}
```

---

#### `GET /transfers/nip/banks`
**Auth:** Bearer token  
**Description:** Returns the list of all supported banks and their 3-digit NIP codes.

**Response 200:**
```json
{
  "success": true,
  "data": {
    "banks": [
      { "bankCode": "058", "bankName": "Guaranty Trust Bank", "shortName": "GTBank" },
      { "bankCode": "044", "bankName": "Access Bank", "shortName": "Access" }
    ],
    "message": "Banks retrieved"
  }
}
```

---

#### `GET /transfers/nip/{transferId}`
**Auth:** Bearer token  
**Path param:** `transferId` — UUID  
**Description:** Retrieves full details of a specific NIP transfer by ID.

**Response 200:** Full `NipTransferResponse` — includes `status`, `amount`, `fee`, `recipientAccountNumber`, `recipientAccountName`, `providerReference`, `providerResponseCode`, `createdAt`, `updatedAt`.

---

### 7.6 P2P Transfers

**Section ID:** `section-p2p`  
**Tag:** `transfer-controller`  
**Description:** Wallet-to-wallet transfers between Solexpay users. No bank involved.

---

#### `POST /transfers/p2p/recipient-lookup`
**Auth:** Bearer token  
**Description:** Looks up a Solexpay user by phone number or account number before initiating a transfer.

**Query param:** `identifier` (required) — phone number or internal account number

**Response 200:**
```json
{
  "success": true,
  "data": {
    "found": true,
    "userId": "uuid",
    "phoneNumber": "08012345678",
    "accountNumber": "9012345678",
    "firstName": "Amaka",
    "lastName": "Eze",
    "message": "User found"
  }
}
```

---

#### `POST /transfers/p2p`
**Auth:** Bearer token  
**Description:** Transfers funds between two Solexpay wallets instantly.

**Request Body:**
```json
{
  "recipientIdentifier": "08012345678",
  "amountNaira": 5000,
  "pin": "1234",
  "description": "Sending money",
  "idempotencyKey": "key-001"
}
```
- `recipientIdentifier`: max 20 chars
- `amountNaira`: required
- `pin`: exactly 4 chars

**Response 200:**
```json
{
  "success": true,
  "data": {
    "transferId": "uuid",
    "transactionId": "uuid",
    "reference": "P2P-2026-001",
    "status": "COMPLETED",
    "amountNaira": 5000.00,
    "amountKobo": 500000,
    "recipient": {
      "userId": "uuid",
      "phoneNumber": "08012345678",
      "accountNumber": "9012345678",
      "firstName": "Amaka",
      "lastName": "Eze"
    },
    "description": "Sending money",
    "completedAt": "2026-04-28T10:00:00Z",
    "createdAt": "2026-04-28T10:00:00Z"
  }
}
```

---

#### `GET /transfers/p2p/history`
**Auth:** Bearer token  
**Query:** `limit` (integer, default: 20) — number of transfers to return  
**Response 200:** Array of `TransferHistoryItem` objects — `transferId`, `status`, `amountNaira`, `amountKobo`, `senderUserId`, `recipientUserId`, `description`, `completedAt`, `createdAt`.

---

#### `GET /transfers/p2p/{transferId}`
**Auth:** Bearer token  
**Path param:** `transferId` — UUID  
**Response 200:** Single `TransferHistoryItem`.

---

### 7.7 Transactions

**Section ID:** `section-transactions`  
**Tag:** `transaction-controller`  
**Description:** Full transaction ledger for a user. Uses **cursor-based pagination** (not page/size).

**Transaction types (enum):** `DEPOSIT`, `WITHDRAWAL`, `P2P_TRANSFER`, `NIP_OUTBOUND`, `NIP_INBOUND`, `LOAN_DISBURSEMENT`, `LOAN_REPAYMENT`, `SAVINGS_DEPOSIT`, `SAVINGS_WITHDRAWAL`, `BILL_PAYMENT`, `FEE`, `REVERSAL`

**Transaction statuses:** `PENDING`, `COMPLETED`, `FAILED`, `REVERSED`

---

#### `GET /transactions`
**Auth:** Bearer token  
**Description:** Returns paginated transaction history using cursor-based pagination. Pass `nextCursor` from the previous response to load the next page.

**Query params:**

| Param | Type | Required | Default | Description |
|---|---|---|---|---|
| `cursor` | string | No | — | Cursor from previous response |
| `limit` | integer | No | 20 | Items per page |

**Response 200:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "transactionId": "uuid",
        "reference": "TXN-001",
        "type": "DEPOSIT",
        "status": "COMPLETED",
        "amountNaira": 5000.00,
        "amountKobo": 500000,
        "senderWalletId": "uuid",
        "recipientWalletId": "uuid",
        "description": "Wallet funding",
        "createdAt": "2026-04-28T10:00:00Z",
        "completedAt": "2026-04-28T10:00:01Z"
      }
    ],
    "nextCursor": "cursor-string-for-next-page",
    "hasMore": true
  }
}
```

---

#### `GET /transactions/{transactionId}`
**Auth:** Bearer token  
**Path param:** `transactionId` — UUID  
**Response 200:** Single `TransactionResponse` object.

---

#### `GET /transactions/{transactionId}/ledger-entries`
**Auth:** Bearer token  
**Description:** Returns the double-entry ledger breakdown for a transaction (useful for debugging or reconciliation).

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "entryId": "uuid",
      "transactionId": "uuid",
      "entryType": "DEBIT",
      "amountNaira": 5000.00,
      "balanceAfterNaira": 10000.00,
      "description": "P2P transfer out",
      "createdAt": "2026-04-28T10:00:00Z"
    }
  ]
}
```

---

### 7.8 Loans

**Section ID:** `section-loans`  
**Tag:** `loan-controller`

**Loan lifecycle:**
```
SUBMITTED → VERIFIED (school) → APPROVED (ops) → ACCEPTED (student) → DISBURSED → ACTIVE → PAID
         ↘ REJECTED           ↘ REJECTED       ↘ CANCELLED
                                                  ↘ OVERDUE (if missed payments)
```

**Loan statuses (enum):** `SUBMITTED`, `VERIFIED`, `APPROVED`, `ACCEPTED`, `REJECTED`, `CANCELLED`, `DISBURSED`, `ACTIVE`, `PAID`, `OVERDUE`

---

#### `POST /loans/apply`
**Auth:** Bearer token (student)  
**Description:** Student applies for a school education loan.

**Request Body:**
```json
{
  "schoolId": "uuid",
  "amountNaira": 150000,
  "purpose": "Tuition Fees",
  "academicLevel": "300 Level",
  "academicSession": "2025/2026",
  "idempotencyKey": "loan-key-001"
}
```
- `amountNaira`: required, minimum 1000
- `schoolId`: required UUID

**Response 200:** Full `LoanApplicationResponse` (see schema in section 9).

---

#### `GET /loans/my-loans`
**Auth:** Bearer token (student)  
**Description:** Returns all loan applications for the currently authenticated student.

**Response 200:** Array of `LoanApplicationResponse`.

---

#### `GET /loans/{loanId}`
**Auth:** Bearer token  
**Path param:** `loanId` — UUID  
**Response 200:** Single `LoanApplicationResponse` with all status timestamps.

---

#### `GET /loans/{loanId}/repayment-schedule`
**Auth:** Bearer token  
**Description:** Returns the installment-by-installment repayment schedule for an active/disbursed loan.

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "scheduleId": "uuid",
      "installmentNumber": 1,
      "amountNaira": 28750.00,
      "dueDate": "2026-05-28",
      "status": "PENDING",
      "paidAmountNaira": 0,
      "paidAt": null,
      "transactionId": null
    }
  ]
}
```
**Schedule statuses:** `PENDING`, `DUE`, `PARTIALLY_PAID`, `PAID`, `OVERDUE`, `WAIVED`

---

#### `POST /loans/{loanId}/student-accept`
**Auth:** Bearer token (student)  
**Description:** Student accepts an approved loan offer. Requires an e-signature reference. A cooling-off period begins (set by ops, max 72 hours) during which the student may cancel.

**Request Body:**
```json
{ "eSignReference": "esign-doc-id-or-ref" }
```

**Response 200:** Updated `LoanApplicationResponse` with status `ACCEPTED` and `coolingOffPeriodEnd`.

---

#### `POST /loans/{loanId}/student-cancel`
**Auth:** Bearer token (student)  
**Description:** Student cancels a loan they applied for or accepted (during cooling-off).

**Request Body:**
```json
{ "reason": "No longer needed" }
```

**Response 200:** Updated `LoanApplicationResponse` with status `CANCELLED`.

---

### 7.9 Loan Repayment

**Section ID:** `section-repayment`  
**Tag:** `Loan Repayment`

---

#### `GET /loans/{loanId}/repayments/schedule`
**Auth:** Bearer token  
**Description:** Returns the structured repayment schedule as `InstallmentDto` objects.

**Response 200:** Array of `InstallmentDto` — `installmentNumber`, `dueDate`, `totalAmount`, `principal`, `interest`, `remainingBalance`.

---

#### `GET /loans/{loanId}/repayments/balance`
**Summary:** Get outstanding loan balance  
**Auth:** Bearer token

**Response 200:**
```json
{
  "success": true,
  "data": {
    "loanId": "uuid",
    "totalPrincipalOutstanding": 90000.00,
    "totalInterestOutstanding": 13500.00,
    "totalPenaltyOutstanding": 0.00,
    "totalOutstanding": 103500.00,
    "installmentsRemaining": 4,
    "installmentsOverdue": 0,
    "nextDueDate": "2026-05-28",
    "nextInstallmentAmount": 28750.00
  }
}
```

---

#### `POST /loans/{loanId}/repayments`
**Summary:** Make a loan repayment  
**Auth:** Bearer token

**Request Body:**
```json
{
  "amount": 28750,
  "idempotencyKey": "repay-key-001",
  "notes": "Monthly installment"
}
```
- `amount`: required

**Response 200:**
```json
{
  "success": true,
  "data": {
    "paymentId": "uuid",
    "loanId": "uuid",
    "amountPaid": 28750.00,
    "principalAllocated": 25000.00,
    "interestAllocated": 3750.00,
    "penaltyAllocated": 0.00,
    "remainingBalance": 75000.00,
    "status": "SUCCESS",
    "transactionReference": "REP-2026-001",
    "paidAt": "2026-04-28T10:00:00Z",
    "message": "Repayment recorded"
  }
}
```

---

#### `POST /loans/{loanId}/repayments/preview`
**Summary:** Preview amortization schedule  
**Auth:** Bearer token  
**Description:** Generates a full amortization table for a hypothetical loan without creating one.

**Request Body:**
```json
{
  "principalKobo": 15000000,
  "annualInterestRate": 15.0,
  "numberOfMonths": 6,
  "firstPaymentDate": "2026-05-28"
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "principal": 150000.00,
    "totalInterest": 22500.00,
    "totalAmount": 172500.00,
    "numberOfInstallments": 6,
    "installments": [
      {
        "installmentNumber": 1,
        "dueDate": "2026-05-28",
        "totalAmount": 28750.00,
        "principal": 25000.00,
        "interest": 3750.00,
        "remainingBalance": 125000.00
      }
    ]
  }
}
```

---

### 7.10 Savings

**Section ID:** `section-savings`  
**Tag:** `savings-controller`

**Account types:** `REGULAR`, `TARGET`, `EMERGENCY`  
**Account statuses:** `ACTIVE`, `CLOSED`, `FROZEN`

---

#### `POST /savings/accounts`
**Auth:** Bearer token  
**Description:** Creates a new savings account.

**Request Body:**
```json
{
  "accountName": "School Fees 2027",
  "accountType": "TARGET",
  "purpose": "Saving for next semester fees",
  "targetAmountNaira": 200000,
  "targetDate": "2027-01-01",
  "annualInterestRate": 8.5
}
```
- `accountType`: required

**Response 200:** Full `SavingsAccountResponse`.

---

#### `GET /savings/accounts`
**Auth:** Bearer token  
**Response 200:** Array of all `SavingsAccountResponse` for the current user.

---

#### `GET /savings/accounts/{accountId}`
**Auth:** Bearer token  
**Response 200:** Single `SavingsAccountResponse`.

**`SavingsAccountResponse` shape:**
```json
{
  "accountId": "uuid",
  "userId": "uuid",
  "accountName": "School Fees 2027",
  "accountType": "TARGET",
  "balanceNaira": 45000.00,
  "targetAmountNaira": 200000.00,
  "totalAccruedInterestNaira": 320.50,
  "annualInterestRate": 8.5,
  "status": "ACTIVE",
  "purpose": "Saving for next semester fees",
  "targetDate": "2027-01-01",
  "createdAt": "2026-01-15T09:00:00Z",
  "closedAt": null
}
```

---

#### `POST /savings/deposit`
**Auth:** Bearer token  
**Description:** Moves funds from the user's wallet into a savings account.

**Request Body:**
```json
{
  "savingsAccountId": "uuid",
  "amountNaira": 5000,
  "idempotencyKey": "sav-dep-001"
}
```
- `amountNaira`: required, minimum 100

**Response 200:** Updated `SavingsAccountResponse`.

---

#### `POST /savings/withdraw`
**Auth:** Bearer token  
**Description:** Moves funds from a savings account back to the user's wallet.

**Request Body:** Same shape as deposit.

**Response 200:** Updated `SavingsAccountResponse`.

---

#### `POST /savings/accounts/{accountId}/close`
**Auth:** Bearer token  
**Description:** Closes a savings account. Any remaining balance is moved to the user's wallet.

**Response 200:** `SavingsAccountResponse` with `status: "CLOSED"` and `closedAt` populated.

---

#### `GET /savings/accounts/{accountId}/interest-history`
**Auth:** Bearer token  
**Query params:** `startDate`, `endDate` (strings, ISO date format, optional)

**Response 200:** Array of `SavingsInterestAccrualResponse`:
```json
[{
  "accrualId": "uuid",
  "savingsAccountId": "uuid",
  "accrualDate": "2026-04-01",
  "openingBalanceNaira": 40000.00,
  "closingBalanceNaira": 40009.32,
  "interestRate": 8.5,
  "accruedInterestNaira": 9.32,
  "isCompounded": true,
  "createdAt": "2026-04-01T00:01:00Z"
}]
```

---

### 7.11 Bills & VTU

**Section ID:** `section-bills`  
**Tag:** `bills-controller`

**Bill types (enum):** `AIRTIME`, `DATA`, `CABLE`, `ELECTRICITY`, `INTERNET`  
**Payment statuses:** `PENDING`, `SUCCESS`, `FAILED`, `REFUNDED`  
**Providers (airtime/data):** `mtn`, `airtel`, `glo`, `etisalat`, `9mobile`

---

#### `POST /bills/airtime`
**Auth:** Bearer token

**Request Body:**
```json
{
  "walletId": "uuid",
  "providerCode": "mtn",
  "phoneNumber": "08012345678",
  "amountNaira": 500,
  "idempotencyKey": "airt-001"
}
```
- `amountNaira`: required, minimum 50
- `providerCode`: pattern `^(mtn|airtel|glo|etisalat|9mobile)$`
- `phoneNumber`: pattern `^0[7-9][0-1][0-9]{8}$`

**Response 200:** Full `BillPaymentResponse`.

---

#### `POST /bills/data`
**Auth:** Bearer token

**Request Body:**
```json
{
  "walletId": "uuid",
  "providerCode": "mtn",
  "variationCode": "mtn-1gb-30days",
  "phoneNumber": "08012345678",
  "amountNaira": 1500,
  "idempotencyKey": "data-001"
}
```
- `amountNaira`: required, minimum 100

**Response 200:** Full `BillPaymentResponse`.

---

#### `GET /bills/data/variations/{providerCode}`
**Auth:** Bearer token  
**Description:** Returns available data bundle options for a mobile provider.  
**Path param:** `providerCode` — e.g. `mtn`, `airtel`

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "variationCode": "mtn-1gb-30days",
      "name": "MTN 1GB — 30 Days",
      "amount": { "value": "1500" },
      "fixedPrice": "true"
    }
  ]
}
```

---

#### `POST /bills/{paymentId}/query`
**Auth:** Bearer token  
**Description:** Queries the live status of a bill payment from the provider. Use when a payment is stuck in `PENDING`.

**Response 200:** Updated `BillPaymentResponse`.

---

#### `GET /bills/{paymentId}`
**Auth:** Bearer token  
**Response 200:** Single `BillPaymentResponse`.

---

#### `GET /bills/history`
**Auth:** Bearer token  
**Response 200:** Array of all `BillPaymentResponse` for the current user.

---

### 7.12 Notifications

**Section ID:** `section-notifications`  
**Tag:** `Notifications`

**Channels (enum):** `SMS`, `EMAIL`, `PUSH`  
**Statuses (enum):** `PENDING`, `SENDING`, `SENT`, `DELIVERED`, `FAILED`, `READ`

---

#### `GET /notifications`
**Auth:** Bearer token

**Query params:**

| Param | Type | Default | Description |
|---|---|---|---|
| `page` | integer | 0 | Page number |
| `size` | integer | 20 | Page size |
| `sortBy` | string | `createdAt` | Sort field |
| `sortOrder` | string | `DESC` | `ASC` or `DESC` |
| `unreadOnly` | boolean | — | Filter to unread only |

**Response 200:** Spring `Page<Notification>` — `content[]`, `totalElements`, `totalPages`, `size`, `number`, `first`, `last`, `empty`.

---

#### `GET /notifications/unread-count`
**Auth:** Bearer token  
**Response 200:** `{ "success": true, "data": 7 }` (integer count)

---

#### `POST /notifications/{notificationId}/read`
**Auth:** Bearer token  
**Response 200:** `{ "success": true, "data": null }`

---

#### `POST /notifications/read-all`
**Auth:** Bearer token  
**Response 200:** `{ "success": true, "data": null }`

---

#### `DELETE /notifications/{notificationId}`
**Auth:** Bearer token  
**Response 200:** `{ "success": true, "data": null }`

---

### 7.13 Admin Dashboard

**Section ID:** `section-admin`  
**Tag:** `Admin Dashboard`  
**Auth required on all endpoints:** Bearer token with ADMIN role.

---

#### `GET /admin/dashboard/metrics`
**Summary:** System-wide KPIs  
**Response 200:**
```json
{
  "success": true,
  "data": {
    "totalUsers": 14820,
    "activeUsersToday": 312,
    "newUsersToday": 47,
    "usersByTier1": 5400,
    "usersByTier2": 8100,
    "usersByTier3": 0,
    "transactionVolumeToday": 48200000.00,
    "transactionVolumeThisMonth": 620000000.00,
    "transactionCountToday": 1240,
    "transactionCountThisMonth": 23410,
    "totalLoans": 512,
    "activeLoans": 204,
    "overdueLoans": 18,
    "totalLoanPortfolio": 52000000.00,
    "totalOutstandingPrincipal": 38000000.00,
    "totalInterestEarned": 4200000.00,
    "defaultRate": 3.5,
    "totalSavingsBalance": 9800000.00,
    "activeSavingsAccounts": 843,
    "savingsInterestPaid": 124000.00,
    "reportDate": "2026-04-28",
    "period": "DAILY"
  }
}
```

---

#### `GET /admin/users`
**Summary:** Search and list users  
**Description:** All filter params are passed as query params via the `UserSearchRequest` schema.

**Query params (from `UserSearchRequest`):**

| Param | Type | Description |
|---|---|---|
| `phoneNumber` | string | Filter by phone number |
| `email` | string | Filter by email |
| `kycTier` | string | `TIER_1` or `TIER_2` |
| `status` | string | `ACTIVE` or `SUSPENDED` |
| `createdFrom` | date | e.g. `2026-01-01` |
| `createdTo` | date | e.g. `2026-04-28` |
| `sortBy` | string | Sort field |
| `sortOrder` | string | `ASC` or `DESC` |
| `page` | integer | 0-indexed |
| `size` | integer | Page size |

**Response 200:** `Page<UserSummaryDto>` — each item has `id`, `phoneNumber`, `email`, `firstName`, `lastName`, `kycTier`, `status`, `role`, `createdAt`, `suspendedAt`, `suspensionReason`.

---

#### `GET /admin/transactions`
**Summary:** All system transactions  
**Query params:** `page` (default 0), `size` (default 50), `status`, `type`  
**Response 200:** `Page<Transaction>` — full transaction entity including `type` (12-value enum), `status`, `amountKobo`, `amountNaira`, wallet IDs, `metadataJson`, `failureReason`.

---

#### `GET /admin/loans`
**Summary:** Search and list all loans  
**Query params (from `LoanSearchRequest`):**

| Param | Type | Description |
|---|---|---|
| `status` | string | Loan status filter |
| `schoolId` | string (UUID) | Filter by school |
| `studentId` | string (UUID) | Filter by student |
| `createdFrom` | date | Start date |
| `createdTo` | date | End date |
| `overdueOnly` | boolean | Only overdue loans |
| `sortBy` | string | Sort field |
| `sortOrder` | string | `ASC` or `DESC` |
| `page` | integer | 0-indexed |
| `size` | integer | Page size |

**Response 200:** `Page<LoanSummaryDto>` — `id`, `studentId`, `studentName`, `schoolId`, `schoolName`, `amount`, `status`, `submittedAt`, `disbursedAt`, `outstandingPrincipal`, `outstandingInterest`, `installmentsRemaining`, `isOverdue`.

---

#### `GET /admin/loans/overdue`
**Query params:** `page` (default 0), `size` (default 20)  
**Response 200:** `Page<LoanSummaryDto>` filtered to overdue only.

---

#### `POST /admin/users/{userId}/suspend`
**Path param:** `userId` — UUID  
**Query param:** `reason` (string, **required**)  
**Response 200:** `{ "success": true, "data": null }`

---

#### `POST /admin/users/{userId}/reactivate`
**Path param:** `userId` — UUID  
**Response 200:** `{ "success": true, "data": null }`

---

#### `POST /admin/kyc/{verificationId}/approve`
**Summary:** Manually approve KYC  
**Path param:** `verificationId` — UUID  
**Response 200:** `{ "success": true, "data": null }`

---

#### `POST /admin/broadcast`
**Summary:** Send system-wide notification  
**Description:** Sends a notification to a targeted audience segment.

**Request Body:**
```json
{
  "title": "System Maintenance",
  "message": "Scheduled downtime on Sunday 2am–4am WAT.",
  "targetAudience": "ALL_USERS",
  "actionUrl": "https://solexpay.com/status",
  "imageUrl": null,
  "priority": "HIGH"
}
```
- `targetAudience` (required, enum): `ALL_USERS`, `ACTIVE_USERS`, `INACTIVE_USERS`, `KYC_VERIFIED`, `KYC_PENDING`, `HAS_LOANS`, `HAS_SAVINGS`, `ADMINS_ONLY`, `SCHOOLS_ONLY`
- `priority` (enum): `LOW`, `NORMAL`, `HIGH`, `URGENT`

**Response 200:** `{ "success": true, "data": null }`

---

### 7.14 School Portal

**Section ID:** `section-school`  
**Tag:** `School Portal`  
**Description:** Endpoints used by verified schools to view their students' loans, verify enrollment, and manage school-side loan actions.

---

#### `POST /school/auth/login`
**Auth:** None  
**Description:** School portal login. Returns a school-scoped JWT.

**Request Body:**
```json
{ "email": "admin@unilag.edu.ng", "password": "SecurePass123" }
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "schoolId": "uuid",
    "schoolName": "University of Lagos",
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

#### `GET /school/dashboard`
**Auth:** Bearer token (School role)

**Response 200:**
```json
{
  "success": true,
  "data": {
    "schoolId": "uuid",
    "schoolName": "University of Lagos",
    "totalStudents": 124,
    "totalLoansSubmitted": 312,
    "loansVerified": 280,
    "loansPendingVerification": 14,
    "loansRejected": 18,
    "totalLoanAmount": 42000000.00,
    "averageLoanAmount": 134615.38,
    "lastUpdated": "2026-04-28T08:00:00Z"
  }
}
```

---

#### `GET /school/students`
**Auth:** Bearer token (School role)  
**Description:** Returns all students who have loans associated with this school.

**Response 200:** Array of `StudentLoanSummaryDto` — `studentId`, `studentName`, `studentPhone`, `academicLevel`, `academicSession`, `totalLoans`, `totalAmount`, `activeLoans`, `completedLoans`, `lastLoanDate`.

---

#### `GET /school/verifications/pending`
**Auth:** Bearer token (School role)  
**Description:** Returns all loan applications awaiting school-side enrollment verification.

**Response 200:** Array of `LoanApplication` entities.

---

#### `POST /school/loans/{loanId}/verify`
**Summary:** Verify student enrollment  
**Auth:** Bearer token (School role)  
**Path param:** `loanId` — UUID  
**Query param:** `verifiedBy` (string, required) — name or ID of the school staff member

**Response 200:** `{ "success": true, "data": null }`

---

#### `POST /loans/{loanId}/school-verify`
**Auth:** Bearer token  
**Description:** School verifies a loan application via the loan route.

**Request Body:**
```json
{
  "verifiedBy": "Admissions Office",
  "rejectionReason": null
}
```

**Response 200:** Updated `LoanApplicationResponse`.

---

#### `POST /loans/{loanId}/school-reject`
**Auth:** Bearer token  
**Description:** School rejects a loan application (student not enrolled, etc.).

**Request Body:**
```json
{
  "verifiedBy": "Admissions Office",
  "rejectionReason": "Student is not enrolled in the current academic session."
}
```

**Response 200:** Updated `LoanApplicationResponse` with status `REJECTED`.

---

#### `GET /loans/school-pending`
**Auth:** Bearer token  
**Query param:** `schoolId` (UUID, required)  
**Response 200:** Array of `LoanApplicationResponse` pending this school's review.

---

### Loan Operations (Ops)

**Section ID:** `section-ops`

---

#### `GET /loans/ops-pending`
**Auth:** Bearer token (OPS/ADMIN role)  
**Response 200:** Array of all loans in `OPS_REVIEW` status.

---

#### `POST /loans/{loanId}/ops-approve`
**Auth:** Bearer token (OPS/ADMIN role)

**Request Body:**
```json
{
  "reviewedBy": "ops-user-id-or-name",
  "coolingOffHours": 24,
  "rejectionReason": null
}
```
- `coolingOffHours`: optional, 1–72 hours the student has to cancel after accepting

**Response 200:** Updated `LoanApplicationResponse` with status `APPROVED`.

---

#### `POST /loans/{loanId}/ops-reject`
**Auth:** Bearer token (OPS/ADMIN role)

**Request Body:**
```json
{
  "reviewedBy": "ops-user-id-or-name",
  "rejectionReason": "Credit score below minimum threshold."
}
```

**Response 200:** Updated `LoanApplicationResponse` with status `REJECTED`.

---

### Webhooks

**Section ID:** `section-webhooks`  
**Note:** These are **inbound** endpoints called by third-party providers — not by your frontend.

#### `POST /webhooks/nip/anchor`
- Called by Anchor (the payment provider) to report NIP transfer status updates.
- Requires `X-Anchor-Signature` header for HMAC verification.

#### `POST /kyc/webhook/{provider}`
- Called by KYC providers (Prembly, Smile ID) with verification results.
- Path param: `provider` (provider name)
- Query param: `reference` (required)

---

## 8. Global Response Envelope

Every API response follows this wrapper:

```json
{
  "success": true,
  "message": "Human-readable status message",
  "data": { ... },
  "timestamp": "2026-04-28T10:00:00Z"
}
```

For paginated responses, `data` is a Spring `Page` object:

```json
{
  "data": {
    "content": [...],
    "totalElements": 100,
    "totalPages": 5,
    "size": 20,
    "number": 0,
    "sort": { "sorted": true, "empty": false, "unsorted": false },
    "numberOfElements": 20,
    "first": true,
    "last": false,
    "empty": false,
    "pageable": {
      "paged": true,
      "pageNumber": 0,
      "pageSize": 20,
      "offset": 0
    }
  }
}
```

For cursor-based responses (`GET /transactions`), `data` is:

```json
{
  "data": {
    "items": [...],
    "nextCursor": "cursor-string",
    "hasMore": true
  }
}
```

---

## 9. Schemas Reference Section

**Section ID:** `section-schemas`

Use a tab or accordion layout — one tab per schema. Render each as a field table with Type, Required, Constraints, and Description columns.

### Key schemas to document:

| Schema | Description |
|---|---|
| `ProfileDto` | User profile |
| `WalletBalanceResponse` | Wallet state |
| `KycStatusResponse` | Full KYC verification record |
| `KycVerifyResponse` | Response from BVN/NIN submission |
| `TransactionResponse` | Individual transaction |
| `LedgerEntryResponse` | Double-entry ledger line |
| `LoanApplicationResponse` | Full loan application with all timestamps |
| `LoanApplication` | Raw loan entity (used in school portal) |
| `LoanSummaryDto` | Admin loan list item |
| `LoanRepaymentScheduleResponse` | Installment schedule line |
| `InstallmentDto` | Amortization schedule line |
| `OutstandingBalanceDto` | Loan balance breakdown |
| `RepaymentResponse` | Repayment receipt |
| `SavingsAccountResponse` | Savings account state |
| `SavingsInterestAccrualResponse` | Daily interest accrual record |
| `BillPaymentResponse` | Bill/VTU payment receipt |
| `DataVariationResponse` | Data bundle option |
| `TransferReceiptResponse` | P2P transfer receipt |
| `NipTransferResponse` | NIP transfer details |
| `InitiateNipResponse` | NIP initiation result |
| `NameEnquiryResponseDto` | Bank account name lookup result |
| `FeeEstimateResponse` | Transfer fee breakdown |
| `BankInfo` | Bank name and code |
| `Notification` | Full notification entity |
| `UserSummaryDto` | Admin user list item |
| `SchoolDashboardDto` | School portal dashboard metrics |
| `StudentLoanSummaryDto` | Student in school portal |
| `DashboardMetricsDto` | Admin dashboard KPIs |
| `SendOtpResponse` | OTP dispatch confirmation |

---

## 10. Error Codes Section

**Section ID:** `section-errors`

### HTTP Status Codes

| Status | Name | When it occurs |
|---|---|---|
| `400` | Bad Request | Missing required field, pattern mismatch (e.g. BVN not 11 digits), invalid JSON |
| `401` | Unauthorized | Missing `Authorization` header, expired or invalid JWT |
| `403` | Forbidden | Valid token, wrong role (e.g. student accessing admin endpoint) |
| `404` | Not Found | UUID does not exist in the database |
| `409` | Conflict | Idempotency key collision, duplicate OTP request too quickly |
| `422` | Unprocessable Entity | Business rule violation — approving an already-approved KYC, insufficient wallet balance, loan already accepted |
| `500` | Internal Server Error | Unexpected server failure — safe to retry after brief delay |

### Standard Error Body

```json
{
  "success": false,
  "message": "Validation failed",
  "data": null,
  "timestamp": "2026-04-28T10:00:00Z"
}
```

### Common Validation Errors

| Field | Rule | Error |
|---|---|---|
| `phoneNumber` | Must match `^0[0-9]{10}$` | "Phone number must be 11 digits starting with 0" |
| `bvn` / `nin` | Must match `^[0-9]{11}$` | "BVN/NIN must be exactly 11 digits" |
| `pin` | Must match `^[0-9]{4}$` | "PIN must be exactly 4 digits" |
| `otpCode` | Must match `^[0-9]{6}$` | "OTP must be exactly 6 digits" |
| `amountNaira` | Minimum 100 for NIP | "Amount must be at least ₦100" |
| `bankCode` | Must match `\d{3}` | "Bank code must be 3 digits" |
| `accountNumber` | Must match `\d{10}` | "Account number must be 10 digits" |
| `providerCode` | Enum: mtn/airtel/glo/etisalat/9mobile | "Invalid provider code" |

---

## 11. Angular Component Skeleton

**File:** `src/app/pages/docs.page.ts`

```typescript
import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-docs',
  standalone: true,
  imports: [CommonModule],
  template: `
    <!-- HERO -->
    <!-- ... section 5.1 ... -->

    <div class="max-w-6xl mx-auto px-4 py-10 flex gap-8">

      <!-- LEFT NAV (hidden below lg) -->
      <!-- ... section 5.6 ... -->

      <!-- MAIN CONTENT -->
      <main class="flex-1 min-w-0 space-y-16">

        <!-- Auth banner -->
        <!-- ... section 5.2 ... -->

        <!-- Section: Authentication -->
        <section id="section-auth">
          <!-- section header, then endpoint cards -->
        </section>

        <!-- Section: Account -->
        <section id="section-account"> ... </section>

        <!-- Section: Wallet -->
        <section id="section-wallet"> ... </section>

        <!-- ... all other sections ... -->

        <!-- Section: Schemas -->
        <section id="section-schemas"> ... </section>

        <!-- Section: Error Codes -->
        <section id="section-errors"> ... </section>

        <!-- Section: Webhooks -->
        <section id="section-webhooks"> ... </section>

      </main>
    </div>

    <!-- FOOTER -->
    <footer class="border-t border-outline-variant py-8 mt-16">
      <div class="max-w-6xl mx-auto px-4 flex flex-wrap items-center justify-between gap-4">
        <div class="flex items-center gap-2">
          <img src="/logo-icon.png" alt="" class="h-6 w-auto" />
          <span class="text-sm font-semibold text-on-surface">Solexpay</span>
        </div>
        <p class="text-xs text-on-surface-variant">© 2026 SolexPay. All rights reserved.</p>
        <a href="http://api.solexpay.com.ng/swagger-ui/index.html" target="_blank"
           class="text-xs text-primary hover:underline inline-flex items-center gap-1">
          <span class="material-symbols-outlined text-[14px]">open_in_new</span>
          Interactive API Explorer
        </a>
      </div>
    </footer>
  `
})
export class DocsPageComponent {
  // Tracks which endpoint cards are expanded
  private expanded = signal<Set<string>>(new Set());

  isExpanded(id: string): boolean {
    return this.expanded().has(id);
  }

  toggle(id: string): void {
    const s = new Set(this.expanded());
    s.has(id) ? s.delete(id) : s.add(id);
    this.expanded.set(s);
  }

  scrollTo(sectionId: string): void {
    document.getElementById(sectionId)?.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
  }

  methodBadge(method: string): string {
    const map: Record<string, string> = {
      GET:    'bg-tertiary/10 text-tertiary',
      POST:   'bg-primary/10 text-primary',
      PUT:    'bg-amber-100 text-amber-800',
      PATCH:  'bg-amber-100 text-amber-800',
      DELETE: 'bg-error/10 text-error',
    };
    const color = map[method] ?? 'bg-surface-container text-on-surface-variant';
    return `inline-flex items-center font-mono font-bold text-xs px-2.5 py-1 rounded-lg uppercase ${color}`;
  }
}
```

---

## Summary of All Endpoints

| # | Method | Path | Auth | Tag |
|---|---|---|---|---|
| 1 | POST | `/auth/otp/registration` | None | Auth |
| 2 | POST | `/auth/register` | None | Auth |
| 3 | POST | `/auth/otp/pin-setup` | None | Auth |
| 4 | POST | `/auth/pin/set` | None | Auth |
| 5 | POST | `/auth/pin/change` | Bearer | Auth |
| 6 | GET | `/account/profile` | Bearer | Account |
| 7 | PUT | `/account/profile` | Bearer | Account |
| 8 | GET | `/wallets/balance` | Bearer | Wallet |
| 9 | POST | `/wallets/fund` | Bearer | Wallet |
| 10 | POST | `/kyc/verify/bvn` | Bearer | KYC |
| 11 | POST | `/kyc/verify/nin` | Bearer | KYC |
| 12 | GET | `/kyc/status` | Bearer | KYC |
| 13 | GET | `/kyc/check` | Bearer | KYC |
| 14 | POST | `/kyc/webhook/{provider}` | None | KYC |
| 15 | POST | `/transfers/nip/name-enquiry` | Bearer | NIP |
| 16 | POST | `/transfers/nip/fee-estimate` | Bearer | NIP |
| 17 | POST | `/transfers/nip` | Bearer | NIP |
| 18 | GET | `/transfers/nip/banks` | Bearer | NIP |
| 19 | GET | `/transfers/nip/{transferId}` | Bearer | NIP |
| 20 | POST | `/transfers/p2p/recipient-lookup` | Bearer | P2P |
| 21 | POST | `/transfers/p2p` | Bearer | P2P |
| 22 | GET | `/transfers/p2p/history` | Bearer | P2P |
| 23 | GET | `/transfers/p2p/{transferId}` | Bearer | P2P |
| 24 | GET | `/transactions` | Bearer | Transactions |
| 25 | GET | `/transactions/{transactionId}` | Bearer | Transactions |
| 26 | GET | `/transactions/{transactionId}/ledger-entries` | Bearer | Transactions |
| 27 | POST | `/loans/apply` | Bearer | Loans |
| 28 | GET | `/loans/my-loans` | Bearer | Loans |
| 29 | GET | `/loans/{loanId}` | Bearer | Loans |
| 30 | GET | `/loans/{loanId}/repayment-schedule` | Bearer | Loans |
| 31 | POST | `/loans/{loanId}/student-accept` | Bearer | Loans |
| 32 | POST | `/loans/{loanId}/student-cancel` | Bearer | Loans |
| 33 | GET | `/loans/{loanId}/repayments/schedule` | Bearer | Loan Repayment |
| 34 | GET | `/loans/{loanId}/repayments/balance` | Bearer | Loan Repayment |
| 35 | POST | `/loans/{loanId}/repayments` | Bearer | Loan Repayment |
| 36 | POST | `/loans/{loanId}/repayments/preview` | Bearer | Loan Repayment |
| 37 | POST | `/savings/accounts` | Bearer | Savings |
| 38 | GET | `/savings/accounts` | Bearer | Savings |
| 39 | GET | `/savings/accounts/{accountId}` | Bearer | Savings |
| 40 | POST | `/savings/deposit` | Bearer | Savings |
| 41 | POST | `/savings/withdraw` | Bearer | Savings |
| 42 | POST | `/savings/accounts/{accountId}/close` | Bearer | Savings |
| 43 | GET | `/savings/accounts/{accountId}/interest-history` | Bearer | Savings |
| 44 | POST | `/bills/airtime` | Bearer | Bills |
| 45 | POST | `/bills/data` | Bearer | Bills |
| 46 | GET | `/bills/data/variations/{providerCode}` | Bearer | Bills |
| 47 | POST | `/bills/{paymentId}/query` | Bearer | Bills |
| 48 | GET | `/bills/{paymentId}` | Bearer | Bills |
| 49 | GET | `/bills/history` | Bearer | Bills |
| 50 | GET | `/notifications` | Bearer | Notifications |
| 51 | GET | `/notifications/unread-count` | Bearer | Notifications |
| 52 | POST | `/notifications/{notificationId}/read` | Bearer | Notifications |
| 53 | POST | `/notifications/read-all` | Bearer | Notifications |
| 54 | DELETE | `/notifications/{notificationId}` | Bearer | Notifications |
| 55 | GET | `/admin/dashboard/metrics` | Bearer (Admin) | Admin |
| 56 | GET | `/admin/users` | Bearer (Admin) | Admin |
| 57 | GET | `/admin/transactions` | Bearer (Admin) | Admin |
| 58 | GET | `/admin/loans` | Bearer (Admin) | Admin |
| 59 | GET | `/admin/loans/overdue` | Bearer (Admin) | Admin |
| 60 | POST | `/admin/users/{userId}/suspend` | Bearer (Admin) | Admin |
| 61 | POST | `/admin/users/{userId}/reactivate` | Bearer (Admin) | Admin |
| 62 | POST | `/admin/kyc/{verificationId}/approve` | Bearer (Admin) | Admin |
| 63 | POST | `/admin/broadcast` | Bearer (Admin) | Admin |
| 64 | POST | `/school/auth/login` | None | School |
| 65 | GET | `/school/dashboard` | Bearer (School) | School |
| 66 | GET | `/school/students` | Bearer (School) | School |
| 67 | GET | `/school/verifications/pending` | Bearer (School) | School |
| 68 | POST | `/school/loans/{loanId}/verify` | Bearer (School) | School |
| 69 | POST | `/loans/{loanId}/school-verify` | Bearer | School/Loans |
| 70 | POST | `/loans/{loanId}/school-reject` | Bearer | School/Loans |
| 71 | GET | `/loans/school-pending` | Bearer | School/Loans |
| 72 | GET | `/loans/ops-pending` | Bearer (Ops) | Ops |
| 73 | POST | `/loans/{loanId}/ops-approve` | Bearer (Ops) | Ops |
| 74 | POST | `/loans/{loanId}/ops-reject` | Bearer (Ops) | Ops |
| 75 | POST | `/webhooks/nip/anchor` | Signature | Webhook |
