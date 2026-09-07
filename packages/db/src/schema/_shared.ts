import { boolean, text, timestamp } from "drizzle-orm/pg-core";

export function timestampColumns() {
  return {
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  };
}

export function editorialColumns() {
  return {
    status: text("status").notNull(),
    publish_at: timestamp("publish_at", { withTimezone: true }),
    unpublish_at: timestamp("unpublish_at", { withTimezone: true }),
  };
}

export function seoColumns() {
  return {
    seo_title: text("seo_title"),
    seo_description: text("seo_description"),
    seo_og_image: text("seo_og_image"),
    seo_no_index: boolean("seo_no_index").default(false).notNull(),
    seo_keywords: text("seo_keywords"),
    aeo_answer: text("aeo_answer"),
  };
}
