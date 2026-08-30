import { pgTable, text, timestamp, uuid, pgEnum, boolean, integer } from 'drizzle-orm/pg-core';

export const roleEnum = pgEnum('user_role', ['client', 'staff', 'admin']);
export const companyStatusEnum = pgEnum('company_status', ['lead', 'onboarding', 'official_kyc_pending', 'active']);
export const companyTierEnum = pgEnum('company_tier', ['tier_1_self', 'tier_2_nominee']);

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').unique(),
  whatsapp_number: text('whatsapp_number').notNull().unique(),
  full_name: text('full_name'),
  role: roleEnum('role').default('client').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

export const companies = pgTable('companies', {
  id: uuid('id').primaryKey().defaultRandom(),
  user_id: uuid('user_id').references(() => users.id).notNull(),
  company_name: text('company_name').notNull(),
  jurisdiction: text('jurisdiction').notNull(),
  tier: companyTierEnum('tier').notNull(),
  status: companyStatusEnum('status').default('lead').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

export const documents = pgTable('documents', {
  id: uuid('id').primaryKey().defaultRandom(),
  user_id: uuid('user_id').references(() => users.id).notNull(),
  company_id: uuid('company_id').references(() => companies.id),
  file_name: text('file_name').notNull(),
  s3_key: text('s3_key').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type Company = typeof companies.$inferSelect;
export type Document = typeof documents.$inferSelect;
