import {
  index,
  integer,
  jsonb,
  pgEnum,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";
import { pgTable } from "drizzle-orm/pg-core";
import { contacts } from "./contacts";
import { users } from "./auth";

export const channelEnum = pgEnum("channel", [
  "whatsapp",
  "web_chat",
  "email",
  "ticket",
]);

export const conversationStateEnum = pgEnum("conversation_state", ["open", "closed"]);

export const messageDirectionEnum = pgEnum("message_direction", ["inbound", "outbound"]);

export const messageStatusEnum = pgEnum("message_status", [
  "queued",
  "sent",
  "delivered",
  "read",
  "failed",
]);

export const templateCategoryEnum = pgEnum("template_category", [
  "marketing",
  "utility",
  "authentication",
]);

export const templateStatusEnum = pgEnum("template_status", [
  "draft",
  "pending",
  "approved",
  "rejected",
  "disabled",
]);

export const conversations = pgTable(
  "conversations",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    contact_id: varchar("contact_id", { length: 36 })
      .notNull()
      .references(() => contacts.id, { onDelete: "cascade" }),
    channel: channelEnum("channel").notNull(),
    last_inbound_at: timestamp("last_inbound_at", { withTimezone: true }),
    last_outbound_at: timestamp("last_outbound_at", { withTimezone: true }),
    last_message_at: timestamp("last_message_at", { withTimezone: true }),
    unread_count: integer("unread_count").default(0).notNull(),
    state: conversationStateEnum("state").default("open").notNull(),
    closed_at: timestamp("closed_at", { withTimezone: true }),
    assigned_to: varchar("assigned_to", { length: 36 }).references(() => users.id, {
      onDelete: "set null",
    }),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("conversations_contact_id_idx").on(table.contact_id),
    index("conversations_channel_idx").on(table.channel),
    index("conversations_state_idx").on(table.state),
    index("conversations_assigned_to_idx").on(table.assigned_to),
    uniqueIndex("conversations_contact_channel_idx").on(
      table.contact_id,
      table.channel
    ),
  ]
);

export const message_templates = pgTable(
  "message_templates",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    name: varchar("name", { length: 200 }).notNull(),
    language: varchar("language", { length: 10 }).default("en").notNull(),
    body: text("body").notNull(),
    header: text("header"),
    footer: text("footer"),
    placeholder_count: integer("placeholder_count").default(0).notNull(),
    category: templateCategoryEnum("category").default("utility").notNull(),
    status: templateStatusEnum("status").default("draft").notNull(),
    provider_template_id: varchar("provider_template_id", { length: 255 }),
    approved_at: timestamp("approved_at", { withTimezone: true }),
    rejection_reason: text("rejection_reason"),
    created_by: varchar("created_by", { length: 36 }),
    updated_by: varchar("updated_by", { length: 36 }),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("message_templates_name_idx").on(table.name),
    index("message_templates_language_idx").on(table.language),
    uniqueIndex("message_templates_name_language_idx").on(table.name, table.language),
  ]
);

export const messages = pgTable(
  "messages",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    conversation_id: varchar("conversation_id", { length: 36 })
      .notNull()
      .references(() => conversations.id, { onDelete: "cascade" }),
    direction: messageDirectionEnum("direction").notNull(),
    body: text("body").notNull(),
    media_url: text("media_url"),
    message_ref: varchar("message_ref", { length: 100 }).unique().notNull(),
    provider_message_id: varchar("provider_message_id", { length: 255 }),
    status: messageStatusEnum("status").default("queued").notNull(),
    failure_reason: text("failure_reason"),
    template_id: varchar("template_id", { length: 36 }).references(
      () => message_templates.id,
      { onDelete: "set null" }
    ),
    occurred_at: timestamp("occurred_at", { withTimezone: true }).notNull(),
    sent_at: timestamp("sent_at", { withTimezone: true }),
    delivered_at: timestamp("delivered_at", { withTimezone: true }),
    read_at: timestamp("read_at", { withTimezone: true }),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("messages_conversation_id_idx").on(table.conversation_id),
    index("messages_direction_idx").on(table.direction),
    index("messages_status_idx").on(table.status),
    index("messages_occurred_at_idx").on(table.occurred_at),
  ]
);
