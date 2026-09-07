# Database Schema Documentation

> Complete schema reference for the GCC Startup Platform.
> Schema is defined in `packages/db/src/schema/` using Drizzle ORM.

---

## Schema Files

| File | Domain | Tables |
|---|---|---|
| `_shared.ts` | Common columns | timestampColumns, editorialColumns, seoColumns |
| `auth.ts` | Authentication | users, sessions, accounts, verifications |
| `rbac.ts` | Permissions | roles, permissions, role_permissions |
| `contacts.ts` | People | contacts |
| `crm.ts` | CRM | pipelines, pipeline_stages, deals, crm_notes, crm_tasks, crm_activities |
| `content.ts` | CMS content | pages, posts, revisions |
| `media.ts` | File storage | media, media_folders |
| `settings.ts` | Configuration | site_settings, redirects |
| `email.ts` | Email marketing | email_templates, email_campaigns, email_sends, email_suppressions |
| `messaging.ts` | WhatsApp/messaging | conversations, message_templates, messages |
| `automation.ts` | Automation | flows, flow_steps, flow_enrollments, flow_logs |
| `support.ts` | Support tickets | tickets, ticket_messages, canned_responses |
| `events.ts` | Event log | events, event_sinks |
| `tokens.ts` | API tokens | api_keys, webhooks, webhook_deliveries, outbox_jobs |

---

## Core Tables

### users

All platform users (staff + admin).

```sql
users
├── id (text, PK)                    -- Better Auth compatible text ID
├── email (varchar 255, unique, not null)
├── name (varchar 255)
├── email_verified (boolean, default false)
├── image (text)
├── password_hash (text)
├── role_id (text)                   -- references roles.id (no FK constraint)
├── is_active (boolean, default true)
├── created_at (timestamptz, default now())
└── updated_at (timestamptz, default now())
```

### contacts

The single source of truth for every person the business interacts with.

```sql
contacts
├── id (varchar 36, PK)
├── email (varchar 255)
├── phone (varchar 50)
├── first_name (varchar 100)
├── last_name (varchar 100)
├── display_name (varchar 200)
├── company (varchar 200)
├── job_title (varchar 200)
├── lifecycle_stage (enum: lead|subscriber|prospect|client|churned, default 'lead')
├── owner_id (varchar 36, FK → users, set null on delete)
├── source (varchar 100)             -- 'website', 'whatsapp', 'tool', 'referral', 'import'
├── tags (jsonb, default [])
├── custom_fields (jsonb, default {})
├── email_consent (enum: unknown|granted|denied, default 'unknown')
├── email_consent_at (timestamptz)
├── whatsapp_consent (enum: unknown|granted|denied, default 'unknown')
├── whatsapp_consent_at (timestamptz)
├── unsubscribed_at (timestamptz)
├── deleted_at (timestamptz)         -- soft delete
├── created_at (timestamptz, default now())
└── updated_at (timestamptz, default now())
```

### pipelines

CRM pipelines with configurable stages.

```sql
pipelines
├── id (varchar 36, PK)
├── name (varchar 200, not null)
├── description (text)
├── default_currency (varchar 3, default 'USD')
├── is_default (boolean, default false)
├── archived_at (timestamptz)
├── created_by (varchar 36, FK → users, set null on delete)
├── created_at (timestamptz, default now())
└── updated_at (timestamptz, default now())
```

### pipeline_stages

Ordered columns within a pipeline.

```sql
pipeline_stages
├── id (varchar 36, PK)
├── pipeline_id (varchar 36, FK → pipelines, cascade delete)
├── name (varchar 200, not null)
├── position (integer, not null)
├── kind (enum: open|won|lost, default 'open')
├── probability (integer, default 0)  -- 0-100
├── created_at (timestamptz, default now())
└── updated_at (timestamptz, default now())
```

### deals

Revenue opportunities tracked through pipeline stages.

