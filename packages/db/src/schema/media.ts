import {
  bigint,
  index,
  integer,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { pgTable } from "drizzle-orm/pg-core";

export const media_folders = pgTable(
  "media_folders",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    name: varchar("name", { length: 200 }).notNull(),
    parent_id: varchar("parent_id", { length: 36 }),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("media_folders_parent_id_idx").on(table.parent_id)]
);

export const media = pgTable(
  "media",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    file_name: varchar("file_name", { length: 255 }).notNull(),
    r2_key: varchar("r2_key", { length: 500 }).notNull(),
    mime_type: varchar("mime_type", { length: 100 }).notNull(),
    file_size_bytes: bigint("file_size_bytes", { mode: "number" }).notNull(),
    width: integer("width"),
    height: integer("height"),
    alt_text: text("alt_text"),
    folder_id: varchar("folder_id", { length: 36 }).references(
      () => media_folders.id,
      { onDelete: "set null" }
    ),
    uploaded_by: varchar("uploaded_by", { length: 36 }),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("media_folder_id_idx").on(table.folder_id),
    index("media_r2_key_idx").on(table.r2_key),
    index("media_mime_type_idx").on(table.mime_type),
  ]
);
