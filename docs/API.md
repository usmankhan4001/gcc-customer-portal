# GCC Startup Platform API

## Authentication

All API requests require a Bearer token:

```
Authorization: Bearer gcc_your_api_key_here
```

Keys are SHA-256 hashed and stored in the `api_keys` table. Each key has:
- Scoped permissions (`contacts:read`, `deals:write`, etc.)
- Rate limit (requests per minute, default 1000)
- Expiration date

## Base URL

Production: `https://gccstartup.com/api/v2`
Development: `http://localhost:3000/api/v2`

## Response Format

### Lists
```json
{
  "data": [...],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

### Single items
```json
{
  "data": { ... }
}
```

### Errors
```json
{
  "error": "Error message",
  "code": "VALIDATION_ERROR"
}
```

## Pagination

All list endpoints support cursor-based pagination:

| Parameter | Default | Description |
|---|---|---|
| `page` | 1 | Page number |
| `limit` | 20 | Items per page (max 100) |
| `search` | — | Full-text search |
| `sort` | created_at | Sort field |
| `order` | desc | Sort direction (asc/desc) |

---

## Endpoints

### Contacts

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/contacts` | List contacts (supports `?search`, `?filter[lifecycle_stage]`) |
| `POST` | `/contacts` | Create contact |
| `GET` | `/contacts/:id` | Get contact |
| `PATCH` | `/contacts/:id` | Update contact |
| `DELETE` | `/contacts/:id` | Delete contact (soft delete) |

### Companies

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/companies` | List companies |
| `POST` | `/companies` | Create company |
| `GET` | `/companies/:id` | Get company |
| `PATCH` | `/companies/:id` | Update company |
| `DELETE` | `/companies/:id` | Delete company |

### Deals

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/deals` | List deals |
| `POST` | `/deals` | Create deal |
| `GET` | `/deals/:id` | Get deal |
| `PATCH` | `/deals/:id` | Update deal |
| `DELETE` | `/deals/:id` | Delete deal |

### Leads

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/leads` | List leads |
| `POST` | `/leads` | Create lead |
| `GET` | `/leads/:id` | Get lead |
| `PATCH` | `/leads/:id` | Update lead |
| `DELETE` | `/leads/:id` | Delete lead |

### Conversations

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/conversations` | List conversations |
| `POST` | `/conversations` | Create conversation |
| `GET` | `/conversations/:id` | Get conversation |
| `PATCH` | `/conversations/:id` | Update conversation |
| `GET` | `/conversations/:id/messages` | List messages |
| `POST` | `/conversations/:id/messages` | Send message |

### Campaigns

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/campaigns` | List campaigns |
| `POST` | `/campaigns` | Create campaign |
| `GET` | `/campaigns/:id` | Get campaign |
| `PATCH` | `/campaigns/:id` | Update campaign |
| `DELETE` | `/campaigns/:id` | Delete campaign |
| `POST` | `/campaigns/:id/dispatch` | Dispatch campaign |

### Templates

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/templates` | List templates |
| `POST` | `/templates` | Create template |
| `GET` | `/templates/:id` | Get template |
| `PATCH` | `/templates/:id` | Update template |
| `DELETE` | `/templates/:id` | Delete template |

### Flows

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/flows` | List flows |
| `POST` | `/flows` | Create flow |
| `GET` | `/flows/:id` | Get flow |
| `PATCH` | `/flows/:id` | Update flow |
| `DELETE` | `/flows/:id` | Delete flow |

### Documents

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/documents` | List documents |
| `POST` | `/documents` | Register document |
| `GET` | `/documents/:id` | Get document |
| `DELETE` | `/documents/:id` | Delete document |
| `POST` | `/documents/presign` | Get presigned upload URL |

### Analytics

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/analytics` | Overview |
| `GET` | `/analytics/pipeline` | Pipeline analytics |
| `GET` | `/analytics/revenue` | Revenue analytics |
| `GET` | `/analytics/campaigns` | Campaign analytics |

### Webhooks

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/webhooks` | List webhooks |
| `POST` | `/webhooks` | Create webhook |
| `GET` | `/webhooks/:id` | Get webhook |
| `PATCH` | `/webhooks/:id` | Update webhook |
| `DELETE` | `/webhooks/:id` | Delete webhook |
| `POST` | `/webhooks/:id/test` | Test webhook |
| `GET` | `/webhooks/:id/deliveries` | Delivery history |
| `GET` | `/webhooks/events` | Available events |

### Documentation

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/docs` | OpenAPI 3.0.3 specification |

---

## Webhook Events

External services can subscribe to these events:

| Category | Event | Description |
|---|---|---|
| CRM | `contact.created` | New contact added |
| CRM | `contact.updated` | Contact modified |
| CRM | `deal.won` | Deal closed won |
| CRM | `deal.lost` | Deal closed lost |
| CRM | `lead.captured` | New lead captured |
| Conversations | `message.received` | Inbound message |
| Conversations | `conversation.assigned` | Conversation assigned to user |
| Campaigns | `campaign.dispatched` | Campaign started sending |
| Campaigns | `campaign.completed` | Campaign finished sending |
| Email | `email.sent` | Email sent to provider |
| Email | `email.opened` | Recipient opened email |
| Email | `email.clicked` | Recipient clicked link |
| Email | `email.bounced` | Email bounced |
| Support | `ticket.created` | New support ticket |
| Support | `ticket.resolved` | Ticket resolved |
| Orders | `order.paid` | Payment received |
| Orders | `order.payment_failed` | Payment failed |
| System | `user.created` | New user created |
| System | `user.role_changed` | User role changed |

### Webhook Payload

```json
{
  "event": "contact.created",
  "timestamp": "2025-01-15T10:30:00Z",
  "data": {
    "id": "abc-123",
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe"
  }
}
```

### Signature Verification

Webhooks are signed with HMAC-SHA256. Verify with:

```
X-GCC-Signature: sha256=<hmac-signature>
```

```typescript
import crypto from 'crypto'

function verifyWebhook(payload: string, signature: string, secret: string): boolean {
  const expected = crypto.createHmac('sha256', secret).update(payload).digest('hex')
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
}
```

---

## Rate Limiting

- Default: 1000 requests per minute per API key
- Configurable per key in the `api_keys` table
- Headers returned: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`
- On limit exceeded: `429 Too Many Requests`

---

## Permissions

API keys are scoped to specific permissions:

| Permission | Description |
|---|---|
| `contacts:read` | Read contacts |
| `contacts:write` | Create/update/delete contacts |
| `deals:read` | Read deals |
| `deals:write` | Create/update/delete deals |
| `campaigns:read` | Read campaigns |
| `campaigns:write` | Create/update/delete campaigns |
| `conversations:read` | Read conversations |
| `conversations:write` | Send messages |
| `analytics:read` | Read analytics |
| `webhooks:manage` | Manage webhooks |
| `admin` | Full access |