```sql
deals
├── id (varchar 36, PK)
├── title (varchar 200, not null)
├── contact_id (varchar 36, FK → contacts, restrict delete)
├── pipeline_id (varchar 36, FK → pipelines, restrict delete)
├── stage_id (varchar 36, FK → pipeline_stages, restrict delete)
├── value (bigint, nullable)          -- minor units (cents/fils)
├── currency (varchar 3, default 'USD')
├── probability (integer, default 0)  -- overrides stage probability
├── owner_id (varchar 36, FK → users, set null on delete)
├── expected_close_date (date)
├── status (enum: open|won|lost, default 'open')
├── closed_at (timestamptz)
├── close_reason (text)
├── created_by (varchar 36, FK → users, set null on delete)
├── created_at (timestamptz, default now())
└── updated_at (timestamptz, default now())
```

### crm_notes

Notes attached to contacts or deals.

```sql
crm_notes
├── id (varchar 36, PK)
├── contact_id (varchar 36, FK → contacts, cascade delete)
├── deal_id (varchar 36, FK → deals, set null on delete)
├── body (text, not null)
├── author_id (varchar 36)
├── author_name (varchar 200)
├── created_at (timestamptz, default now())
└── updated_at (timestamptz, default now())
```

### crm_tasks

Tasks assigned to users.

```sql
crm_tasks
├── id (varchar 36, PK)
├── title (varchar 200, not null)
├── details (text)
├── assignee_id (varchar 36)
├── due_at (timestamptz)
├── completed_at (timestamptz)
├── completed_by (varchar 36)
├── priority (enum: low|normal|high, default 'normal')
├── contact_id (varchar 36, FK → contacts, set null on delete)
├── deal_id (varchar 36, FK → deals, set null on delete)
├── created_by (varchar 36, FK → users, set null on delete)
├── created_at (timestamptz, default now())
└── updated_at (timestamptz, default now())
```

### crm_activities

Calls and meetings logged against contacts.

```sql
crm_activities
├── id (varchar 36, PK)
├── contact_id (varchar 36, FK → contacts, cascade delete)
├── deal_id (varchar 36, FK → deals, set null on delete)
├── type (enum: call|meeting, not null)
├── direction (enum: inbound|outbound, not null)
├── subject (varchar 200)
├── notes (text)
├── occurred_at (timestamptz, not null)
├── duration_minutes (integer)
├── logged_by (varchar 36)
├── created_at (timestamptz, default now())
└── updated_at (timestamptz, default now())
```

---

## CMS Tables

### pages

Website pages with Puck block content.

```sql
pages
├── id (varchar 36, PK)
├── title (varchar 200, not null)
├── slug (varchar 200, unique, not null)
├── blocks (jsonb, default [])        -- Puck document
├── status (enum: draft|published|scheduled)
├── publish_at (timestamptz)
├── unpublish_at (timestamptz)
├── seo_title (varchar 200)
├── seo_description (text)
├── seo_og_image (text)
├── seo_no_index (boolean, default false)
├── seo_keywords (text)
├── aeo_answer (text)                 -- AI search optimization
├── author (varchar 200)
├── created_by (varchar 36)
├── updated_by (varchar 36)
├── created_at (timestamptz, default now())
└── updated_at (timestamptz, default now())
```

### posts

Blog posts.

```sql
posts
├── id (varchar 36, PK)
├── title (varchar 200, not null)
├── slug (varchar 200, unique, not null)
├── excerpt (text)
├── cover_image (text)
├── published_at (timestamptz)
├── category (varchar 100)
├── tags (jsonb, default [])
├── reading_time (integer)
├── blocks (jsonb, default [])        -- Puck document
├── status (enum: draft|published|scheduled)
├── publish_at (timestamptz)
├── unpublish_at (timestamptz)
├── seo_title (varchar 200)
├── seo_description (text)
├── seo_og_image (text)
├── seo_no_index (boolean, default false)
├── seo_keywords (text)
├── aeo_answer (text)
├── author (varchar 200)
├── created_by (varchar 36)
├── updated_by (varchar 36)
├── created_at (timestamptz, default now())
└── updated_at (timestamptz, default now())
```

