import { index, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { pgTable } from "drizzle-orm/pg-core";

export const roles = pgTable(
  "roles",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    name: varchar("name", { length: 100 }).unique().notNull(),
    description: text("description"),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("roles_name_idx").on(table.name)]
);

export const permissions = pgTable(
  "permissions",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    name: varchar("name", { length: 100 }).unique().notNull(),
    description: text("description"),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("permissions_name_idx").on(table.name)]
);

export const role_permissions = pgTable(
  "role_permissions",
  {
    role_id: varchar("role_id", { length: 36 })
      .notNull()
      .references(() => roles.id, { onDelete: "cascade" }),
    permission_id: varchar("permission_id", { length: 36 })
      .notNull()
      .references(() => permissions.id, { onDelete: "cascade" }),
  },
  (table) => [
    index("role_permissions_role_id_idx").on(table.role_id),
    index("role_permissions_permission_id_idx").on(table.permission_id),
  ]
);
