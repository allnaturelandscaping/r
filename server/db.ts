import { and, asc, desc, eq, gte, lt, lte } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { clients, InsertClient, InsertScheduledCut, InsertUser, scheduledCuts, users } from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── Users ────────────────────────────────────────────────────────────────────

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};

  const textFields = ["name", "email", "loginMethod"] as const;
  for (const field of textFields) {
    const value = user[field];
    if (value !== undefined) {
      values[field] = value ?? null;
      updateSet[field] = value ?? null;
    }
  }

  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }

  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();

  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ─── Clients ──────────────────────────────────────────────────────────────────

export async function getClientsByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(clients)
    .where(and(eq(clients.userId, userId), eq(clients.isActive, 1)))
    .orderBy(asc(clients.name));
}

export async function getClientById(id: number, userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(clients)
    .where(and(eq(clients.id, id), eq(clients.userId, userId)))
    .limit(1);
  return result[0];
}

export async function createClient(data: InsertClient) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(clients).values(data);
  return result[0];
}

export async function updateClient(id: number, userId: number, data: Partial<InsertClient>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(clients).set(data).where(and(eq(clients.id, id), eq(clients.userId, userId)));
}

export async function deleteClient(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  // Soft delete
  await db.update(clients).set({ isActive: 0 }).where(and(eq(clients.id, id), eq(clients.userId, userId)));
}

// ─── Scheduled Cuts ───────────────────────────────────────────────────────────

export async function getCutsByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(scheduledCuts)
    .where(eq(scheduledCuts.userId, userId))
    .orderBy(asc(scheduledCuts.scheduledDate));
}

export async function getTodayCuts(userId: number, todayStart: number, todayEnd: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      cut: scheduledCuts,
      client: clients,
    })
    .from(scheduledCuts)
    .innerJoin(clients, eq(scheduledCuts.clientId, clients.id))
    .where(
      and(
        eq(scheduledCuts.userId, userId),
        gte(scheduledCuts.scheduledDate, todayStart),
        lte(scheduledCuts.scheduledDate, todayEnd),
        eq(scheduledCuts.status, "pending")
      )
    )
    .orderBy(asc(scheduledCuts.scheduledDate));
}

export async function getOverdueCuts(userId: number, todayStart: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      cut: scheduledCuts,
      client: clients,
    })
    .from(scheduledCuts)
    .innerJoin(clients, eq(scheduledCuts.clientId, clients.id))
    .where(
      and(
        eq(scheduledCuts.userId, userId),
        lt(scheduledCuts.scheduledDate, todayStart),
        eq(scheduledCuts.status, "pending")
      )
    )
    .orderBy(asc(scheduledCuts.scheduledDate));
}

export async function getUpcomingCuts(userId: number, fromTs: number, toTs: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      cut: scheduledCuts,
      client: clients,
    })
    .from(scheduledCuts)
    .innerJoin(clients, eq(scheduledCuts.clientId, clients.id))
    .where(
      and(
        eq(scheduledCuts.userId, userId),
        gte(scheduledCuts.scheduledDate, fromTs),
        lte(scheduledCuts.scheduledDate, toTs),
        eq(scheduledCuts.status, "pending")
      )
    )
    .orderBy(asc(scheduledCuts.scheduledDate));
}

export async function getCutsForMonth(userId: number, monthStart: number, monthEnd: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      cut: scheduledCuts,
      client: clients,
    })
    .from(scheduledCuts)
    .innerJoin(clients, eq(scheduledCuts.clientId, clients.id))
    .where(
      and(
        eq(scheduledCuts.userId, userId),
        gte(scheduledCuts.scheduledDate, monthStart),
        lte(scheduledCuts.scheduledDate, monthEnd)
      )
    )
    .orderBy(asc(scheduledCuts.scheduledDate));
}

export async function getCutHistoryByClient(clientId: number, userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(scheduledCuts)
    .where(and(eq(scheduledCuts.clientId, clientId), eq(scheduledCuts.userId, userId)))
    .orderBy(desc(scheduledCuts.scheduledDate));
}

export async function createScheduledCut(data: InsertScheduledCut) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.insert(scheduledCuts).values(data);
}

export async function completeCut(id: number, userId: number, notes?: string) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db
    .update(scheduledCuts)
    .set({ status: "completed", completedAt: Date.now(), notes: notes ?? null })
    .where(and(eq(scheduledCuts.id, id), eq(scheduledCuts.userId, userId)));
}

export async function skipCut(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db
    .update(scheduledCuts)
    .set({ status: "skipped" })
    .where(and(eq(scheduledCuts.id, id), eq(scheduledCuts.userId, userId)));
}

export async function getNextPendingCutForClient(clientId: number, userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(scheduledCuts)
    .where(
      and(
        eq(scheduledCuts.clientId, clientId),
        eq(scheduledCuts.userId, userId),
        eq(scheduledCuts.status, "pending")
      )
    )
    .orderBy(asc(scheduledCuts.scheduledDate))
    .limit(1);
  return result[0];
}
