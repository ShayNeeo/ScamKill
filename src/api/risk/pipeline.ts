/**
 * WP3 — Risk Pipeline
 *
 * Orchestrates the rule engine, LLM explainer, and RAG retrieval.
 * Transforms a PreprocessedInput into an AnalyzeOutput.
 */

import type {
  RiskPipelineInput,
  RiskPipelineOutput,
  MatchedSignal,
} from './contract';

export type { RiskPipelineInput, RiskPipelineOutput };

import { evaluateRules } from './rules';
import { scoreRisk } from './scorer';
import { generateExplanation } from './llm';
import { retrieveRag } from './rag';

// ── Pipeline ─────────────────────────────────────────────────────────────────

export interface RiskPipeline {
  run(input: RiskPipelineInput): Promise<RiskPipelineOutput>;
}

// ── Implementation ───────────────────────────────────────────────────────────

export class DefaultRiskPipeline implements RiskPipeline {
  async run(input: RiskPipelineInput): Promise<RiskPipelineOutput> {
    const lang = (input as any).language || 'vi';
    const isEn = lang === 'en';

    // Rule engine uses cleaned text (keeps diacritics for VN keyword matching)
    const text = input.preprocessed.normalised.cleaned;
    // LLM receives REDACTED text only — zero PII to external services
    const redactedText = input.preprocessed.redacted.text;

    // 1. Rule engine
    const signals = evaluateRules(text, lang);

    // 2. RAG retrieval (if index available)
    const ragRetrieval = retrieveRag(
      { signals: signals.map((s) => s.signal) },
      input.ragIndex,
    );

    // 3. LLM explanation (uses REDACTED text — zero PII leaves the device)
    const llmResponse = await generateExplanation(signals, redactedText, ragRetrieval.alerts, lang);

    // 4. Risk scoring
    const riskLevel = scoreRisk(signals);

    // 5. Build output
    const defaultEnSteps = [
      'Pause for 2 minutes. Do not send money, OTP, or passwords immediately.',
      'Open the official website or mobile app directly to confirm.',
      'Call the official customer service hotline to verify.',
    ];
    const defaultEnNextAction = 'Pause – Do not transfer money – Verify via official channels.';

    const defaultViSteps = [
      'Dừng lại 2 phút. Không chuyển tiền, đọc mã OTP hay mật khẩu ngay.',
      'Mở ứng dụng hoặc trang web chính thức của tổ chức để kiểm tra.',
      'Gọi điện thoại hotline chăm sóc khách hàng chính thức để xác minh.',
    ];
    const defaultViNextAction = 'Dừng lại – Không chuyển tiền – Xác nhận qua kênh chính thức.';

    const containsVietnamese = (s: string) =>
      /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ]/iu.test(s);

    const containsEnglish = (s: string) =>
      /\b(Pause|Do not|Click|Clicking|Verify|Transfer|Immediately|Official|Hotline|Call|Never|Send|Account)\b/i.test(s);

    let verificationSteps = llmResponse.verificationSteps;
    if (isEn && (verificationSteps.length === 0 || verificationSteps.some(containsVietnamese))) {
      verificationSteps = defaultEnSteps;
    } else if (!isEn && (verificationSteps.length === 0 || verificationSteps.some(containsEnglish))) {
      verificationSteps = defaultViSteps;
    }

    let nextAction = llmResponse.nextAction;
    if (isEn && (!nextAction || containsVietnamese(nextAction))) {
      nextAction = defaultEnNextAction;
    } else if (!isEn && (!nextAction || containsEnglish(nextAction))) {
      nextAction = defaultViNextAction;
    }

    const output: RiskPipelineOutput = {
      riskLevel,
      redFlags: signals.map((s) => ({ signal: s.signal, explanation: s.explanation })),
      verificationSteps,
      nextAction,
      lessonCard: this.buildLessonCard(signals, riskLevel, lang),
      disclaimer: isEn
        ? 'AI assists with red-flag detection only. It does not replace your judgment or provide medical, legal, or financial advice.'
        : 'AI chỉ hỗ trợ nhận diện dấu hiệu, không thay cô/chú quyết định và không đưa lời khuyên y tế/pháp lý/tài chính.',
      trace: {
        inputHash: this.hashInput(redactedText),
        rulesMatched: signals,
        llmPrompt: { system: 'REDACTED', user: 'REDACTED' }, // privacy
        llmResponse,
        ragRetrieved: ragRetrieval.alerts,
      },
    };

    return output;
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private buildLessonCard(signals: MatchedSignal[], riskLevel: string, lang: string = 'vi'): any | undefined {
    // Only generate lesson for caution/high_risk
    if (riskLevel === 'safe' || riskLevel === 'insufficient_data') {
      return undefined;
    }

    const isEn = lang === 'en';
    const points: string[] = [];
    const seen = new Set<string>();

    for (const sig of signals) {
      const key = sig.signal;
      if (seen.has(key)) continue;
      seen.add(key);

      switch (sig.signal) {
        case 'urgency':
          points.push(isEn ? 'Time pressure and secrecy requests are common scam tactics.' : 'Áp lực thời gian và yêu cầu giữ bí mật là chiêu thức phổ biến.');
          break;
        case 'authority_impersonation':
          points.push(isEn ? 'Government agencies never ask for OTP codes or passwords over messages.' : 'Cơ quan nhà nước không hỏi OTP/mật khẩu qua tin nhắn.');
          break;
        case 'too_good_to_be_true':
          points.push(isEn ? 'Unusually high profits or unexpected prize claims are common traps.' : 'Lợi nhuận quá cao hoặc quà tặng bất thường thường là bẫy.');
          break;
        case 'upfront_payment':
          points.push(isEn ? 'Do not transfer money before verifying through official customer service.' : 'Không chuyển tiền trước khi xác minh qua kênh chính thức.');
          break;
        case 'personal_data_request':
          points.push(isEn ? 'Never provide OTPs or identity details to strangers or link forms.' : 'Không cung cấp thông tin cá nhân cho người lạ hoặc link lạ.');
          break;
        case 'suspicious_url':
          points.push(isEn ? 'Do not click unknown links; open official apps or websites directly.' : 'Không bấm link lạ; mở app/website chính thức thay thế.');
          break;
        case 'social_proof':
          points.push(isEn ? 'Customer comments and profit screenshots can easily be fabricated.' : 'Bình luận và ảnh lợi nhuận có thể bị tạo giả.');
          break;
      }
    }

    return {
      title: isEn ? '3 Key Safety Reminders' : '3 dấu hiệu cần nhớ',
      points: points.slice(0, 3), // max 3
      quiz: {
        question: isEn
          ? 'When receiving an urgent payment request with a strange link, what should you do?'
          : 'Khi nhận tin yêu cầu chuyển tiền gấp kèm link lạ, cô/chú nên làm gì?',
        answer: isEn
          ? 'Pause, verify via official channels, and do not click suspicious links.'
          : 'Dừng lại, xác minh qua kênh chính thức, không bấm link.',
      },
    };
  }

  private hashInput(text: string): string {
    // Simple hash for audit (not crypto)
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return `hash_${Math.abs(hash).toString(16)}`;
  }
}
