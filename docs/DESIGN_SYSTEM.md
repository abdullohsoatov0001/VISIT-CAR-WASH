# VISIT Design System

## Brand Identity

**Name:** VISIT
**Tagline:** "Your car, cleaned while you work."
**Tone:** Premium, tech-forward, trustworthy, efficient

---

## Color Palette

### Core
| Token | Hex | Usage |
|-------|-----|-------|
| `background` | `#0A0A0F` | App background |
| `surface` | `#111118` | Sidebar, nav |
| `surface-card` | `#16161E` | Cards, modals |
| `surface-border` | `#1E1E2E` | Default borders |
| `surface-border-light` | `#2A2A3E` | Hover borders |

### Brand
| Token | Hex | Usage |
|-------|-----|-------|
| `brand-blue` | `#0EA5E9` | Primary CTA, accents |
| `brand-blue-dark` | `#0284C7` | Hover states |
| `brand-blue-glow` | `#38BDF8` | Glow effects |
| `brand-cyan` | `#06B6D4` | Secondary accent |
| `brand-purple` | `#8B5CF6` | Premium features |

### Semantic
| Token | Usage |
|-------|-------|
| `emerald-400` | Success, online, completed |
| `yellow-400` | Ratings, Gold tier |
| `orange-400` | Warnings, urgent |
| `red-400` | Errors, cancel |

---

## Typography

| Style | Font | Weight | Size | Usage |
|-------|------|--------|------|-------|
| Display H1 | Inter | 900 Black | 64–96px | Hero headlines |
| H1 | Inter | 800 ExtraBold | 40–56px | Section titles |
| H2 | Inter | 700 Bold | 28–36px | Card titles |
| Body | Inter | 400 Regular | 14–16px | General text |
| Caption | Inter | 500 Medium | 11–12px | Labels, badges |
| Mono | JetBrains Mono | 500 | 12px | Order IDs, prices |

---

## Spacing Scale
```
4px  → xs     (gap-1)
8px  → sm     (gap-2)
12px → base   (gap-3)
16px → md     (gap-4)
20px → lg     (gap-5)
24px → xl     (gap-6)
32px → 2xl    (gap-8)
48px → 3xl    (gap-12)
64px → 4xl    (gap-16)
```

---

## Border Radius
```
8px  → rounded-lg   (inputs)
12px → rounded-xl   (buttons, badges)
16px → rounded-2xl  (cards)
20px → rounded-3xl  (modals, major cards)
24px → rounded-4xl  (hero elements)
```

---

## Animation Principles

### Easing
- **Default UI motion:** `cubic-bezier(0.23, 1, 0.32, 1)` — snappy feel
- **Micro interactions:** `spring(stiffness: 400, damping: 25)`
- **Page transitions:** `easeOut` 500–700ms

### Timing
| Action | Duration |
|--------|----------|
| Hover state | 150–200ms |
| Card float | 400ms |
| Page transition | 500–600ms |
| Counter animation | 1800ms |
| Chart bars | 800ms staggered |
| Gradient shifts | 4–8s loop |

### Key animations used
1. **Hero car float:** `y: [-8, 8, -8]` 6s loop
2. **Gradient text:** animated `background-position`
3. **Map route:** `pathLength: 0 → 1` 2s
4. **Worker car:** translate along route
5. **Progress bars:** width 0 → target, 1s delay after mount
6. **Stat counters:** numeric easing from 0
7. **Meteor lines:** diagonal translate + opacity
8. **Orb glows:** radial gradient blobs (static, CSS)
9. **Card entrance:** `y: 20 → 0, opacity: 0 → 1` with `whileInView`
10. **Active order pulse:** `scale: [1, 1.2, 1]` on status dot

---

## Component Library

### Atoms
- `Button` — primary/secondary/ghost/outline/danger/glass × sm/md/lg/xl
- `Badge` — default/blue/green/yellow/red/purple/outline × sm/md
- `Input` — with icon slots, error state, loading state
- `Avatar` — initials fallback, gradient backgrounds

### Molecules
- `Card` — hover/glow/glass/gradient variants
- `StatCard` — value + change + icon
- `OrderCard` — compact summary with status
- `WorkerCard` — profile + rating + contact actions
- `ServiceCard` — selectable service with price

### Organisms
- `Navbar` — with dropdown, mobile drawer
- `Sidebar` — user/worker/admin variants
- `BookingFlow` — 5-step multi-step form
- `TrackingView` — map + progress + worker card
- `AdminTable` — sortable, filterable data table

### Pages
- Landing (public)
- Login / Register (auth)
- User Dashboard
- Booking Flow
- Live Tracking
- Wash History
- Pricing
- Worker Dashboard
- Admin Panel
- Telegram Mini App

---

## Glassmorphism Recipe
```css
background: rgba(255, 255, 255, 0.03);
backdrop-filter: blur(20px);
-webkit-backdrop-filter: blur(20px);
border: 1px solid rgba(255, 255, 255, 0.06);
border-radius: 16px;
```

## Card Shadow Recipe
```css
/* Default card */
box-shadow: 0 4px 24px rgba(0, 0, 0, 0.4);

/* Hover card */
box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6),
            0 0 0 1px rgba(14, 165, 233, 0.1);

/* Brand glow */
box-shadow: 0 0 30px rgba(14, 165, 233, 0.3),
            0 0 60px rgba(14, 165, 233, 0.15);
```

---

## Mobile UX Principles
1. **Thumb Zone** — all primary actions in bottom 40% of screen
2. **Bottom Navigation** — max 4 tabs, icons + labels
3. **Bottom Sheets** — modals slide up from bottom
4. **Safe Area** — `env(safe-area-inset-bottom)` for iOS notch
5. **Touch Targets** — minimum 44×44px
6. **Gesture support** — swipe to go back, pull to refresh
7. **Haptic feedback** — on order confirmation, rating submission
