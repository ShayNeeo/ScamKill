import { desc, eq, sql } from 'drizzle-orm';
import { createDb } from '../db';
import {
  familyLeads,
  scamReports,
  sessions,
  users,
  type FamilyLeadRow,
  type ScamReportRow,
  type SessionRow,
  type UserRow,
} from '../db/schema';

/**
 * Data access with a D1/Drizzle path and an in-memory fallback used by
 * `astro dev` when no `DB` binding is available. The fallback is per-isolate
 * and intentionally not durable; production always has D1 bound.
 */

interface MemoryState {
  users: UserRow[];
  sessions: SessionRow[];
  leads: FamilyLeadRow[];
  reports: ScamReportRow[];
}

const memoryKey = Symbol.for('scamkill.memoryDb');
type MemoryGlobal = typeof globalThis & { [memoryKey]?: MemoryState };

function memory(): MemoryState {
  const g = globalThis as MemoryGlobal;
  g[memoryKey] ??= { users: [], sessions: [], leads: [], reports: [] };
  return g[memoryKey];
}

export function createUser(d1: D1Database | undefined, row: UserRow): Promise<void> | void {
  if (!d1) {
    memory().users.push(row);
    return;
  }
  return createDb(d1).insert(users).values(row).run().then(() => undefined);
}

export function findUserByEmail(d1: D1Database | undefined, email: string): Promise<UserRow | null> | UserRow | null {
  if (!d1) return memory().users.find((u) => u.email === email) ?? null;
  return createDb(d1)
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1)
    .then((rows) => rows[0] ?? null);
}

export function findUserById(d1: D1Database | undefined, id: string): Promise<UserRow | null> | UserRow | null {
  if (!d1) return memory().users.find((u) => u.id === id) ?? null;
  return createDb(d1)
    .select()
    .from(users)
    .where(eq(users.id, id))
    .limit(1)
    .then((rows) => rows[0] ?? null);
}

export function createSession(d1: D1Database | undefined, row: SessionRow): Promise<void> | void {
  if (!d1) {
    memory().sessions.push(row);
    return;
  }
  return createDb(d1).insert(sessions).values(row).run().then(() => undefined);
}

export function findSession(d1: D1Database | undefined, id: string): Promise<SessionRow | null> | SessionRow | null {
  if (!d1) return memory().sessions.find((s) => s.id === id) ?? null;
  return createDb(d1)
    .select()
    .from(sessions)
    .where(eq(sessions.id, id))
    .limit(1)
    .then((rows) => rows[0] ?? null);
}

export function deleteSession(d1: D1Database | undefined, id: string): Promise<void> | void {
  if (!d1) {
    const state = memory();
    state.sessions = state.sessions.filter((s) => s.id !== id);
    return;
  }
  return createDb(d1).delete(sessions).where(eq(sessions.id, id)).run().then(() => undefined);
}

export function deleteExpiredSessions(d1: D1Database | undefined, now: number): Promise<void> | void {
  if (!d1) {
    const state = memory();
    state.sessions = state.sessions.filter((s) => s.expiresAt > now);
    return;
  }
  return createDb(d1).delete(sessions).where(sql`${sessions.expiresAt} <= ${now}`).run()
    .then(() => undefined);
}

export function createLead(d1: D1Database | undefined, row: FamilyLeadRow): Promise<void> | void {
  if (!d1) {
    memory().leads.unshift(row);
    return;
  }
  return createDb(d1).insert(familyLeads).values(row).run().then(() => undefined);
}

export function listLeads(d1: D1Database | undefined, limit = 20): Promise<FamilyLeadRow[]> | FamilyLeadRow[] {
  if (!d1) return memory().leads.slice(0, limit);
  return createDb(d1)
    .select()
    .from(familyLeads)
    .orderBy(desc(familyLeads.createdAt))
    .limit(limit);
}

export function countLeads(d1: D1Database | undefined): Promise<number> | number {
  if (!d1) return memory().leads.length;
  return createDb(d1)
    .select({ count: sql<number>`count(*)` })
    .from(familyLeads)
    .then((rows) => Number(rows[0]?.count ?? 0));
}

export function createReport(d1: D1Database | undefined, row: ScamReportRow): Promise<void> | void {
  if (!d1) {
    memory().reports.unshift(row);
    return;
  }
  return createDb(d1).insert(scamReports).values(row).run().then(() => undefined);
}

export function listReports(
  d1: D1Database | undefined,
  limit = 20,
): Promise<ScamReportRow[]> | ScamReportRow[] {
  if (!d1) return memory().reports.slice(0, limit);
  return createDb(d1)
    .select()
    .from(scamReports)
    .orderBy(desc(scamReports.createdAt))
    .limit(limit);
}

export function countReports(d1: D1Database | undefined): Promise<number> | number {
  if (!d1) return memory().reports.length;
  return createDb(d1)
    .select({ count: sql<number>`count(*)` })
    .from(scamReports)
    .then((rows) => Number(rows[0]?.count ?? 0));
}

export type { FamilyLeadRow, SessionRow, UserRow };