### revisions

Content revision history for pages and posts.

```sql
revisions
├── id (varchar 36, PK)
├── entity_type (enum: page|post, not null)
├── entity_id (varchar 36, not null)
├── data (jsonb, not null)
├── author_id (varchar 36)
├── author_name (varchar 200)
└── created_at (timestamptz, default now())
```

---

## Messaging Tables

### conversations

One thread per contact per channel.

```sql
conversations
├── id (varchar 36, PK)
├── contact_id (varchar 36, FK → contacts, cascade delete)
├── channel (enum: whatsapp|web_chat|email|ticket)
├── last_inbound_at (timestamptz)
├── last_outbound_at (timestamptz)
├── last_message_at (timestamptz)
├── unread_count (integer, default 0)
├── state (enum: open|closed, default 'open')
├── closed_at (timestamptz)
├── assigned_to (varchar 36, FK → users, set null on delete)
├── metadata (jsonb, default {})
├── created_at (timestamptz, default now())
└── updated_at (timestamptz, default now())
```

### message_templates

WhatsApp message templates with Meta approval status.

```sql
message_templates
├── id (varchar 36, PK)
├── name (varchar 200, not null)
├── language (varchar 10, default 'en')
├── body (text, not null)
├── header (text)
├── footer (text)
├── placeholder_count (integer, default 0)
├── category (enum: marketing|utility|authentication, default 'utility')
├── status (enum: draft|pending|approved|rejected|disabled, default 'draft')
├── provider_template_id (varchar 255)
├── approved_at (timestamptz)
├── rejection_reason (text)
├── created_by (varchar 36)
├── updated_by (varchar 36)
├── created_at (timestamptz, default now())
└── updated_at (timestamptz, default now())
```

### messages

Individual messages within a conversation.

```sql
messages
├── id (varchar 36, PK)
├── conversation_id (varchar 36, FK → conversations, cascade delete)
├── direction (enum: inbound|outbound)
├── body (text, not null)
├── media_url (text)
├── message_ref (varchar 100, unique, not null)  -- idempotency key
├── provider_message_id (varchar 255)
├── status (enum: queued|sent|delivered|read|failed)
├── failure_reason (text)
├── template_id (varchar 36, FK → message_templates, set null on delete)
├── occurred_at (timestamptz, not null)
├── sent_at (timestamptz)
├── delivered_at (timestamptz)
├── read_at (timestamptz)
├── metadata (jsonb, default {})
├── created_at (timestamptz, default now())
└── updated_at (timestamptz, default now())
```

---

## Email Tables

### email_templates

Reusable email templates with block-based content.

```sql
email_templates
├── id (varchar 36, PK)
├── name (varchar 200, unique, not null)
├── description (text)
├── subject (varchar 500, not null)
├── html_body (text, not null)
├── text_body (text)
├── blocks (jsonb, default [])        -- Puck email blocks
├── variables (jsonb, default [])     -- placeholder names
├── category (enum: marketing|transactional|flow|notification)
├── is_active (boolean, default true)
├── created_by (varchar 36)
├── updated_by (varchar 36)
├── created_at (timestamptz, default now())
└── updated_at (timestamptz, default now())
```

### email_campaigns

Broadcast email campaigns.

```sql
email_campaigns
├── id (varchar 36, PK)
├── name (varchar 200, not null)
├── template_id (varchar 36, FK → email_templates, restrict delete)
├── audience_filter (jsonb)
├── status (enum: draft|scheduled|sending|paused|sent|cancelled|failed)
├── scheduled_at (timestamptz)
├── started_at (timestamptz)
├── completed_at (timestamptz)
├── recipient_count (integer)
├── variant_b_subject (varchar 500)
├── variant_b_template_id (varchar 36)
├── test_split_percent (integer)
├── winner_criteria (varchar 50)
├── winner_variant (varchar 1)
├── error (text)
├── created_by (varchar 36)
├── updated_by (varchar 36)
├── created_at (timestamptz, default now())
└── updated_at (timestamptz, default now())
```

