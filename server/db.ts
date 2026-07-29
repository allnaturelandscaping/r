import { and, asc, desc, eq, gte, lt, lte, ne } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  clients,
  InsertClient,
  InsertScheduledCut,
  InsertUser,
  scheduledCuts,
  users,
} from "../drizzle/schema";

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

export async function upsertGoogleUser(data: {
  googleId: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  role?: "user" | "admin";
  status?: "pending" | "approved" | "rejected";
}) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");

  const updateSet: Record<string, unknown> = {
    name: data.name,
    avatarUrl: data.avatarUrl,
    lastSignedIn: new Date(),
  };
  if (data.role) updateSet.role = data.role;
  if (data.status) updateSet.status = data.status;

  await db
    .insert(users)
    .values({
      googleId: data.googleId,
      email: data.email,
      name: data.name,
      avatarUrl: data.avatarUrl,
      role: data.role ?? "user",
      status: data.status ?? "pending",
      lastSignedIn: new Date(),
    })
    .onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByGoogleId(googleId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(users)
    .where(eq(users.googleId, googleId))
    .limit(1);
  return result[0];
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result[0];
}

export async function updateLastSignedIn(id: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db
    .update(users)
    .set({ lastSignedIn: new Date() })
    .where(eq(users.id, id));
}

// Obtener todos los usuarios (excepto el admin) para el panel de gestión
export async function getAllNonAdminUsers() {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(users)
    .where(ne(users.role, "admin"))
    .orderBy(desc(users.createdAt));
}

// Actualizar el status de un usuario (approved / rejected / pending)
export async function setUserStatus(
  userId: number,
  status: "pending" | "approved" | "rejected"
) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(users).set({ status }).where(eq(users.id, userId));
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

export async function updateClient(
  id: number,
  userId: number,
  data: Partial<InsertClient>
) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db
    .update(clients)
    .set(data)
    .where(and(eq(clients.id, id), eq(clients.userId, userId)));
}

export async function deleteClient(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db
    .update(clients)
    .set({ isActive: 0 })
    .where(and(eq(clients.id, id), eq(clients.userId, userId)));
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

export async function getTodayCuts(
  userId: number,
  todayStart: number,
  todayEnd: number
) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({ cut: scheduledCuts, client: clients })
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
    .select({ cut: scheduledCuts, client: clients })
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

export async function getUpcomingCuts(
  userId: number,
  fromTs: number,
  toTs: number
) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({ cut: scheduledCuts, client: clients })
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

export async function getCutsForMonth(
  userId: number,
  monthStart: number,
  monthEnd: number
) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({ cut: scheduledCuts, client: clients })
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
    .where(
      and(
        eq(scheduledCuts.clientId, clientId),
        eq(scheduledCuts.userId, userId)
      )
    )
    .orderBy(desc(scheduledCuts.scheduledDate));
}

export async function createScheduledCut(data: InsertScheduledCut) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.insert(scheduledCuts).values(data);
}

export async function completeCut(
  id: number,
  userId: number,
  notes?: string
) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db
    .update(scheduledCuts)
    .set({
      status: "completed",
      completedAt: Date.now(),
      notes: notes ?? null,
    })
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

export async function getNextPendingCutForClient(
  clientId: number,
  userId: number
) {
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
