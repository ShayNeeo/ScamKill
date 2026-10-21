import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

/**
 * D1 / SQLite schema. Timestamps are Unix epoch milliseconds (integer) so the
 * same rows serialise cleanly through D1, the memory fallback, and JSON APIs.
 */

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  passwordHash: text('password_hash').notNull(),
  createdAt: integer('created_at').notNull(),
});

export const sessions = sqliteTable(
  'sessions',
  {
    // Stored as SHA-256(token); the raw token only ever lives in the cookie.
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    expiresAt: integer('expires_at').notNull(),
    createdAt: integer('created_at').notNull(),
  },
  (table) => [index('sessions_user_id_idx').on(table.userId)],
);

export const familyLeads = sqliteTable(
  'family_leads',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    phone: text('phone').notNull(),
    role: text('role').notNull().default('family'),
    city: text('city'),
    consent: integer('consent', { mode: 'boolean' }).notNull().default(true),
    source: text('source').notNull().default('landing'),
    createdAt: integer('created_at').notNull(),
  },
  (table) => [index('family_leads_created_at_idx').on(table.createdAt)],
);

export const scamReports = sqliteTable(
  'scam_reports',
  {
    id: text('id').primaryKey(),
    reporterName: text('reporter_name'),
    phoneNumber: text('phone_number').notNull(),
    channel: text('channel').notNull().default('phone'),
    category: text('category').notNull().default('unknown'),
    description: text('description'),
    status: text('status').notNull().default('pending'),
    createdAt: integer('created_at').notNull(),
  },
  (table) => [index('scam_reports_phone_idx').on(table.phoneNumber)],
);

export type UserRow = typeof users.$inferSelect;
export type SessionRow = typeof sessions.$inferSelect;
export type FamilyLeadRow = typeof familyLeads.$inferSelect;
export type ScamReportRow = typeof scamReports.$inferSelect;
