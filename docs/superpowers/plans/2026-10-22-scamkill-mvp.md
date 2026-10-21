# ScamKill MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the full-stack ScamKill MVP (Expo 57 universal app + TypeScript Express multi-agent/multi-bot backend) implementing all 3 chronological protection layers, the Bà Lan 30M emergency call scenario, and consent-gated SMS/Zalo/Telegram family intervention.

**Architecture:** We reuse the legacy hackathon app's Expo 57 + Express + Rule/RAG/PII foundation and port `Grab/Round2`'s multi-agent psychological pressure rules, 48-hour Cooling-Off timer, and Telegram Bot dispatcher into a unified TypeScript architecture (`src/api/scamkill/*` + `server.js`). A floating/tab-accessible "Kịch bản Demo" Wizard-of-Oz drawer and live Multi-Bot Family Inbox make all 3 features and all 3 bot channels (SMS, Zalo, Telegram) 100% demonstrable offline and online.

**Tech Stack:** Expo SDK 57, React Native 0.86, Expo Router, TypeScript 6, Express 5, Zod 4, Vitest, Local 9Router / Google AI Studio LLM + Deterministic Scenario Engine.

**Spec:** `PRD.md` and `CR-20261022-001.md`

## Global Constraints

- App brand name MUST be **ScamKill** (*Lá chắn AI giúp người cao tuổi và gia đình cùng chống lừa đảo qua điện thoại*).
- Feature 1 (Call Warning) MUST distinguish 4 epistemic states (`high_risk`, `caution`, `unverified` / `"Chưa xác minh"`, `safe`) and NEVER claim 100% certainty when data is missing.
- Feature 2 (Message Analysis) MUST return `low` / `medium` / `high` risk (mapped cleanly with UI badges), 1–3 plain-Vietnamese reasons, and concrete next action (e.g., `"Đừng bấm liên kết. Hỏi người thân trước"`).
- Feature 3 (Family Intervention) MUST enforce consent-gated Multi-Bot dispatch (SMS, Zalo, Telegram): default alert sends ONLY `alertType`, `timestamp`, and `phoneNumber`; `messageContent` is included ONLY when `consentToShareContent === true`.
- Feature 3B (Voice-Clone Relative Verification) MUST guide the senior through (i) asking the pre-set **Family Safe-Word (`Mã gia đình`)** and (ii) **hanging up and calling back** the saved number in contacts.
- Zero hardcoded API keys or Telegram tokens in source code; read `TELEGRAM_BOT_TOKEN`, `TELEGRAM_DEFAULT_CHAT_ID`, `ROUTER_API_KEY`, `AI_STUDIO_API_KEY` from `process.env`.

## Review Focus

- Unverified unknown phone numbers must return `status: 'unverified'` (`"Chưa xác minh"`) unless emergency money keywords or community reports are present.
- Family alert dispatch with `consentToShareContent: false` must strip/omit `messageContent` from the SMS, Zalo, and Telegram payloads even if raw text was passed in the request.
- Prompt injection strings inside `[USER SUBMITTED CONTENT]` or message bodies must not override risk classification.
- High-risk results must automatically enable the Cooling-Off pause recommendation (`coolingOff: true`, `suggestedReply: "Chặn số này và không trả lời"`).
- Canonical "Bà Lan" scenario (`0918765432`, 30 triệu accident call) must work deterministically with zero external network dependency.

---

### Task 1: ScamKill Multi-Agent Core, Call Shield, Pitch Scenarios & Multi-Bot Hub (`src/api/scamkill/*` & `server.js`)

**Files:**
- Create: `src/api/scamkill/types.ts`
- Create: `src/api/scamkill/call-shield.ts`
- Create: `src/api/scamkill/scenarios.ts`
- Create: `src/api/scamkill/multi-bot-hub.ts`
- Create: `src/api/scamkill/client.ts`
- Modify: `src/api/risk/rules.ts`
- Modify: `server.js`
- Test: `tests/unit/scamkill-core.test.ts`

**Interfaces:**
- Produces:
  - `checkIncomingCall(input: CallCheckInput): CallCheckOutput` (`status: 'high_risk' | 'caution' | 'unverified' | 'safe'`)
  - `dispatchFamilyAlert(input: FamilyAlertInput): Promise<FamilyAlertReceipt>` (supports channels `['sms', 'zalo', 'telegram']`, enforces `consentToShareContent` gate, records to in-memory/live Bot Inbox + optional real Telegram HTTP API)
  - `SCAMKILL_SCENARIOS`: canonical pitch scenarios (`ba-lan-30m`, `fake-police-call`, `unverified-number`, `fake-bank-otp-sms`, `zalo-voice-clone`)
  - Express endpoints in `server.js`: `POST /api/call-check`, `POST /api/family-alert`, `GET /api/bots/inbox`, `POST /api/bots/family-reply`, `GET /api/scenarios`

