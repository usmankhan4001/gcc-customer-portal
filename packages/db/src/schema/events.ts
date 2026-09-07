import {
  index,
  integer,
  jsonb,
  pgEnum,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { pgTable } from "drizzle-orm/pg-core";

export const sinkStatusEnum = pgEnum("sink_status", ["pending", "delivered", "failed"]);

export const events = pgTable(
  "events",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    event_type: varchar("event_type", { length: 100 }).notNull(),
    payload: jsonb("payload").$type<Record<string, unknown>>().default({}),
    source: varchar("source", { length: 100 }),
    processed_at: timestamp("processed_at", { withTimezone: true }),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("events_event_type_idx").on(table.event_type),
    index("events_source_idx").on(table.source),
    index("events_created_at_idx").on(table.created_at),
  ]
);

export const event_sinks = pgTable(
  "event_sinks",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    event_id: varchar("event_id", { length: 36 })
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    sink_name: varchar("sink_name", { length: 100 }).notNull(),
    status: sinkStatusEnum("status").default("pending").notNull(),
    attempts: integer("attempts").default(0).notNull(),
    last_error: text("last_error"),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    delivered_at: timestamp("delivered_at", { withTimezone: true }),
  },
  (table) => [
    index("event_sinks_event_id_idx").on(table.event_id),
    index("event_sinks_sink_name_idx").on(table.sink_name),
    index("event_sinks_status_idx").on(table.status),
  ]
);
