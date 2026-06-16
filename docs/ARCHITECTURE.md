# VISIT Car Wash — System Architecture

## Tech Stack

### Frontend
| Layer | Technology | Why |
|-------|-----------|-----|
| Framework | Next.js 14 (App Router) | SSR, SEO, API routes |
| UI Library | React 18 | Component model |
| Styling | Tailwind CSS | Utility-first, fast iteration |
| Animations | Framer Motion | Premium micro-interactions |
| Types | TypeScript | Type safety at scale |
| State | Zustand | Lightweight, no boilerplate |
| Realtime | Socket.io-client | Live tracking, notifications |
| Forms | React Hook Form | Performant form handling |
| Charts | Recharts | Admin analytics |

### Backend
| Layer | Technology | Why |
|-------|-----------|-----|
| Runtime | Node.js | JS everywhere |
| Framework | NestJS | Scalable, typed, modular |
| ORM | Prisma | Type-safe DB queries |
| Database | PostgreSQL | ACID, spatial queries |
| Cache | Redis | Sessions, rate limiting |
| Realtime | Socket.io | WebSocket gateway |
| Queue | Bull (Redis) | Order matching, notifications |
| Auth | JWT + Refresh tokens | Stateless auth |

### Infrastructure
| Service | Provider |
|---------|---------|
| Hosting | Vercel (frontend) + Railway / EC2 (backend) |
| Database | Supabase / AWS RDS |
| Maps | Google Maps API / Mapbox |
| Push Notifications | Firebase Cloud Messaging |
| SMS/OTP | Eskiz.uz / SMSC |
| Payments | Click + Payme (Uzbekistan) |
| File Storage | AWS S3 / Cloudflare R2 |
| CDN | Cloudflare |
| Monitoring | Sentry + Grafana |

---

## Microservice Boundaries (MVP → Scale path)

```
┌─────────────────────────────────────────────────────┐
│                    CLIENTS                          │
│   Web App    Worker App    Admin    Telegram Bot    │
└──────────────────────┬──────────────────────────────┘
                       │ HTTPS / WSS
┌──────────────────────▼──────────────────────────────┐
│                  API GATEWAY                        │
│         (NestJS / Next.js API Routes)               │
│   Auth   │   Rate Limit   │   Request Validation    │
└──────┬───┴────────────────┴────────────┬────────────┘
       │                                 │
┌──────▼──────────┐             ┌────────▼────────────┐
│  ORDER SERVICE  │             │  WORKER SERVICE     │
│  - Create order │             │  - Location updates │
│  - Match worker │             │  - Accept/reject    │
│  - Status FSM   │             │  - Earnings calc    │
└──────┬──────────┘             └────────┬────────────┘
       │                                 │
┌──────▼─────────────────────────────────▼────────────┐
│              REALTIME SERVICE (Socket.io)            │
│   - Worker GPS broadcasting                         │
│   - Order status events                             │
│   - Push notifications                              │
└──────────────────────┬──────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────┐
│                   DATABASE LAYER                    │
│   PostgreSQL (main)  │  Redis (cache/queue/session) │
└─────────────────────────────────────────────────────┘
```

---

## Order State Machine

```
PENDING → ACCEPTED → EN_ROUTE → ARRIVED → IN_PROGRESS → COMPLETED
    ↘          ↘        ↘          ↘            ↘
  CANCELLED  CANCELLED CANCELLED CANCELLED    CANCELLED (< 5 min refund)
```

**Transitions:**
- `PENDING` → `ACCEPTED`: Worker accepts within 60s window
- `PENDING` → `CANCELLED`: No worker accepts (auto-reassign after 90s)
- `ACCEPTED` → `EN_ROUTE`: Worker taps "Navigate"
- `EN_ROUTE` → `ARRIVED`: GPS within 50m of customer OR manual tap
- `ARRIVED` → `IN_PROGRESS`: Worker taps "Start"
- `IN_PROGRESS` → `COMPLETED`: Worker uploads after-photos + taps "Complete"

---

## Worker Matching Algorithm

```
1. Find workers where:
   - isOnline = true
   - distance ≤ maxRadius (default 15km)
   - no active orders
   - rating ≥ 3.5

2. Score = (1 / distance) * 0.4 + rating * 0.3 + completedToday * 0.3

3. Broadcast to top 3 workers simultaneously

4. First to accept gets the order

5. If no acceptance within 60s → expand radius by 5km, repeat
```

---

## AI Features

### Weather Integration
- Pulls forecast from OpenWeatherMap
- If rain expected < 24h: notify users with discount push
- Dynamic pricing: +10% during peak hours (7–9am, 5–7pm)

### Recommendations Engine
- Input: Last wash date, weather, car type, wash history
- Output: Recommended service + urgency score
- Frequency: Daily background job

### Car Health Score
- Calculated from: wash frequency, service type history, elapsed days
- Range: 0–100 (shown in user dashboard)
- Decreases ~2pts/day since last wash

---

## MVP Roadmap

### Phase 1 — Core (Weeks 1–6)
- [ ] Auth (email, phone OTP)
- [ ] Order creation & booking flow
- [ ] Worker app (accept/reject, navigate)
- [ ] Live GPS tracking (Socket.io)
- [ ] Payment integration (Click + Payme)
- [ ] Basic admin panel

### Phase 2 — Polish (Weeks 7–10)
- [ ] Before/after photos
- [ ] Rating system
- [ ] Push notifications (FCM)
- [ ] Subscription plans
- [ ] Loyalty points
- [ ] Promo codes

### Phase 3 — Intelligence (Weeks 11–16)
- [ ] AI wash recommendations
- [ ] Dynamic pricing
- [ ] Weather integration
- [ ] Car health score
- [ ] Worker performance analytics
- [ ] Fraud detection

### Phase 4 — Scale (Month 5+)
- [ ] Multi-city rollout
- [ ] Partner API (fleet management)
- [ ] iOS/Android native apps
- [ ] Telegram Mini App
- [ ] Gamification & achievements
- [ ] B2B corporate accounts

---

## Security Checklist
- [x] JWT with short expiry (15min) + refresh tokens (7d)
- [x] Rate limiting: 100 req/min per IP, 10 auth attempts/hour
- [x] Input validation (class-validator / Zod)
- [x] SQL injection prevention (Prisma parameterized queries)
- [x] Payment webhook signature verification
- [x] HTTPS only, HSTS headers
- [x] CORS whitelist
- [x] Sensitive data encryption at rest (PII fields)
- [x] Fraud detection: unusual payment patterns flagged

---

## Environment Variables

```bash
# Database
DATABASE_URL="postgresql://user:pass@host:5432/visit_db"
REDIS_URL="redis://localhost:6379"

# Auth
JWT_SECRET="super-secret-key"
JWT_EXPIRES_IN="15m"
REFRESH_TOKEN_SECRET="refresh-secret"

# Payments
CLICK_MERCHANT_ID="..."
CLICK_SECRET_KEY="..."
PAYME_MERCHANT_ID="..."
PAYME_SECRET_KEY="..."

# Maps
GOOGLE_MAPS_API_KEY="..."
MAPBOX_TOKEN="..."

# Push Notifications
FIREBASE_SERVER_KEY="..."

# SMS (OTP)
ESKIZ_EMAIL="..."
ESKIZ_PASSWORD="..."

# Storage
AWS_ACCESS_KEY_ID="..."
AWS_SECRET_ACCESS_KEY="..."
AWS_BUCKET_NAME="visit-photos"
AWS_REGION="eu-central-1"

# Weather
OPENWEATHER_API_KEY="..."

# Telegram
TELEGRAM_BOT_TOKEN="..."
```
