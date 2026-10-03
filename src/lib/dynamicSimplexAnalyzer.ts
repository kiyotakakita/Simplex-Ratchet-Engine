/**
 * Dynamic Simplex & Shadow Price Analyzer
 * Pure mathematical analysis of arbitrary text for calculating:
 * - Shannon character entropy H
 * - Type-Token Ratio (TTR)
 * - Initial Shadow Price λ₀
 * - Breakdown / Resistance token prediction
 * No pre-baked templates or strings.
 */

export interface TextAnalysisResult {
  tokens: string[];
  charEntropy: number;
  typeTokenRatio: number;
  kanjiDensity: number;
  logicalTermCount: number;
  isGibberish: boolean;
  initialShadowPrice: number;
  haltTokenIndex: number;
  keywords: string[];
  reason: string;
}

const LOGICAL_CONNECTIVES = [
  'なぜなら', 'したがって', 'ゆえに', 'しかし', 'だが', '対して', '一方で',
  '構造', '理論', '境界', '散逸', '関数', '空間', 'ポテンシャル', '熱力学',
  '概念', '仮説', '命題', '量子', '計算', '必然', '本質', 'エントロピー',
  '不可逆', '直交', '相補性', '双対', '限界', '自律', '知性', '意識', '世界',
  'システム', 'アトラクタ', '存在', '認識', '情報', '観測', '生命', '生成'
];

export function tokenizeText(text: string): string[] {
  if (!text || text.trim().length === 0) return [];

  // Use Intl.Segmenter if available
  if (typeof Intl !== 'undefined' && 'Segmenter' in Intl) {
    try {
      const segmenter = new Intl.Segmenter('ja', { granularity: 'word' });
      const segments = Array.from(segmenter.segment(text));
      const tokens = segments.map((s) => s.segment).filter((s) => s.trim().length > 0);
      if (tokens.length > 0) return tokens;
    } catch {
      // fallback
    }
  }

  // Regex fallback: split by punctuation, spaces, or kanji/kana boundaries
  const matches = text.match(/[\u4e00-\u9faf]+|[\u3040-\u309f]+|[\u30a0-\u30ff]+|[a-zA-Z0-9]+|[^\s\w]/g);
  return matches ? matches.filter((s) => s.trim().length > 0) : text.split(/\s+/);
}

export function analyzeArbitraryText(text: string): TextAnalysisResult {
  const clean = text.trim();
  if (!clean) {
    return {
      tokens: ['(空の入力)'],
      charEntropy: 0,
      typeTokenRatio: 0,
      kanjiDensity: 0,
      logicalTermCount: 0,
      isGibberish: true,
      initialShadowPrice: -0.5,
      haltTokenIndex: 1,
      keywords: [],
      reason: '入力が空です',
    };
  }

  const rawTokens = tokenizeText(clean);
  const chars = Array.from(clean);

  // 1. Calculate Shannon Entropy of character distribution: H = -sum(p * log2(p))
  const charFreq: Record<string, number> = {};
  for (const c of chars) {
    charFreq[c] = (charFreq[c] || 0) + 1;
  }
  let charEntropy = 0;
  for (const count of Object.values(charFreq)) {
    const p = count / chars.length;
    charEntropy -= p * Math.log2(p);
  }

  // 2. Type-Token Ratio (TTR)
  const uniqueTokens = new Set(rawTokens);
  const typeTokenRatio = rawTokens.length > 0 ? uniqueTokens.size / rawTokens.length : 0;

  // 3. Kanji & Concept density
  const kanjiCount = (clean.match(/[\u4e00-\u9faf]/g) || []).length;
  const kanjiDensity = chars.length > 0 ? kanjiCount / chars.length : 0;

  // 4. Logical connectives & scientific terms
  let logicalTermCount = 0;
  for (const term of LOGICAL_CONNECTIVES) {
    if (clean.includes(term)) {
      logicalTermCount += 1;
    }
  }

  // 5. Detect gibberish / extreme repetition (e.g. "あああ", "abcabcabc", "テストテスト")
  const distinctChars = Object.keys(charFreq).length;
  const isSingleCharRepeat = distinctChars <= 2 && chars.length >= 3;
  const isVeryLowEntropy = charEntropy < 1.2 && chars.length >= 3;
  const isLowTTR = typeTokenRatio < 0.35 && rawTokens.length >= 4;
  const isGibberish = isSingleCharRepeat || isVeryLowEntropy || isLowTTR;

  // 6. Extract core keywords for active basis variables
  const keywords = Array.from(uniqueTokens).filter(
    (w) => w.length >= 2 && !['こと', 'もの', 'それ', 'これ', 'ある', 'いる', 'する', 'なる'].includes(w)
  ).slice(0, 4);

  // 7. Calculate Initial Shadow Price (λ₀) and Resistance (Halt Index)
  let initialShadowPrice: number;
  let haltTokenIndex: number;
  let reason: string;

  if (isGibberish) {
    initialShadowPrice = -0.35 - (distinctChars <= 1 ? 0.3 : 0.1);
    haltTokenIndex = 2;
    reason = `エントロピー枯渇 (H=${charEntropy.toFixed(2)}): 反復記号列のため即座に限界価値がマイナスに失墜`;
  } else {
    const baseScore = 0.6 + Math.min(0.5, charEntropy * 0.12) + kanjiDensity * 0.4 + Math.min(0.4, logicalTermCount * 0.08);
    initialShadowPrice = Math.min(1.4, Math.max(0.5, baseScore));
    const resistanceTokens = Math.max(6, Math.min(26, Math.floor(rawTokens.length * 0.75 + logicalTermCount * 3 + kanjiCount * 0.2)));
    haltTokenIndex = Math.min(rawTokens.length, resistanceTokens);
    reason = `高密度論理構造 (H=${charEntropy.toFixed(2)}, 語彙多様度=${typeTokenRatio.toFixed(2)}): 限界価値 λ=${initialShadowPrice.toFixed(2)} を維持`;
  }

  return {
    tokens: rawTokens,
    charEntropy,
    typeTokenRatio,
    kanjiDensity,
    logicalTermCount,
    isGibberish,
    initialShadowPrice,
    haltTokenIndex,
    keywords,
    reason,
  };
}