### email_sends

One row per recipient per send.

```sql
email_sends
├── id (varchar 36, PK)
├── message_ref (varchar 100, unique, not null)
├── contact_id (varchar 36, FK → contacts, set null on delete)
├── campaign_id (varchar 36, FK → email_campaigns, cascade delete)
├── template_id (varchar 36, FK → email_templates, set null on delete)
├── to_email (varchar 255, not null)
├── subject (varchar 500, not null)
├── status (enum: queued|sent|delivered|bounced|complained|failed)
├── provider (varchar 50)
├── provider_message_id (varchar 255)
├── sent_at (timestamptz)
├── delivered_at (timestamptz)
├── first_opened_at (timestamptz)
├── first_clicked_at (timestamptz)
├── open_count (integer, default 0)
├── click_count (integer, default 0)
├── bounced_at (timestamptz)
├── bounce_type (enum: hard|soft)
├── complained_at (timestamptz)
├── unsubscribed_at (timestamptz)
├── failure_reason (text)
├── created_at (timestamptz, default now())
└── updated_at (timestamptz, default now())
```

### email_suppressions

Email addresses blocked from sending.

```sql
email_suppressions
├── id (varchar 36, PK)
├── email (varchar 255, unique, not null)
├── reason (enum: hard_bounce|complaint|manual|invalid, not null)
├── source (varchar 100)
├── detail (text)
├── contact_id (varchar 36, FK → contacts, set null on delete)
├── created_at (timestamptz, default now())
└── updated_at (timestamptz, default now())
```

---

## Automation Tables

### flows

Automation flow definitions.

```sql
flows
├── id (varchar 36, PK)
├── name (varchar 200, not null)
├── description (text)
├── status (enum: draft|active|paused|archived)
├── trigger_type (enum: manual|lead_created|form_submitted|tag_added|deal_stage_changed|date_based|event_based, not null)
├── trigger_config (jsonb, default {})
├── nodes (jsonb, default [])         -- visual flow nodes
├── edges (jsonb, default [])         -- visual flow edges
├── version (integer, default 1)
├── created_by (varchar 36)
├── created_at (timestamptz, default now())
└── updated_at (timestamptz, default now())
```

### flow_steps

Individual steps within a flow.

```sql
flow_steps
├── id (varchar 36, PK)
├── flow_id (varchar 36, FK → flows, cascade delete)
├── step_index (integer, not null)
├── step_type (enum: send_email|send_whatsapp|wait|condition|update_contact|update_deal|notify_team|add_tag|remove_tag|enroll_flow|create_task, not null)
├── config (jsonb, default {})
├── created_at (timestamptz, default now())
└── updated_at (timestamptz, default now())
```

### flow_enrollments

Per-contact enrollment in a flow.

```sql
flow_enrollments
├── id (varchar 36, PK)
├── flow_id (varchar 36, FK → flows, cascade delete)
├── contact_id (varchar 36, FK → contacts, cascade delete)
├── enrollment_key (varchar 200, unique)  -- flowId:contactId
├── status (enum: active|completed|cancelled|paused)
├── current_step (integer, default 0)
├── next_run_at (timestamptz)
├── variables (jsonb, default {})
├── started_at (timestamptz, default now())
├── completed_at (timestamptz)
├── created_at (timestamptz, default now())
└── updated_at (timestamptz, default now())
```

### flow_logs

Execution log for flow steps.

```sql
flow_logs
├── id (varchar 36, PK)
├── enrollment_id (varchar 36, FK → flow_enrollments, cascade delete)
├── step_index (integer, not null)
├── status (enum: pending|completed|failed|skipped)
├── result (jsonb, default {})
├── error (text)
├── executed_at (timestamptz, default now())
├── created_at (timestamptz, default now())
└── updated_at (timestamptz, default now())
```

---

## Support Tables

### tickets

Support tickets from clients.

