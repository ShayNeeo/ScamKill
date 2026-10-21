import type { SessionRow, UserRow } from './store';
import {
  createSession as storeCreateSession,
  deleteExpiredSessions,
  deleteSession as storeDeleteSession,
  findSession,
  findUserById,
} from './store';

/** Lucia-style session auth: opaque cookie token, SHA-256 hashed in storage. */

export const SESSION_COOKIE = 'scamkill_session';
export const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30; // 30 days
const PASSWORD_ITERATIONS = 100_000;

export interface PublicUser {
  id: string;
  email: string;
  name: string;
  createdAt: number;
}

export interface SessionContext {
  user: PublicUser;
  session: { id: string; expiresAt: number };
}

export function toPublicUser(row: UserRow): PublicUser {
  return { id: row.id, email: row.email, name: row.name, createdAt: row.createdAt };
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function generateId(bytes = 16): string {
  return toHex(randomBytes(bytes));
}

export async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return toHex(new Uint8Array(digest));
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const bits = await derive(password, salt, PASSWORD_ITERATIONS);
  return `pbkdf2$${PASSWORD_ITERATIONS}$${toHex(salt)}$${toHex(bits)}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [scheme, iterationsRaw, saltHex, hashHex] = stored.split('$');
  if (scheme !== 'pbkdf2' || !iterationsRaw || !saltHex || !hashHex) return false;
  const iterations = Number(iterationsRaw);
  if (!Number.isFinite(iterations) || iterations < 10_000) return false;
  const expected = hexToBytes(hashHex);
  const actual = await derive(password, hexToBytes(saltHex), iterations);
  return timingSafeEqual(expected, actual);
}

export async function createSession(
  d1: D1Database | undefined,
  userId: string,
): Promise<{ token: string; session: SessionRow }> {
  const token = generateId(32);
  const now = Date.now();
  const session: SessionRow = {
    id: await sha256Hex(token),
    userId,
    expiresAt: now + SESSION_TTL_MS,
    createdAt: now,
  };
  await storeCreateSession(d1, session);
  // Opportunistic cleanup; failures here must never block sign-in.
  void Promise.resolve(deleteExpiredSessions(d1, now)).catch(() => undefined);
  return { token, session };
}

export async function validateSessionToken(
  d1: D1Database | undefined,
  token: string,
): Promise<SessionContext | null> {
  if (!token || token.length < 32) return null;
  const id = await sha256Hex(token);
  const session = await findSession(d1, id);
  if (!session) return null;
  if (session.expiresAt <= Date.now()) {
    await storeDeleteSession(d1, session.id);
    return null;
  }
  const user = await findUserById(d1, session.userId);
  if (!user) return null;
  return {
    user: toPublicUser(user),
    session: { id: session.id, expiresAt: session.expiresAt },
  };
}

export async function invalidateSession(d1: D1Database | undefined, token: string): Promise<void> {
  if (!token) return;
  await storeDeleteSession(d1, await sha256Hex(token));
}

function randomBytes(length: number): Uint8Array {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return bytes;
}

async function derive(password: string, salt: Uint8Array, iterations: number): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: salt as unknown as BufferSource, iterations, hash: 'SHA-256' },
    key,
    256,
  );
  return new Uint8Array(bits);
}

function toHex(bytes: Uint8Array): string {
  let out = '';
  for (const byte of bytes) out += byte.toString(16).padStart(2, '0');
  return out;
}

function hexToBytes(hex: string): Uint8Array {
  const clean = hex.length % 2 === 0 ? hex : `0${hex}`;
  const bytes = new Uint8Array(clean.length / 2);
  for (let i = 0; i < bytes.length; i += 1) {
    bytes[i] = Number.parseInt(clean.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a[i]! ^ b[i]!;
  return diff === 0;
}
