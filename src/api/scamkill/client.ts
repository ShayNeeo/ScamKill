/**
 * ScamKill client facade.
 *
 * Uses the Express backend when `EXPO_PUBLIC_API_URL` is configured and
 * transparently falls back to the in-process engines so the Expo Web PWA
 * works standalone with zero backend process.
 */

import { evaluateIncomingCall } from './call-shield';
import {
  dispatchFamilyAlert as dispatchLocalFamilyAlert,
  getBotInboxHistory,
  recordFamilyReply,
} from './multi-bot-hub';
import type { FamilyReplyPayload } from './multi-bot-hub';
import { SCAMKILL_SCENARIOS, getScenarioById } from './scenarios';
import { CallCheckOutputSchema } from './types';
import type {
  BotDeliveryMessage,
  CallCheckInput,
  CallCheckOutput,
  FamilyAlertInput,
  FamilyAlertReceipt,
} from './types';

export { SCAMKILL_SCENARIOS, getScenarioById };
export type {
  BotChannel,
  BotDeliveryMessage,
  CallCheckInput,
  CallCheckOutput,
  CallRiskStatus,
  CallSourceSignal,
  FamilyAlertInput,
  FamilyAlertReceipt,
  FamilyAlertType,
  ScamKillScenario,
} from './types';

const DEFAULT_FAMILY_SAFE_WORD = 'Cây khế ngọt';
const REQUEST_TIMEOUT_MS = 4000;

function getApiBaseUrl(): string | null {
  const configured =
    typeof process !== 'undefined'
      ? process.env.EXPO_PUBLIC_API_URL ?? process.env.EXPO_PUBLIC_API_BASE_URL
      : undefined;
  if (typeof configured !== 'string' || configured.trim().length === 0) {
    return null;
  }
  return configured.trim().replace(/\/$/, '');
}

/** Returns `undefined` on network/HTTP failure; parsed JSON otherwise. */
async function requestJson(
  path: string,
  init: RequestInit,
): Promise<unknown | undefined> {
  const baseUrl = getApiBaseUrl();
  if (!baseUrl || typeof fetch !== 'function') return undefined;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${baseUrl}${path}`, {
      ...init,
      signal: controller.signal,
    });
    if (!response.ok) return undefined;
    return await response.json();
  } catch {
    return undefined;
  } finally {
    clearTimeout(timer);
  }
}

function isBotDeliveryMessage(value: unknown): value is BotDeliveryMessage {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<BotDeliveryMessage>;
  return typeof candidate.id === 'string' && typeof candidate.channel === 'string';
}

function isFamilyAlertReceipt(value: unknown): value is FamilyAlertReceipt {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<FamilyAlertReceipt>;
  return (
    typeof candidate.alertId === 'string' &&
    Array.isArray(candidate.deliveries)
  );
}

export async function checkIncomingCall(
  input: CallCheckInput,
): Promise<CallCheckOutput> {
  const raw = await requestJson('/api/call-check', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  const parsed = CallCheckOutputSchema.safeParse(raw);
  return parsed.success ? parsed.data : evaluateIncomingCall(input);
}

export function checkIncomingCallSync(input: CallCheckInput): CallCheckOutput {
  return evaluateIncomingCall(input);
}

export async function dispatchFamilyAlert(
  input: FamilyAlertInput,
): Promise<FamilyAlertReceipt> {
  const raw = await requestJson('/api/family-alert', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  return isFamilyAlertReceipt(raw) ? raw : dispatchLocalFamilyAlert(input);
}

export async function getBotInbox(): Promise<BotDeliveryMessage[]> {
  const raw = await requestJson('/api/bots/inbox', { method: 'GET' });
  if (Array.isArray(raw)) return raw as BotDeliveryMessage[];
  return getBotInboxHistory();
}

export async function simulateFamilyReply(
  messageId: string,
  reply: FamilyReplyPayload,
): Promise<BotDeliveryMessage | null> {
  const raw = await requestJson('/api/bots/family-reply', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messageId, reply }),
  });

  if (raw === null) return null;
  if (isBotDeliveryMessage(raw)) return raw;
  return recordFamilyReply(messageId, reply);
}

export function getDefaultFamilySafeWord(): string {
  return DEFAULT_FAMILY_SAFE_WORD;
}
