import {
  index,
  integer,
  pgEnum,
  text,
  timestamp,
  unique,
  varchar,
} from "drizzle-orm/pg-core";
import { pgTable } from "drizzle-orm/pg-core";
import { contacts } from "./contacts";
import { users } from "./auth";

export const ticketStatusEnum = pgEnum("ticket_status", [
  "open",
  "pending",
  "resolved",
  "closed",
]);

export const ticketPriorityEnum = pgEnum("ticket_priority", [
  "low",
  "normal",
  "high",
  "urgent",
]);

export const ticketChannelEnum = pgEnum("ticket_channel", [
  "portal",
  "email",
  "whatsapp",
]);

export const authorTypeEnum = pgEnum("author_type", ["customer", "staff", "system"]);

export const tickets = pgTable(
  "tickets",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    ticket_number: varchar("ticket_number", { length: 50 }).unique().notNull(),
    contact_id: varchar("contact_id", { length: 36 })
      .notNull()
      .references(() => contacts.id, { onDelete: "restrict" }),
    subject: varchar("subject", { length: 300 }).notNull(),
    status: ticketStatusEnum("status").default("open").notNull(),
    priority: ticketPriorityEnum("priority").default("normal").notNull(),
    channel: ticketChannelEnum("channel").default("portal").notNull(),
    assigned_to: varchar("assigned_to", { length: 36 }).references(() => users.id, {
      onDelete: "set null",
    }),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("tickets_contact_id_idx").on(table.contact_id),
    index("tickets_status_idx").on(table.status),
    index("tickets_priority_idx").on(table.priority),
    index("tickets_assigned_to_idx").on(table.assigned_to),
    index("tickets_ticket_number_idx").on(table.ticket_number),
  ]
);

export const ticket_messages = pgTable(
  "ticket_messages",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    ticket_id: varchar("ticket_id", { length: 36 })
      .notNull()
      .references(() => tickets.id, { onDelete: "cascade" }),
    author_type: authorTypeEnum("author_type").notNull(),
    author_id: varchar("author_id", { length: 36 }),
    author_name: varchar("author_name", { length: 200 }),
    body: text("body").notNull(),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("ticket_messages_ticket_id_idx").on(table.ticket_id),
    index("ticket_messages_author_type_idx").on(table.author_type),
  ]
);

export const canned_responses = pgTable(
  "canned_responses",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    title: varchar("title", { length: 200 }).notNull(),
    shortcut: varchar("shortcut", { length: 50 }),
    content: text("content").notNull(),
    category: varchar("category", { length: 100 }),
    usage_count: integer("usage_count").default(0).notNull(),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("canned_responses_shortcut_idx").on(table.shortcut),
    index("canned_responses_category_idx").on(table.category),
  ]
);
