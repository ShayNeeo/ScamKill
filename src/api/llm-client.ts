/**
 * Google AI Studio LLM Client
 *
 * Calls Gemma-4-31B-IT via Google AI Studio REST API.
 * No SDK dependency needed — just fetch + JSON.
 */

import type { LlmPrompt, LlmResponse } from './risk/contract';
import type { LlmClient } from './risk/llm';

const GOOGLE_AI_BASE = 'https://generativelanguage.googleapis.com/v1beta';

// ── Config ──────────────────────────────────────────────────────────────────

function getApiKey(): string | undefined {
  if (typeof process !== 'undefined' && process.env?.AI_STUDIO_API_KEY) {
    return process.env.AI_STUDIO_API_KEY;
  }
  return undefined;
}

function getModel(): string {
  if (typeof process !== 'undefined' && process.env?.AI_MODEL) {
    return process.env.AI_MODEL;
  }
  return 'gemma-4-31b-it';
}

// ── Response parsing ────────────────────────────────────────────────────────

interface GenerateContentResponse {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string }> };
    finishReason?: string;
  }>;
  promptFeedback?: { blockReason?: string };
}

function parseLlmResponse(raw: GenerateContentResponse, lang: string = 'vi'): LlmResponse {
  const text = raw.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
  if (!text) throw new Error('Empty LLM response');

  const isEn = lang === 'en';

  // Gemma-4 sometimes echoes instructions back in the response preamble.
  // Strip everything before the first non-bullet, non-math line > 15 chars.
  const lines = text.split('\n').map((l) => l.trim());
  let bodyStart = 0;
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    if (!l || l.length < 15) continue;
    if (l.startsWith('$\\rightarrow') || l.includes('$\\rightarrow')) continue;
    bodyStart = i;
    break;
  }
  const body = lines.slice(bodyStart).join('\n').trim();
  if (!body) throw new Error('LLM response contained only system echo');

  // Extract sections (support both Vietnamese and English headers)
  const stepsHeader = isEn ? 'Action steps' : 'Bước hành động';
  const explanation = (extractBefore(body, stepsHeader) ?? extractBefore(body, 'Bước hành động'))?.trim() ?? body.slice(0, 500);
  const stepsRaw = extractList(body, stepsHeader).length > 0 ? extractList(body, stepsHeader) : extractList(body, 'Bước hành động');
  const nextAction = extractNextAction(body, isEn);

  const defaultEnSteps = [
    'Pause for 2 minutes. Do not send money, OTP, or passwords immediately.',
    'Open the official website or mobile app directly to confirm.',
    'Call the official customer service hotline to verify.',
  ];

  const defaultViSteps = [
    'Dừng lại 2 phút, không chuyển tiền hay cung cấp thông tin ngay.',
    'Mở app/website chính thức để xác nhận.',
    'Gọi số hotline chính thức để xác minh.',
  ];

  const verificationSteps = stepsRaw.length > 0 ? stepsRaw : (isEn ? defaultEnSteps : defaultViSteps);
  const defaultNextAction = isEn
    ? 'Pause – Do not transfer money – Verify via official channels.'
    : 'Dừng lại – Xác nhận qua kênh chính thức.';

  return {
    explanation: explanation?.trim() ?? body.slice(0, 500),
    verificationSteps,
    nextAction: nextAction ?? defaultNextAction,
  };
}

function extractAfterHeader(text: string, header: string): string | null {
  const idx = text.toLowerCase().indexOf(header.toLowerCase());
  if (idx < 0) return null;
  let start = idx + header.length;
  while (start < text.length && (text[start] === ':' || text[start] === '：' || text[start] === ' ')) start++;
  return text.slice(start).trim();
}

function extractBefore(text: string, marker: string): string | null {
  const idx = text.toLowerCase().indexOf(marker.toLowerCase());
  if (idx <= 0) return text.trim();
  return text.slice(0, idx).trim();
}

function extractList(text: string, header: string): string[] {
  const section = extractAfterHeader(text, header);
  if (!section) return [];
  const lines = section.split('\n').map((l) => l.trim());
  const bullets: string[] = [];
  for (const line of lines) {
    if (line.startsWith('-') || line.startsWith('•') || line.startsWith('*') || /^\d+\./.test(line)) {
      const clean = line.replace(/^([-•*]|\d+\.)\s*/, '').trim();
      if (clean.length > 5 && !clean.toLowerCase().startsWith('part')) {
        bullets.push(clean);
      }
    } else if (bullets.length > 0 && line === '') {
      break;
    }
  }
  return bullets;
}

function extractNextAction(text: string, isEn: boolean): string | null {
  const headers = isEn
    ? ['next action', 'part 3']
    : ['hành động tiếp theo', 'bước 3'];

  for (const h of headers) {
    const idx = text.toLowerCase().indexOf(h);
    if (idx >= 0) {
      let rest = text.slice(idx + h.length).trim();
      rest = rest.replace(/^[:：\-*]\s*/, '').trim();
      const firstLine = rest.split('\n')[0]?.trim();
      if (firstLine && firstLine.length > 5) {
        return firstLine.replace(/^(draft|refinement|recommendation):\s*/i, '').trim();
      }
    }
  }
  return null;
}

// ── Google AI Studio Client ─────────────────────────────────────────────────

export class GoogleAiStudioClient implements LlmClient {
  private apiKey: string;
  private model: string;

  constructor(apiKey?: string, model?: string) {
    this.apiKey = apiKey ?? getApiKey() ?? '';
    this.model = model ?? getModel();
  }

  get isConfigured(): boolean {
    return this.apiKey.length > 0;
  }

  async generate(prompt: LlmPrompt): Promise<LlmResponse> {
    if (!this.isConfigured) {
      throw new Error('AI_STUDIO_API_KEY not configured');
    }

    const url = `${GOOGLE_AI_BASE}/models/${this.model}:generateContent?key=${this.apiKey}`;

    // Use systemInstruction (proper API field) plus plain user message.
    // This avoids the model echoing instructions verbatim.
    const body = {
      systemInstruction: { parts: [{ text: prompt.system }] },
      contents: [{ role: 'user', parts: [{ text: prompt.user }] }],
      generationConfig: {
        temperature: 0.15,
        maxOutputTokens: 512,
        topP: 0.7,
        responseMimeType: 'text/plain',
      },
      safetySettings: [
        { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
      ],
    };

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2500);
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Google AI Studio ${res.status}: ${errText}`);
      }

      const raw: GenerateContentResponse = await res.json();

      if (raw.promptFeedback?.blockReason) {
        throw new Error(`Content blocked: ${raw.promptFeedback.blockReason}`);
      }

      const isEn = prompt.system.includes('ENGLISH');
      return parseLlmResponse(raw, isEn ? 'en' : 'vi');
    } finally {
      clearTimeout(timer);
    }
  }
}

// ── Singleton ───────────────────────────────────────────────────────────────

let _client: GoogleAiStudioClient | undefined;

export function getGoogleAiClient(): GoogleAiStudioClient {
  if (!_client) {
    _client = new GoogleAiStudioClient();
  }
  return _client;
}
