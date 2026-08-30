import {
  pgTable,
  text,
  timestamp,
  uuid,
  pgEnum,
  boolean,
  integer,
  jsonb,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------
// `role` is a real pgEnum (stable, unlikely to change). Everything else that
// is likely to keep evolving early on (status/category-style fields) uses
// `text(..., { enum: [...] })` instead — same TS-level safety, no ALTER TYPE
// friction when a new stage/category gets added.

export const roleEnum = pgEnum('user_role', [
  'client',
  'staff',
  'operations',
  'admin',
  'super_admin',
]);

// ---------------------------------------------------------------------------
// users
// ---------------------------------------------------------------------------

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').unique(),
  whatsapp_number: text('whatsapp_number').notNull().unique(),
  full_name: text('full_name'),
  password_hash: text('password_hash'),
  role: roleEnum('role').default('client').notNull(),
  country_of_residence: text('country_of_residence'),
  avatar_url: text('avatar_url'),
  whatsapp_alerts_enabled: boolean('whatsapp_alerts_enabled').default(true).notNull(),
  email_alerts_enabled: boolean('email_alerts_enabled').default(true).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// ---------------------------------------------------------------------------
// companies
// ---------------------------------------------------------------------------

export const companies = pgTable('companies', {
  id: uuid('id').primaryKey().defaultRandom(),
  user_id: uuid('user_id').references(() => users.id).notNull(),
  company_name: text('company_name').notNull(),
  jurisdiction: text('jurisdiction', {
    enum: ['uae', 'hong-kong', 'singapore', 'bahrain', 'ireland', 'bvi'],
  }).notNull(),
  tier: text('tier', {
    enum: ['tier_1_self', 'tier_2_nominee', 'tier_3_shelf'],
  }).notNull(),
  track_type: text('track_type', { enum: ['remote', 'gulf'] }),
  status: text('status', {
    enum: [
      'lead',
      'onboarding',
      'official_kyc_pending',
      'filing_in_progress',
      'bank_opening',
      'active',
      'renewal_due',
      'suspended',
      'archived',
    ],
  })
    .default('lead')
    .notNull(),
  official_kyc_completed: boolean('official_kyc_completed').default(false).notNull(),
  official_kyc_reference: text('official_kyc_reference'),
  trade_license_number: text('trade_license_number'),
  incorporation_date: timestamp('incorporation_date'),
  license_expiry_date: timestamp('license_expiry_date'),
  assigned_to: uuid('assigned_to').references((): any => users.id),
  annual_revenue_estimate: integer('annual_revenue_estimate'),
  fiscal_year_end: text('fiscal_year_end'), // "MM-DD"
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// ---------------------------------------------------------------------------
// documents / document_versions / shareable_links / document_access_log
// ---------------------------------------------------------------------------

export const documents = pgTable('documents', {
  id: uuid('id').primaryKey().defaultRandom(),
  user_id: uuid('user_id').references(() => users.id).notNull(),
  company_id: uuid('company_id').references(() => companies.id),
  file_name: text('file_name').notNull(),
  r2_key: text('r2_key').notNull(),
  category: text('category', {
    enum: [
      'trade_license',
      'moa_aoa',
      'share_certificate',
      'tax_certificate',
      'nominee_poa',
      'bank_document',
      'other',
    ],
  })
    .default('other')
    .notNull(),
  mime_type: text('mime_type'),
  file_size_bytes: integer('file_size_bytes'),
  status: text('status', { enum: ['active', 'archived', 'superseded'] })
    .default('active')
    .notNull(),
  expiry_date: timestamp('expiry_date'),
  uploaded_by: uuid('uploaded_by').references(() => users.id),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

export const documentVersions = pgTable('document_versions', {
  id: uuid('id').primaryKey().defaultRandom(),
  document_id: uuid('document_id').references(() => documents.id).notNull(),
  version_number: integer('version_number').notNull(),
  r2_key: text('r2_key').notNull(),
  file_name: text('file_name').notNull(),
  uploaded_by: uuid('uploaded_by').references(() => users.id),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

export const shareableLinks = pgTable('shareable_links', {
  id: uuid('id').primaryKey().defaultRandom(),
  document_id: uuid('document_id').references(() => documents.id).notNull(),
  token: text('token').notNull().unique(),
  expires_at: timestamp('expires_at').notNull(),
  created_by: uuid('created_by').references(() => users.id).notNull(),
  access_count: integer('access_count').default(0).notNull(),
  revoked: boolean('revoked').default(false).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

export const documentAccessLog = pgTable('document_access_log', {
  id: uuid('id').primaryKey().defaultRandom(),
  document_id: uuid('document_id').references(() => documents.id).notNull(),
  accessed_by: uuid('accessed_by').references(() => users.id),
  action: text('action', { enum: ['viewed', 'downloaded'] }).notNull(),
  accessed_at: timestamp('accessed_at').defaultNow().notNull(),
});

// ---------------------------------------------------------------------------
// milestones (drives PipelineStepTracker)
// ---------------------------------------------------------------------------

export const milestones = pgTable('milestones', {
  id: uuid('id').primaryKey().defaultRandom(),
  company_id: uuid('company_id').references(() => companies.id).notNull(),
  stage_index: integer('stage_index').notNull(), // 1-6
  stage_name: text('stage_name').notNull(),
  status: text('status', { enum: ['pending', 'in_progress', 'completed'] })
    .default('pending')
    .notNull(),
  description: text('description'),
  official_portal_url: text('official_portal_url'),
  completed_at: timestamp('completed_at'),
  completed_by: uuid('completed_by').references(() => users.id),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// ---------------------------------------------------------------------------
// orders / jurisdiction_pricing / renewals
// ---------------------------------------------------------------------------

export const orders = pgTable('orders', {
  id: uuid('id').primaryKey().defaultRandom(),
  user_id: uuid('user_id').references(() => users.id).notNull(),
  company_id: uuid('company_id').references(() => companies.id).notNull(),
  order_type: text('order_type', {
    enum: ['new_formation', 'renewal', 'tax_filing', 'other'],
  })
    .default('new_formation')
    .notNull(),
  amount_total: integer('amount_total').notNull(), // cents
  currency: text('currency').default('usd').notNull(),
  stripe_session_id: text('stripe_session_id'),
  stripe_payment_intent_id: text('stripe_payment_intent_id'),
  payment_status: text('payment_status', {
    enum: ['unpaid', 'processing', 'paid', 'failed', 'refunded'],
  })
    .default('unpaid')
    .notNull(),
  line_items: jsonb('line_items'),
  paid_at: timestamp('paid_at'),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

export const jurisdictionPricing = pgTable('jurisdiction_pricing', {
  id: uuid('id').primaryKey().defaultRandom(),
  jurisdiction: text('jurisdiction', {
    enum: ['uae', 'hong-kong', 'singapore', 'bahrain', 'ireland', 'bvi'],
  }).notNull(),
  tier: text('tier', {
    enum: ['tier_1_self', 'tier_2_nominee', 'tier_3_shelf'],
  }).notNull(),
  price_usd: integer('price_usd').notNull(), // cents
  updated_by: uuid('updated_by').references(() => users.id),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

export const renewals = pgTable('renewals', {
  id: uuid('id').primaryKey().defaultRandom(),
  company_id: uuid('company_id').references(() => companies.id).notNull(),
  renewal_year: integer('renewal_year').notNull(),
  due_date: timestamp('due_date').notNull(),
  status: text('status', {
    enum: ['upcoming', 'invoiced', 'paid', 'overdue', 'renewed'],
  })
    .default('upcoming')
    .notNull(),
  order_id: uuid('order_id').references(() => orders.id),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// ---------------------------------------------------------------------------
// jurisdiction_tax_rules (ComplianceSnapshot / compliance-calendar data source)
// ---------------------------------------------------------------------------

export const jurisdictionTaxRules = pgTable('jurisdiction_tax_rules', {
  id: uuid('id').primaryKey().defaultRandom(),
  jurisdiction: text('jurisdiction', {
    enum: ['uae', 'hong-kong', 'singapore', 'bahrain', 'ireland', 'bvi'],
  }).notNull(),
  tax_type: text('tax_type', { enum: ['corporate', 'vat', 'other'] }).notNull(),
  rate_percent: integer('rate_percent').notNull(), // basis points would be ideal; keep integer percent *100 for 1 decimal precision
  threshold_amount: integer('threshold_amount'),
  currency: text('currency').default('usd').notNull(),
  filing_frequency: text('filing_frequency', {
    enum: ['annual', 'quarterly', 'monthly'],
  }).notNull(),
  filing_deadline_rule: text('filing_deadline_rule').notNull(),
  notes: text('notes'),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// ---------------------------------------------------------------------------
// notifications / push_subscriptions / promo_banners
// ---------------------------------------------------------------------------

export const notifications = pgTable('notifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  user_id: uuid('user_id').references(() => users.id).notNull(),
  title: text('title').notNull(),
  message: text('message').notNull(),
  type: text('type', {
    enum: ['info', 'success', 'warning', 'action_required'],
  })
    .default('info')
    .notNull(),
  category: text('category', {
    enum: ['kyc', 'payment', 'document', 'renewal', 'promo', 'system'],
  })
    .default('system')
    .notNull(),
  link_url: text('link_url'),
  is_read: boolean('is_read').default(false).notNull(),
  whatsapp_status: text('whatsapp_status', {
    enum: ['not_sent', 'sent', 'failed'],
  }).default('not_sent'),
  email_status: text('email_status', {
    enum: ['not_sent', 'sent', 'failed'],
  }).default('not_sent'),
  push_status: text('push_status', {
    enum: ['not_sent', 'sent', 'failed'],
  }).default('not_sent'),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

export const pushSubscriptions = pgTable('push_subscriptions', {
  id: uuid('id').primaryKey().defaultRandom(),
  user_id: uuid('user_id').references(() => users.id).notNull(),
  endpoint: text('endpoint').notNull().unique(),
  p256dh_key: text('p256dh_key').notNull(),
  auth_key: text('auth_key').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

export const promoBanners = pgTable('promo_banners', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  body: text('body').notNull(),
  link_url: text('link_url'),
  active: boolean('active').default(true).notNull(),
  starts_at: timestamp('starts_at').defaultNow().notNull(),
  ends_at: timestamp('ends_at'),
  created_by: uuid('created_by').references(() => users.id),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// ---------------------------------------------------------------------------
// leads (lead-gen tool captures — kept distinct from `users`)
// ---------------------------------------------------------------------------

export const leads = pgTable('leads', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email'),
  whatsapp_number: text('whatsapp_number'),
  source_tool: text('source_tool', {
    enum: [
      'tax_calculator',
      'banking_odds',
      'nda_generator',
      'jurisdiction_quiz',
      'vat_scorer',
      'ubo_privacy',
      'compliance_calendar',
      'visa_estimator',
      'name_checker',
      'qfzp_eligibility',
    ],
  }).notNull(),
  tool_input: jsonb('tool_input'),
  tool_result: jsonb('tool_result'),
  pdf_r2_key: text('pdf_r2_key'),
  estimated_revenue_band: text('estimated_revenue_band', {
    enum: ['under_50k', '50k_150k', '150k_500k', 'over_500k'],
  }),
  industry_risk_tier: text('industry_risk_tier', {
    enum: ['low', 'medium', 'high'],
  }),
  primary_interest_jurisdiction: text('primary_interest_jurisdiction', {
    enum: ['uae', 'hong-kong', 'singapore', 'bahrain', 'ireland', 'bvi'],
  }),
  persona_tag: text('persona_tag'),
  funnel_track: text('funnel_track', {
    enum: ['self_serve', 'consultation_led'],
  }),
  converted_user_id: uuid('converted_user_id').references(() => users.id),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// ---------------------------------------------------------------------------
// otp_codes (Phase 1b auth — WhatsApp OTP)
// ---------------------------------------------------------------------------

export const otpCodes = pgTable('otp_codes', {
  id: uuid('id').primaryKey().defaultRandom(),
  whatsapp_number: text('whatsapp_number').notNull(),
  otp_hash: text('otp_hash').notNull(),
  expires_at: timestamp('expires_at').notNull(),
  consumed: boolean('consumed').default(false).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// ---------------------------------------------------------------------------
// Relations
// ---------------------------------------------------------------------------

export const usersRelations = relations(users, ({ many }) => ({
  companies: many(companies),
  documents: many(documents),
  notifications: many(notifications),
}));

export const companiesRelations = relations(companies, ({ one, many }) => ({
  user: one(users, { fields: [companies.user_id], references: [users.id] }),
  documents: many(documents),
  milestones: many(milestones),
  orders: many(orders),
  renewals: many(renewals),
}));

export const documentsRelations = relations(documents, ({ one, many }) => ({
  company: one(companies, { fields: [documents.company_id], references: [companies.id] }),
  user: one(users, { fields: [documents.user_id], references: [users.id] }),
  versions: many(documentVersions),
}));

export const milestonesRelations = relations(milestones, ({ one }) => ({
  company: one(companies, { fields: [milestones.company_id], references: [companies.id] }),
}));

export const ordersRelations = relations(orders, ({ one }) => ({
  company: one(companies, { fields: [orders.company_id], references: [companies.id] }),
  user: one(users, { fields: [orders.user_id], references: [users.id] }),
}));

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type User = typeof users.$inferSelect;
export type Company = typeof companies.$inferSelect;
export type Document = typeof documents.$inferSelect;
export type Milestone = typeof milestones.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type JurisdictionPricing = typeof jurisdictionPricing.$inferSelect;
export type Renewal = typeof renewals.$inferSelect;
export type JurisdictionTaxRule = typeof jurisdictionTaxRules.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type PushSubscription = typeof pushSubscriptions.$inferSelect;
export type PromoBanner = typeof promoBanners.$inferSelect;
export type Lead = typeof leads.$inferSelect;
export type OtpCode = typeof otpCodes.$inferSelect;
export type DocumentVersion = typeof documentVersions.$inferSelect;
export type ShareableLink = typeof shareableLinks.$inferSelect;
export type DocumentAccessLog = typeof documentAccessLog.$inferSelect;
