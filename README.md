# SolexPay Admin Portal

[![Vercel](https://img.shields.io/badge/Vercel-Deployed-black?style=flat&logo=vercel)](https://vercel.com)
[![Angular](https://img.shields.io/badge/Angular-17+-DD0031?style=flat&logo=angular)](https://angular.io)
[![Analog.js](https://img.shields.io/badge/Analog.js-1.22+-000000?style=flat)](https://analogjs.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-06B6D4?style=flat&logo=tailwindcss)](https://tailwindcss.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-3178C6?style=flat&logo=typescript)](https://typescriptlang.org)

A production-grade fintech admin dashboard featuring 40+ micro-interactions, industry-leading UX patterns inspired by Vercel, Stripe, and Google. Built with Analog.js (Angular 17+), Tailwind CSS, and the "Fluid Academicism" design system.

## 🚀 Live Demo

**Production URL:** [https://solexpay-admin.vercel.app](https://solexpay-admin.vercel.app)

## ✨ Key Features

### Peak-Level Micro-Interactions
- **Magnetic Buttons** - Physical attraction effect on hover
- **Morphing Buttons** - In-place state transitions (loading → success)
- **Scroll Reveal** - IntersectionObserver-powered entrance animations
- **Multi-layer Shimmer** - Vercel-style skeleton loading with diagonal glint
- **View Transitions** - Native-like page transitions
- **Confetti Celebrations** - Particle effects on KYC approvals
- **Floating Labels** - Material Design input animations
- **Smart Toasts** - Undoable actions with progress bars

### Core Interactions
- **Ripple Effects** - Material Design touch feedback
- **Count-up Animations** - Number transitions with easing
- **Hover Scale/Lift** - Subtle elevation changes
- **Shake on Error** - Form validation feedback
- **Pulse Animations** - Live indicator badges
- **Bounce Effects** - Success state feedback
- **Copy Feedback** - Clipboard operations with visual confirmation
- **Tooltip System** - Smart positioning with delay
- **Glow Effects** - CTA button emphasis
- **Badge Bounce** - Notification indicators

### Advanced UX Patterns
- **Smart Toast Service** - Undoable actions, auto-dismiss with progress
- **Intersection Observer** - Performance-optimized scroll animations
- **CSS View Transitions** - Page morphing animations
- **Reduced Motion Support** - Accessibility-first approach
- **GPU Acceleration** - Hardware-accelerated transforms

## 🎨 Design System: "Fluid Academicism"

A clean, minimal design language featuring:

- **No-line rule** - Borders via background color shifts, not lines
- **Tonal depth** - Blue-grey tinted shadows for subtle depth
- **Glassmorphism** - Backdrop blur on floating elements
- **Semantic colors** - primary/secondary/tertiary/error naming
- **Accessibility** - WCAG 2.1 AA compliant with reduced motion support

### Color Palette

```css
--primary: #005bbf       /* Trust Blue */
--secondary: #ff6b00     /* Action Orange */
--tertiary: #00c853      /* Success Green */
--error: #ff1744         /* Alert Red */
--surface: #f8f9fa       /* Background */
--on-surface: #191c1d    /* Primary Text */
```

## 🛠️ Technology Stack

| Category | Technology |
|----------|------------|
| **Framework** | Analog.js (Angular 17+ meta-framework) |
| **Styling** | Tailwind CSS 3.4 with custom design tokens |
| **State Management** | Angular Signals (no RxJS in templates) |
| **Icons** | Material Symbols (variable font) |
| **Typography** | Inter + Plus Jakarta Sans |
| **Animation** | CSS Animations + Web Animations API |
| **API** | TanStack Query (Angular Query) |
| **Build** | Vite 6 |

## 📦 Architecture

### BFF Pattern (Backend for Frontend)
```
Frontend (Analog.js)
    ↓ API Calls
Server Routes (Nitro)
    ↓ Proxy/Transform
Backend API (solexpay.com.ng)
```

### Dev vs Production Modes

**Development Mode:**
- Mock data in `src/server/utils/dev-mock.ts`
- No backend connection required
- Fast iteration

**Production Mode:**
- Real environment variables
- Live API integration
- Optimized builds

### File Structure
```
src/
├── app/
│   ├── pages/           # File-based routing
│   │   ├── (admin)/     # Admin layout group
│   │   │   ├── dashboard.page.ts
│   │   │   ├── users.page.ts
│   │   │   ├── kyc.page.ts
│   │   │   ├── loans.page.ts
│   │   │   └── transactions.page.ts
│   │   ├── login.page.ts
│   │   └── landing.page.ts
│   ├── components/
│   │   ├── ui/          # Reusable components
│   │   │   ├── metric-card.component.ts
│   │   │   ├── status-chip.component.ts
│   │   │   └── shimmer-skeleton.component.ts
│   │   ├── layout/      # Layout components
│   │   │   ├── admin-layout.component.ts
│   │   │   ├── sidebar.component.ts
│   │   │   └── toast-outlet.component.ts
│   │   └── landing/      # Landing page sections
│   ├── directives/       # 15+ custom directives
│   │   ├── index.ts      # Barrel exports
│   │   ├── ripple.directive.ts
│   │   ├── magnetic.directive.ts
│   │   ├── scroll-reveal.directive.ts
│   │   ├── morph-button.directive.ts
│   │   └── ...
│   ├── services/
│   │   ├── admin.service.ts
│   │   ├── auth.service.ts
│   │   ├── toast.service.ts
│   │   ├── confetti.service.ts
│   │   └── smart-toast.service.ts
│   └── guards/
│       └── auth.guard.ts
├── server/
│   ├── routes/api/       # API routes (BFF)
│   │   ├── auth/
│   │   ├── admin/
│   │   └── loans/
│   └── utils/
│       └── dev-mock.ts   # Mock data
└── styles.css           # Global styles + animations
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- pnpm 8+ (package manager)
- Git

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/solexpay-admin.git
cd solexpay-admin

# Install dependencies
pnpm install

# Start development server
pnpm dev

# Application runs on http://localhost:5173
```

### Build Commands

```bash
# Development build
pnpm build

# Production build (optimized)
pnpm build:prod

# Preview production build
pnpm preview
```

## 🎯 Usage Guide

### Using Micro-Interaction Directives

```typescript
import { 
  RippleDirective, 
  MagneticDirective, 
  ScrollRevealDirective,
  MorphButtonDirective 
} from './app/directives';

// Add to component imports
imports: [RippleDirective, MagneticDirective, ...]
```

**Ripple Effect:**
```html
<button solexRipple>Click me</button>
```

**Magnetic Effect:**
```html
<button magnetic>Attracts to cursor</button>
```

**Scroll Reveal:**
```html
<div scrollReveal>Reveals on scroll</div>
```

**Morphing Button:**
```html
<button solexRipple 
        [morphButton]="'loading'" 
        [morphState]="isLoading() ? 'loading' : null">
  Submit
</button>
```

### Confetti Service

```typescript
import { ConfettiService } from './app/services/confetti.service';

constructor(private confetti: ConfettiService) {}

// Quick celebration
this.confetti.quick();

// Success themed
this.confetti.success();

// Big celebration
this.confetti.big();

// Custom configuration
this.confetti.celebrate({
  particleCount: 200,
  spread: 100,
  duration: 4000
});
```

### Smart Toast with Undo

```typescript
import { SmartToastService } from './app/services/smart-toast.service';

// Show toast with undo capability
const actionId = this.smartToast.showWithUndo(
  'User suspended',
  () => this.undoSuspend(userId),
  5000 // 5 second timeout
);
```

## 📱 Responsive Design

Fully responsive across all breakpoints:

- **Mobile** (< 640px): Single column, optimized touch targets
- **Tablet** (640px - 1024px): Two column grids
- **Desktop** (> 1024px): Full dashboard layout with sidebar

## 🔒 Security

- JWT-based authentication
- Route guards for protected pages
- HTTP-only cookies in production
- CORS configured for API endpoints

## 🧪 Testing

```bash
# Run unit tests
pnpm test

# Run linting
pnpm lint
```

## 🚀 Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel

# Deploy to production
vercel --prod
```

### Environment Variables

Create `.env.local` for local development:

```env
# Go backend base URL the BFF (src/server) calls; it serves routes at / and /api/v1.
API_URL=http://localhost:3000
VITE_DEV_MODE=false
# "development" drops the Secure flag on the admin refresh-token cookie for http://localhost.
NODE_ENV=development
# Set to true only behind a proxy that appends the client IP to X-Forwarded-For
# (Vercel does). The BFF then forwards the LAST entry as the client IP; otherwise
# it forwards the socket peer and never trusts a browser-supplied header.
BFF_BEHIND_PROXY=false
# Same value as the backend's BFF_SHARED_SECRET (32+ characters). The BFF then
# signs the client IP so the backend's per-IP admin login limit applies per
# admin rather than to this app's shared egress IP. Leave unset to disable.
BFF_SHARED_SECRET=
```

The admin refresh token lives only in the HttpOnly `sx_admin_rt` cookie set by
the BFF; the browser never sees it.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is proprietary and confidential. All rights reserved © 2024 SolexPay.

## 🙏 Credits

- Design inspired by Vercel, Stripe, and Google's Material Design
- Icons by Google Material Symbols
- Typography by Google Fonts (Inter, Plus Jakarta Sans)
- Built with Analog.js team

## 📞 Support

For support, email support@solexpay.com or join our Slack channel.

---

**Built with ❤️ by the SolexPay Engineering Team**