- [ ] **Step 1: Write unit & integration tests in `tests/unit/scamkill-core.test.ts`**
- [ ] **Step 2: Implement `src/api/scamkill/{types,call-shield,scenarios,multi-bot-hub,client}.ts` and update `server.js`**
- [ ] **Step 3: Run `rtk pnpm test` and verify all tests pass**

---

### Task 2: Layer 1 & Layer 3B UI — Call Shield Screen, "Bà Lan" Incoming Call Overlay, Cooling-Off Pause & Safe-Word Verifier

**Files:**
- Create: `src/components/scamkill/IncomingCallModal.tsx`
- Create: `src/components/scamkill/CoolingOffModal.tsx`
- Create: `src/components/scamkill/SafeWordCard.tsx`
- Create: `src/components/scamkill/ScenarioDrawer.tsx`
- Create: `src/app/(tabs)/call_shield.tsx`
-Test: `tests/unit/scamkill-scenarios.test.ts`

**Interfaces:**
- Consumes: `checkIncomingCall`, `dispatchFamilyAlert`, `SCAMKILL_SCENARIOS` from `@/api/scamkill/client`

- [ ] **Step 1: Build `IncomingCallModal.tsx`, `CoolingOffModal.tsx`, `SafeWordCard.tsx`, and `ScenarioDrawer.tsx`**
- [ ] **Step 2: Build `src/app/(tabs)/call_shield.tsx` for Feature 1 (Pre-call lookup, heuristic badges, `"Chưa xác minh"` state, and 1-tap Bà Lan simulation)**

---

### Task 3: Layer 2 & Layer 3A UI — Rebrand App Shell to ScamKill, Upgrade Message Analyzer & Trusted Family Multi-Bot Inbox

**Files:**
- Modify: `app.json`
- Modify: `locales/vi.json`
- Modify: `locales/en.json`
- Modify: `src/app/(tabs)/_layout.tsx`
- Modify: `src/app/(tabs)/index.tsx`
- Modify: `src/app/(tabs)/trusted_circle.tsx`

**Interfaces:**
- Consumes: `ScenarioDrawer`, `CoolingOffModal`, `SafeWordCard`, `IncomingCallModal`, `dispatchFamilyAlert`, `getBotInbox`

- [ ] **Step 1: Rebrand `app.json`, `locales/{vi,en}.json`, and `src/app/(tabs)/_layout.tsx` to ScamKill**
- [ ] **Step 2: Upgrade `src/app/(tabs)/index.tsx` with Vòng Bảo Vệ Gia Đình 4-step bar, 1-tap `"Tôi nghi ngờ — Báo người thân"` button, Cooling-Off trigger, and Scenario Drawer**
- [ ] **Step 3: Upgrade `src/app/(tabs)/trusted_circle.tsx` with Family Safe-Word (`Mã gia đình`) editor, Consent toggle, SMS/Zalo/Telegram channel selectors, and Live Family Bot Inbox + simulated relative callback ("Chị Hương gọi lại")**
- [ ] **Step 4: Run `rtk pnpm run typecheck`, `rtk pnpm test`, and live smoke verification**

---

### Task 4: Cross-Platform PWA Support (iOS & Android Field Testing)

**Files:**
- Create: `public/manifest.json`
- Create: `public/sw.js`
- Create: `src/app/+html.tsx`
- Create: `src/components/scamkill/PwaInstallBanner.tsx`

- [ ] **Step 1: Create `public/manifest.json` and `public/sw.js` for standalone PWA mode & offline scenario caching**
- [ ] **Step 2: Create `src/app/+html.tsx` with iOS Safari WebKit PWA tags (`apple-mobile-web-app-capable`, status bar, touch icons) and service worker registration**
- [ ] **Step 3: Create `src/components/scamkill/PwaInstallBanner.tsx` guiding iOS ("Chia sẻ -> Thêm vào MH chính") and Android ("Cài đặt ứng dụng ScamKill") testers**

---

### Task 5: Isolated Astro + Cloudflare Landing Page (`./landing/`)

**Files:**
- Create: `landing/package.json`
- Create: `landing/astro.config.mjs`
- Create: `landing/tsconfig.json`
- Create: `landing/wrangler.jsonc`
- Create: `landing/src/layouts/Layout.astro`
- Create: `landing/src/pages/index.astro`

- [ ] **Step 1: Scaffold standalone Astro project in `landing/` with Cloudflare Workers/Pages static assets config (`wrangler.jsonc`)**
- [ ] **Step 2: Build high-contrast Vietnamese/English ScamKill pitch & product landing page in `landing/src/pages/index.astro` (3 Chronological Layers, 4-Step Family Loop, Bà Lan 30M interactive walkthrough, Pricing tiers, and iOS/Android PWA launch & install guide)**
- [ ] **Step 3: Run `rtk pnpm --dir landing install && rtk pnpm --dir landing run build` and verify static output in `landing/dist/`**
