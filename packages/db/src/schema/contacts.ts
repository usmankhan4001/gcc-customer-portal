import {
  boolean,
  index,
  jsonb,
  pgEnum,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";
import { pgTable } from "drizzle-orm/pg-core";
import { users } from "./auth";

export const lifecycleStageEnum = pgEnum("lifecycle_stage", [
  "lead",
  "subscriber",
  "prospect",
  "client",
  "churned",
]);

export const consentStatusEnum = pgEnum("consent_status", [
  "unknown",
  "granted",
  "denied",
]);

export const contacts = pgTable(
  "contacts",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    email: varchar("email", { length: 255 }),
    phone: varchar("phone", { length: 50 }),
    first_name: varchar("first_name", { length: 100 }),
    last_name: varchar("last_name", { length: 100 }),
    display_name: varchar("display_name", { length: 200 }),
    company: varchar("company", { length: 200 }),
    job_title: varchar("job_title", { length: 200 }),
    lifecycle_stage: lifecycleStageEnum("lifecycle_stage").default("lead").notNull(),
    owner_id: varchar("owner_id", { length: 36 }).references(() => users.id, {
      onDelete: "set null",
    }),
    source: varchar("source", { length: 100 }),
    tags: jsonb("tags").$type<string[]>().default([]),
    custom_fields: jsonb("custom_fields").$type<Record<string, unknown>>().default({}),
    email_consent: consentStatusEnum("email_consent").default("unknown").notNull(),
    email_consent_at: timestamp("email_consent_at", { withTimezone: true }),
    whatsapp_consent: consentStatusEnum("whatsapp_consent").default("unknown").notNull(),
    whatsapp_consent_at: timestamp("whatsapp_consent_at", { withTimezone: true }),
    unsubscribed_at: timestamp("unsubscribed_at", { withTimezone: true }),
    deleted_at: timestamp("deleted_at", { withTimezone: true }),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("contacts_owner_id_idx").on(table.owner_id),
    index("contacts_lifecycle_stage_idx").on(table.lifecycle_stage),
    index("contacts_deleted_at_idx").on(table.deleted_at),
    index("contacts_tags_idx").using("gin", table.tags),
  ]
);
