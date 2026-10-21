import type { AnalyzeClient, AnalysisInput, AnalyzeOutput } from './contract';

export const mockAnalyze: AnalyzeClient['analyze'] = async (
  input: AnalysisInput
): Promise<AnalyzeOutput> => {
  const { DefaultRiskPipeline } = await import('./risk/pipeline');
  const pipeline = new DefaultRiskPipeline();

  const lang = input.language || 'vi';

  const text =
    input.kind === 'text'
      ? input.text
      : input.kind === 'url'
        ? `url ${input.url}`
        : '';

  if (!text && (input.kind === 'image' || input.kind === 'voice')) {
    const isEn = lang === 'en';
    return {
      riskLevel: 'insufficient_data',
      redFlags: [],
      verificationSteps: isEn
        ? ['Please describe the image/voice content or paste text to analyze.']
        : ['Hãy mô tả nội dung ảnh hoặc paste văn bản để AI hỗ trợ kiểm chứng.'],
      nextAction: isEn
        ? 'If unsure, ask a trusted contact before taking action.'
        : 'Nếu chưa chắc, hỏi người thân trước khi làm theo nội dung ảnh.',
      disclaimer: isEn
        ? 'Image/voice requires server processing before analysis.'
        : 'Ảnh cần được trích xuất văn bản (OCR) ở phía máy chủ trước khi phân tích.',
    };
  }

  const preprocessed = {
    normalised: { cleaned: text },
    redacted: { text },
  };

  return await pipeline.run({ preprocessed, language: lang } as any);
};
