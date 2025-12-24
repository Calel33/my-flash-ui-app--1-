# 🗄️ Data Model

## 📊 Database Schema (Convex)

### `users`
Syncs with Clerk user data via webhooks.

| Field | Type | Description |
|-------|------|-------------|
| `name` | `string` | User's full name |
| `externalId` | `string` | Clerk User ID (JWT `sub` field) |

### `paymentAttempts`
Tracks subscription payment events from Clerk Billing.

| Field | Type | Description |
|-------|------|-------------|
| `payment_id` | `string` | Unique identifier for the payment |
| `userId` | `id("users")` | Reference to the user (optional) |
| `status` | `string` | Current status of the payment |
| `payer` | `object` | Payer details (email, name, Clerk user_id) |
| `totals` | `object` | Grand total, subtotal, and tax |
| `subscription_items` | `array` | List of plans and items included |

## 🔄 Relationships
- **User → PaymentAttempts**: 1 → Many relationship linked via `userId` (internal) or `payer.user_id` (external Clerk ID).

---
*Last updated: 2025-12-23*
