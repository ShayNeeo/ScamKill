import 'dotenv/config';
import express from 'express';
import { createServerAnalyzeClient } from './src/api/client.js';
import { SCAMKILL_SCENARIOS } from './src/api/scamkill/client.js';
import { evaluateIncomingCall } from './src/api/scamkill/call-shield.js';
import {
  dispatchFamilyAlert,
  getBotInboxHistory,
  recordFamilyReply,
} from './src/api/scamkill/multi-bot-hub.js';
import {
  CallCheckInputSchema,
  FamilyAlertInputSchema,
} from './src/api/scamkill/types.js';

const app = express();

// Enable CORS for Expo web / cross-origin requests
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.setHeader('Access-Control-Max-Age', '86400');
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  next();
});

app.use(express.json({ limit: '10mb' }));

const client = createServerAnalyzeClient();
const hasRealAI = !!process.env.AI_STUDIO_API_KEY;

console.log(`[server] AI mode: ${hasRealAI ? 'Google AI Studio (real)' : 'mock'}`);
console.log(`[server] Model: ${process.env.AI_MODEL || 'gemma-4-31b-it'}`);

function normalizeForMatch(value) {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}

function findDeterministicScenario(input) {
  if (!input || input.kind !== 'text' || typeof input.text !== 'string') {
    return null;
  }
  const text = normalizeForMatch(input.text);
  return (
    SCAMKILL_SCENARIOS.find((scenario) => {
      if (scenario.messageText && normalizeForMatch(scenario.messageText) === text) {
        return true;
      }
      const transcript = scenario.callInput?.spokenTranscriptPreview;
      return !!transcript && normalizeForMatch(transcript) === text;
    }) ?? null
  );
}

// Health check
app.get(['/health', '/api/health'], (req, res) => {
  res.json({
    status: 'ok',
    ai: hasRealAI ? 'real' : 'mock',
    model: process.env.AI_MODEL || 'gemma-4-31b-it',
    timestamp: new Date().toISOString(),
  });
});

// Analyze endpoint — deterministic pitch scenarios win before the AI pipeline.
app.post('/api/analyze', async (req, res) => {
  try {
    const input = req.body;
    if (!input || !input.kind) {
      return res.status(400).json({ error: 'Invalid input: missing kind' });
    }

    const scenario = findDeterministicScenario(input);
    if (scenario?.expectedAnalyzeOutput) {
      return res.json(scenario.expectedAnalyzeOutput);
    }

    const result = await client.analyze(input);
    res.json(result);
  } catch (error) {
    console.error('[server] Analyze error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// Feature 1 — call risk check
app.post('/api/call-check', (req, res) => {
  try {
    const parsed = CallCheckInputSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Invalid call-check input',
        details: parsed.error.flatten(),
      });
    }
    res.json(evaluateIncomingCall(parsed.data));
  } catch (error) {
    console.error('[server] Call-check error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// Feature 3A — consent-gated family alert
app.post('/api/family-alert', async (req, res) => {
  try {
    const parsed = FamilyAlertInputSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Invalid family-alert input',
        details: parsed.error.flatten(),
      });
    }
    const receipt = await dispatchFamilyAlert(parsed.data);
    res.json(receipt);
  } catch (error) {
    console.error('[server] Family-alert error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// Family inbox — newest first
app.get('/api/bots/inbox', (req, res) => {
  res.json(getBotInboxHistory());
});

// Relative co-decision reply
app.post('/api/bots/family-reply', (req, res) => {
  try {
    const body = req.body ?? {};
    const messageId = body.messageId;
    const payload = body.reply ?? body;
    const validActions = ['call_back_now', 'confirm_scam_block', 'confirm_safe'];

    if (!messageId || !validActions.includes(payload?.action)) {
      return res.status(400).json({
        error: 'Invalid family-reply input: messageId and valid action required',
      });
    }

    const updated = recordFamilyReply(messageId, {
      from: payload.from,
      action: payload.action,
      note: payload.note,
    });

    if (!updated) {
      return res.status(404).json({ error: 'Message not found' });
    }
    res.json(updated);
  } catch (error) {
    console.error('[server] Family-reply error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// Demo scenario catalog
app.get('/api/scenarios', (req, res) => {
  res.json(SCAMKILL_SCENARIOS);
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`[server] API server running on port ${PORT}`);
  console.log(`[server] POST http://localhost:${PORT}/api/analyze`);
  console.log(`[server] POST http://localhost:${PORT}/api/call-check`);
  console.log(`[server] POST http://localhost:${PORT}/api/family-alert`);
});
