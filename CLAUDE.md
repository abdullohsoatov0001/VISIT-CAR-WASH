# VISIT Car Wash — CLAUDE.md

## Project Overview
Premium mobile car wash startup MVP — "Uber for car washes."
Next.js 14 App Router, TypeScript, Tailwind CSS, Framer Motion.

## Key Commands
```bash
npm run dev      # Start development server (localhost:3000)
npm run build    # Production build
npm run lint     # ESLint
```

## Project Structure
```
app/
  page.tsx          → Landing page (public)
  login/            → Auth pages
  register/
  dashboard/        → User dashboard (protected)
  booking/          → 5-step booking flow
  tracking/         → Live GPS tracking
  history/          → Wash history & analytics
  payment/          → Cards & transactions
  pricing/          → Pricing & subscriptions
  worker/           → Worker dashboard
  admin/            → Admin panel
  telegram/         → Telegram Mini App

components/
  layout/Navbar.tsx → Top navigation
  ui/Button.tsx     → Primary button component
  ui/Card.tsx       → Card + StatCard
  ui/Badge.tsx      → Status badges

lib/utils.ts        → cn(), animation variants, formatters
prisma/schema.prisma → Full database schema
docs/API.md         → REST + WebSocket API reference
docs/ARCHITECTURE.md → System architecture & roadmap
docs/DESIGN_SYSTEM.md → Colors, typography, components
```

## Design System
- Background: `#0A0A0F`
- Cards: `#16161E`, border `#1E1E2E`
- Brand Blue: `#0EA5E9`
- Brand Purple: `#8B5CF6`
- All animations use Framer Motion
- `cn()` from `lib/utils.ts` for className merging

## Tech Stack
- Next.js 14 App Router + TypeScript
- Tailwind CSS (custom design tokens in tailwind.config.ts)
- Framer Motion for all animations
- Prisma + PostgreSQL (schema in prisma/schema.prisma)
- Socket.io for realtime tracking
- Click + Payme for payments (Uzbekistan)

## Key Design Decisions
- Dark theme only (no light mode)
- Glassmorphism used sparingly (glass, glass-blue CSS classes)
- All page components are "use client" for animation support
- Stagger animations via `whileInView` + `viewport: { once: true }`
- Premium hover: `whileHover={{ y: -4, scale: 1.01 }}`
