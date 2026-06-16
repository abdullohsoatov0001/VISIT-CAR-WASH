# VISIT Car Wash — API Reference

## Base URL
```
https://api.visit.uz/v1
```

## Authentication
All protected endpoints require:
```
Authorization: Bearer <jwt_token>
```

---

## Auth

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Create account |
| POST | `/auth/login` | Email/phone + password login |
| POST | `/auth/otp/send` | Send OTP to phone |
| POST | `/auth/otp/verify` | Verify OTP |
| POST | `/auth/telegram` | Telegram Mini App auth |
| POST | `/auth/refresh` | Refresh JWT |
| POST | `/auth/logout` | Invalidate token |

### POST /auth/register
```json
{
  "name": "Aziz Toshmatov",
  "email": "aziz@example.com",
  "phone": "+998901234567",
  "password": "securepass123",
  "role": "user"
}
```

---

## Orders

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/orders` | List user's orders |
| POST | `/orders` | Create new order |
| GET | `/orders/:id` | Get order details |
| PATCH | `/orders/:id/cancel` | Cancel order |
| GET | `/orders/:id/tracking` | Get tracking points |

### POST /orders
```json
{
  "serviceType": "PREMIUM",
  "addons": ["ceramic", "ozone"],
  "locationLat": 41.2995,
  "locationLng": 69.2401,
  "locationName": "Yunusobod, 12-house, B2",
  "scheduledAt": null,
  "paymentMethod": "CLICK",
  "promoCode": "FIRST20"
}
```

### Response
```json
{
  "id": "clx1234...",
  "orderNumber": "W-1048",
  "status": "PENDING",
  "basePrice": 99000,
  "totalPrice": 79200,
  "discount": 19800,
  "worker": null,
  "estimatedMinutes": null,
  "createdAt": "2025-06-11T10:30:00Z"
}
```

---

## Workers

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/workers/nearby` | Get nearby available workers |
| PATCH | `/workers/me/status` | Toggle online/offline |
| PATCH | `/workers/me/location` | Update GPS coordinates |
| GET | `/workers/me/orders` | Get assigned orders |
| POST | `/workers/orders/:id/accept` | Accept an order |
| POST | `/workers/orders/:id/reject` | Reject an order |
| POST | `/workers/orders/:id/complete` | Mark order complete |

### PATCH /workers/me/location
```json
{
  "lat": 41.3123,
  "lng": 69.2891,
  "speed": 45.2,
  "heading": 180
}
```

---

## Payments

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/payments/initiate` | Start payment flow |
| POST | `/payments/click/callback` | Click webhook |
| POST | `/payments/payme/callback` | Payme webhook |
| GET | `/payments/:id` | Payment status |
| POST | `/payments/:id/refund` | Request refund |

---

## Subscriptions

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/subscriptions/plans` | List available plans |
| POST | `/subscriptions` | Subscribe to a plan |
| GET | `/subscriptions/me` | Current subscription |
| PATCH | `/subscriptions/me` | Change plan |
| DELETE | `/subscriptions/me` | Cancel subscription |

---

## Tracking (WebSocket / Socket.io)

```javascript
// Connect
const socket = io('wss://api.visit.uz', {
  auth: { token: 'Bearer <jwt>' }
});

// Events emitted by CLIENT
socket.emit('location:update', { lat, lng, heading, speed });
socket.emit('order:accept', { orderId });
socket.emit('order:complete', { orderId });

// Events received by CLIENT
socket.on('order:new', (order) => { /* new order for worker */ });
socket.on('worker:location', ({ lat, lng, eta }) => { /* for user tracking */ });
socket.on('order:status', ({ orderId, status }) => { /* status update */ });
socket.on('notification', ({ type, title, body }) => { /* push-style */ });
```

---

## Reviews

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/reviews` | Submit review for order |
| GET | `/workers/:id/reviews` | Get worker reviews |

### POST /reviews
```json
{
  "orderId": "clx1234...",
  "rating": 5,
  "comment": "Excellent service, very thorough!",
  "tags": ["punctual", "thorough", "friendly"]
}
```

---

## Notifications

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/notifications` | List notifications |
| PATCH | `/notifications/:id/read` | Mark as read |
| PATCH | `/notifications/read-all` | Mark all read |

---

## Admin

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/stats/overview` | KPI dashboard data |
| GET | `/admin/stats/revenue` | Revenue breakdown |
| GET | `/admin/orders` | All orders (paginated) |
| GET | `/admin/users` | User management |
| GET | `/admin/workers` | Worker management |
| POST | `/admin/promo-codes` | Create promo code |
| GET | `/admin/alerts` | System alerts |
| GET | `/admin/heatmap` | Order density map data |

---

## Error Format
```json
{
  "error": {
    "code": "ORDER_NOT_FOUND",
    "message": "Order with id clx123 does not exist",
    "statusCode": 404
  }
}
```

## Common Error Codes
| Code | HTTP | Description |
|------|------|-------------|
| `UNAUTHORIZED` | 401 | Invalid/missing token |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `VALIDATION_ERROR` | 422 | Invalid request body |
| `NO_WORKERS_AVAILABLE` | 503 | No workers in area |
| `PAYMENT_FAILED` | 402 | Payment processing error |
