import {
  boolean,
  index,
  integer,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { pgTable } from "drizzle-orm/pg-core";

export const site_settings = pgTable(
  "site_settings",
  {
    id: integer("id").primaryKey().default(1),
    site_name: varchar("site_name", { length: 200 }),
    site_tagline: varchar("site_tagline", { length: 300 }),
    site_url: varchar("site_url", { length: 500 }),
    default_og_image: text("default_og_image"),
    logo_url: text("logo_url"),
    contact_email: varchar("contact_email", { length: 255 }),
    contact_phone: varchar("contact_phone", { length: 50 }),
    social_facebook: varchar("social_facebook", { length: 500 }),
    social_instagram: varchar("social_instagram", { length: 500 }),
    social_linkedin: varchar("social_linkedin", { length: 500 }),
    social_x: varchar("social_x", { length: 500 }),
    google_site_verification: varchar("google_site_verification", { length: 100 }),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  }
);

export const redirects = pgTable(
  "redirects",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    source: varchar("source", { length: 500 }).unique().notNull(),
    destination: varchar("destination", { length: 500 }).notNull(),
    status_code: integer("status_code").default(301).notNull(),
    enabled: boolean("enabled").default(true).notNull(),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("redirects_source_idx").on(table.source),
    index("redirects_enabled_idx").on(table.enabled),
  ]
);
