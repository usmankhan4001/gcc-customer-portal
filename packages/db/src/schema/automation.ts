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

export const flowStatusEnum = pgEnum("flow_status", [
  "draft",
  "active",
  "paused",
  "archived",
]);

export const triggerTypeEnum = pgEnum("trigger_type", [
  "manual",
  "lead_created",
  "form_submitted",
  "tag_added",
  "deal_stage_changed",
  "date_based",
  "event_based",
]);

export const stepTypeEnum = pgEnum("step_type", [
  "send_email",
  "send_whatsapp",
  "wait",
  "condition",
  "update_contact",
  "update_deal",
  "notify_team",
  "add_tag",
  "remove_tag",
  "enroll_flow",
  "create_task",
]);

export const enrollmentStatusEnum = pgEnum("enrollment_status", [
  "active",
  "completed",
  "cancelled",
  "paused",
]);

export const logStatusEnum = pgEnum("log_status", [
  "pending",
  "completed",
  "failed",
  "skipped",
]);

export const flows = pgTable(
  "flows",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    name: varchar("name", { length: 200 }).notNull(),
    description: text("description"),
    status: flowStatusEnum("status").default("draft").notNull(),
    trigger_type: triggerTypeEnum("trigger_type").notNull(),
    trigger_config: jsonb("trigger_config").$type<Record<string, unknown>>().default({}),
    nodes: jsonb("nodes").$type<unknown[]>().default([]),
    edges: jsonb("edges").$type<unknown[]>().default([]),
    version: integer("version").default(1).notNull(),
    created_by: varchar("created_by", { length: 36 }),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("flows_status_idx").on(table.status),
    index("flows_trigger_type_idx").on(table.trigger_type),
  ]
);

export const flow_steps = pgTable(
  "flow_steps",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    flow_id: varchar("flow_id", { length: 36 })
      .notNull()
      .references(() => flows.id, { onDelete: "cascade" }),
    step_index: integer("step_index").notNull(),
    step_type: stepTypeEnum("step_type").notNull(),
    config: jsonb("config").$type<Record<string, unknown>>().default({}),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("flow_steps_flow_id_idx").on(table.flow_id),
    index("flow_steps_flow_id_step_index_idx").on(table.flow_id, table.step_index),
  ]
);

export const flow_enrollments = pgTable(
  "flow_enrollments",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    flow_id: varchar("flow_id", { length: 36 })
      .notNull()
      .references(() => flows.id, { onDelete: "cascade" }),
    contact_id: varchar("contact_id", { length: 36 })
      .notNull()
      .references(() => contacts.id, { onDelete: "cascade" }),
    enrollment_key: varchar("enrollment_key", { length: 200 }).notNull(),
    status: enrollmentStatusEnum("status").default("active").notNull(),
    current_step: integer("current_step").default(0).notNull(),
    next_run_at: timestamp("next_run_at", { withTimezone: true }),
    variables: jsonb("variables").$type<Record<string, unknown>>().default({}),
    started_at: timestamp("started_at", { withTimezone: true }).defaultNow().notNull(),
    completed_at: timestamp("completed_at", { withTimezone: true }),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("flow_enrollments_flow_id_idx").on(table.flow_id),
    index("flow_enrollments_contact_id_idx").on(table.contact_id),
    index("flow_enrollments_status_idx").on(table.status),
    index("flow_enrollments_next_run_at_idx").on(table.next_run_at),
    uniqueIndex("flow_enrollments_enrollment_key_idx").on(table.enrollment_key),
  ]
);

export const flow_logs = pgTable(
  "flow_logs",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    enrollment_id: varchar("enrollment_id", { length: 36 })
      .notNull()
      .references(() => flow_enrollments.id, { onDelete: "cascade" }),
    step_index: integer("step_index").notNull(),
    status: logStatusEnum("status").default("pending").notNull(),
    result: jsonb("result").$type<Record<string, unknown>>().default({}),
    error: text("error"),
    executed_at: timestamp("executed_at", { withTimezone: true }).defaultNow().notNull(),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("flow_logs_enrollment_id_idx").on(table.enrollment_id),
    index("flow_logs_status_idx").on(table.status),
  ]
);
