import { bigint, int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

// Tabla de usuarios con Google OAuth y sistema de aprobación
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  googleId: varchar("googleId", { length: 128 }).notNull().unique(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  name: text("name"),
  avatarUrl: text("avatarUrl"),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  // pending = esperando aprobación, approved = acceso concedido, rejected = acceso denegado
  status: mysqlEnum("status", ["pending", "approved", "rejected"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Tabla de clientes de landscaping
export const clients = mysqlTable("clients", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  address: text("address").notNull(),
  phone: varchar("phone", { length: 30 }),
  frequency: mysqlEnum("frequency", ["weekly", "biweekly", "monthly"]).notNull().default("biweekly"),
  notes: text("notes"),
  isActive: int("isActive").notNull().default(1),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Client = typeof clients.$inferSelect;
export type InsertClient = typeof clients.$inferInsert;

// Tabla de cortes programados
export const scheduledCuts = mysqlTable("scheduled_cuts", {
  id: int("id").autoincrement().primaryKey(),
  clientId: int("clientId").notNull(),
  userId: int("userId").notNull(),
  scheduledDate: bigint("scheduledDate", { mode: "number", unsigned: true }).notNull(),
  status: mysqlEnum("status", ["pending", "completed", "skipped"]).notNull().default("pending"),
  completedAt: bigint("completedAt", { mode: "number", unsigned: true }),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ScheduledCut = typeof scheduledCuts.$inferSelect;
export type InsertScheduledCut = typeof scheduledCuts.$inferInsert;