```sql
tickets
├── id (varchar 36, PK)
├── ticket_number (varchar 50, unique, not null)  -- TCK-xxxxxx
├── contact_id (varchar 36, FK → contacts, restrict delete)
├── subject (varchar 300, not null)
├── status (enum: open|pending|resolved|closed)
├── priority (enum: low|normal|high|urgent)
├── channel (enum: portal|email|whatsapp, default 'portal')
├── assigned_to (varchar 36, FK → users, set null on delete)
├── created_at (timestamptz, default now())
└── updated_at (timestamptz, default now())
```

### ticket_messages

Message threads within tickets.

```sql
ticket_messages
├── id (varchar 36, PK)
├── ticket_id (varchar 36, FK → tickets, cascade delete)
├── author_type (enum: customer|staff|system, not null)
├── author_id (varchar 36)
├── author_name (varchar 200)
├── body (text, not null)
├── created_at (timestamptz, default now())
└── updated_at (timestamptz, default now())
```

### canned_responses

Pre-written support response templates.

```sql
canned_responses
├── id (varchar 36, PK)
├── title (varchar 200, not null)
├── shortcut (varchar 50)
├── content (text, not null)
├── category (varchar 100)
├── usage_count (integer, default 0)
├── created_at (timestamptz, default now())
└── updated_at (timestamptz, default now())
```

---

## Auth & RBAC Tables

### sessions

User sessions for JWT-based auth.

```sql
sessions
├── id (text, PK)
├── user_id (text, FK → users, cascade delete)
├── token (varchar 255, unique, not null)
├── expires_at (timestamptz, not null)
├── ip_address (varchar 45)
├── user_agent (text)
├── created_at (timestamptz, default now())
└── updated_at (timestamptz, default now())
```

### accounts

Linked authentication providers.

```sql
accounts
├── id (text, PK)
├── user_id (text, FK → users, cascade delete)
├── account_id (varchar 255, not null)
├── provider_id (varchar 255, not null)
├── password (text)
├── access_token (text)
├── refresh_token (text)
├── created_at (timestamptz, default now())
└── updated_at (timestamptz, default now())
```

### verifications

Email/phone verification tokens.

```sql
verifications
├── id (text, PK)
├── identifier (varchar 255, not null)
├── value (varchar 255, not null)
├── expires_at (timestamptz, not null)
├── created_at (timestamptz, default now())
└── updated_at (timestamptz, default now())
```

### roles

User roles for RBAC.

```sql
roles
├── id (varchar 36, PK)
├── name (varchar 100, unique, not null)
├── description (text)
├── created_at (timestamptz, default now())
└── updated_at (timestamptz, default now())
```

### permissions

Granular permissions.

```sql
permissions
├── id (varchar 36, PK)
├── name (varchar 100, unique, not null)
├── description (text)
├── created_at (timestamptz, default now())
└── updated_at (timestamptz, default now())
```

### role_permissions

Many-to-many: roles ↔ permissions.

```sql
role_permissions
├── role_id (varchar 36, FK → roles, cascade delete)
└── permission_id (varchar 36, FK → permissions, cascade delete)
```

---

## Media Tables

### media_folders

Folder hierarchy for media organization.

```sql
media_folders
├── id (varchar 36, PK)
├── name (varchar 200, not null)
├── parent_id (varchar 36)
├── created_at (timestamptz, default now())
└── updated_at (timestamptz, default now())
```

### media

Uploaded files stored in Cloudflare R2.

```sql
media
├── id (varchar 36, PK)
├── file_name (varchar 255, not null)
├── r2_key (varchar 500, not null)
├── mime_type (varchar 100, not null)
├── file_size_bytes (bigint, not null)
├── width (integer)
├── height (integer)
├── alt_text (text)
├── folder_id (varchar 36, FK → media_folders, set null on delete)
├── uploaded_by (varchar 36)
├── created_at (timestamptz, default now())
└── updated_at (timestamptz, default now())
```

---

## Settings Tables

### site_settings

Singleton table for site-wide configuration.

```sql
site_settings
├── id (integer, PK, default 1)
├── site_name (varchar 200)
├── site_tagline (varchar 300)
├── site_url (varchar 500)
├── default_og_image (text)
├── logo_url (text)
├── contact_email (varchar 255)
├── contact_phone (varchar 50)
├── social_facebook (varchar 500)
├── social_instagram (varchar 500)
├── social_linkedin (varchar 500)
├── social_x (varchar 500)
├── google_site_verification (varchar 100)
├── created_at (timestamptz, default now())
└── updated_at (timestamptz, default now())
```

### redirects

URL redirects for the CMS.

```sql
redirects
├── id (varchar 36, PK)
├── source (varchar 500, unique, not null)
├── destination (varchar 500, not null)
├── status_code (integer, default 301)
├── enabled (boolean, default true)
└── created_at (timestamptz, default now())
```

---

## Admin Tables

### api_keys

API keys for Platform API access.

```sql
api_keys
├── id (varchar 36, PK)
├── name (varchar 200, not null)
├── key_hash (varchar 255, unique, not null) -- SHA-256 hash
├── key_prefix (varchar 10, not null)        -- first 8 chars for display
├── permissions (jsonb, default [])
├── rate_limit (integer, default 1000)       -- requests per minute
├── last_used_at (timestamptz)
├── expires_at (timestamptz)
├── is_active (boolean, default true)
├── created_by (varchar 36)
├── created_at (timestamptz, default now())
└── updated_at (timestamptz, default now())
```

### webhooks

Outbound webhook registrations.

```sql
webhooks
├── id (varchar 36, PK)
├── url (varchar 500, not null)
├── events (jsonb, default [])        -- array of event names
├── secret (varchar 255)              -- HMAC-SHA256 signing key
├── is_active (boolean, default true)
├── last_triggered_at (timestamptz)
├── failure_count (integer, default 0)
├── created_by (varchar 36)
├── created_at (timestamptz, default now())
└── updated_at (timestamptz, default now())
```

### webhook_deliveries

Delivery attempts for webhooks.

```sql
webhook_deliveries
├── id (varchar 36, PK)
├── webhook_id (varchar 36, FK → webhooks, cascade delete)
├── event_type (varchar 100, not null)
├── payload (jsonb, not null)
├── status (varchar 20, default 'pending')
├── attempts (integer, default 0)
├── last_error (text)
├── response_status (integer)
├── response_body (text)
├── created_at (timestamptz, default now())
└── delivered_at (timestamptz)
```

---

## Outbox Table (Queue)

### outbox_jobs

Durable job queue for email, WhatsApp, and background tasks.

```sql
outbox_jobs
├── id (varchar 36, PK)
├── job_type (varchar 100, not null)  -- 'send_email', 'send_whatsapp', 'flow_step', etc.
├── payload (jsonb, not null)
├── status (varchar 20, default 'pending')
├── priority (integer, default 0)
├── attempts (integer, default 0)
├── max_attempts (integer, default 5)
├── next_run_at (timestamptz, default now())
├── last_error (text)
├── idempotency_key (varchar 255, unique)
├── created_at (timestamptz, default now())
├── started_at (timestamptz)
├── completed_at (timestamptz)
└── updated_at (timestamptz, default now())
```

---

## Event Tables

### events

Platform event log for the event bus.

```sql
events
├── id (varchar 36, PK)
├── event_type (varchar 100, not null) -- 'order.paid', 'lead.captured', etc.
├── payload (jsonb, default {})
├── source (varchar 100)              -- 'crm', 'cms', 'portal', 'system'
├── processed_at (timestamptz)
└── created_at (timestamptz, default now())
```

### event_sinks

Delivery tracking for event consumers.

```sql
event_sinks
├── id (varchar 36, PK)
├── event_id (varchar 36, FK → events, cascade delete)
├── sink_name (varchar 100, not null)
├── status (enum: pending|delivered|failed, default 'pending')
├── attempts (integer, default 0)
├── last_error (text)
├── created_at (timestamptz, default now())
└── delivered_at (timestamptz)
```

---

(Add new tables as the schema evolves)
