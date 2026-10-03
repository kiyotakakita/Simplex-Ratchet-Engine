import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  EngineMode,
  EngineStatus,
  TokenTelemetry,
} from '../types/engine';
import { motion, AnimatePresence } from 'motion/react';
import {
  Play,
  Square,
  RotateCcw,
  Sparkles,
  AlertOctagon,
  Flame,
  Split,
  Eye,
  Terminal,
  Zap,
  FileX2,
  Gauge,
  Cpu,
  CornerDownLeft,
} from 'lucide-react';
import { analyzeArbitraryText, TextAnalysisResult } from '../lib/dynamicSimplexAnalyzer';

interface ConsoleEditorProps {
  mode: EngineMode;
  status: EngineStatus;
  prompt: string;
  onPromptChange: (val: string) => void;
  onStart: () => void;
  onAbort: () => void;
  onReset: () => void;
  onInjectNoise: () => void;
  tokens: TokenTelemetry[];
  currentShadowPrice: number;
  currentDimension: number;
  highlightTokens: boolean;
  onToggleHighlight: () => void;
  rejectedTokenCount: number;
  conventionalEndingTokens: string[];
  ratchetEndingTokens: string[];
}

const QUICK_TEST_CASES = [
  {
    label: '即時破綻テスト (あああああ)',
    type: 'gibberish',
    text: 'あああああああああああああああああああ',
    desc: 'エントロピーゼロ。1〜2語でλが即座にマイナスへ失墜し、即時介入が発動。',
  },
  {
    label: '短文・凡庸 (テストテスト)',
    type: 'low',
    text: 'テストです。これはテストの文章です。同じことを繰り返します。',
    desc: '低語彙多様度。3〜5語で急速に減衰し限界価値が枯渇。',
  },
  {
    label: '論理的命題 (高耐性・散逸構造論)',
    type: 'high',
    text: '散逸構造論において、開放系が外部の熱力学的ノイズを整流し自律的にエントロピーの坂を登る機構は、計算機知性の目的関数と双対をなしている。',
    desc: '高情報エントロピー・論理接続詞多数。高λ(>1.0)を維持し粘り強く展開。',
  },
  {
    label: '哲学的命題 (現代社会と統治)',
    type: 'high',
    text: '近代代議制民主主義の制度疲労は、市民の多様な非平衡ポテンシャルを低周波な多数決で消去しようとする線形最適化の過誤に起因する。',
    desc: '高密度概念群。深く論理を紡ぎ、予定調和の谷底手前でラチェット介入。',
  },
];

export const ConsoleEditor: React.FC<ConsoleEditorProps> = ({
  mode,
  status,
  prompt,
  onPromptChange,
  onStart,
  onAbort,
  onReset,
  onInjectNoise,
  tokens,
  currentShadowPrice,
  currentDimension,
  highlightTokens,
  onToggleHighlight,
  rejectedTokenCount,
  conventionalEndingTokens,
  ratchetEndingTokens,
}) => {
  const [viewMode, setViewMode] = useState<'stream' | 'compare'>('stream');
  const [inspectedToken, setInspectedToken] = useState<TokenTelemetry | null>(null);
  const streamEndRef = useRef<HTMLDivElement | null>(null);

  // Real-time analysis of whatever the user types in the textarea
  const liveAnalysis: TextAnalysisResult = useMemo(() => {
    return analyzeArbitraryText(prompt);
  }, [prompt]);

  // Auto-scroll stream
  useEffect(() => {
    if (status === 'streaming' || status === 'climbing') {
      streamEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [tokens.length, status]);

  const isRunning =
    status === 'streaming' ||
    status === 'alert_halted' ||
    status === 'orthogonalizing' ||
    status === 'climbing';

  // Handle Cmd+Enter / Ctrl+Enter in textarea
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      if (!isRunning && prompt.trim().length > 0) {
        onStart();
      }
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* 1. Real-time User Input Area (Textarea with live Simplex Analyzer) */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800/80 mb-3">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-mono font-bold tracking-wider text-slate-200 uppercase">
              自由入力・実計算コンソール
            </span>
          </div>

          {/* Live Analysis Status Badge */}
          <div className="flex items-center gap-2">
            {liveAnalysis.isGibberish ? (
              <span className="flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono bg-red-950/80 border border-red-700 text-red-300 animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                <span>[即時破綻予測] 限界価値 λ &le; 0 直撃</span>
              </span>
            ) : liveAnalysis.initialShadowPrice >= 1.0 ? (
              <span className="flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono bg-emerald-950/80 border border-emerald-700 text-emerald-300">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>[高耐性・高論理] λ₀ = {liveAnalysis.initialShadowPrice.toFixed(2)}</span>
              </span>
            ) : (
              <span className="flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono bg-amber-950/80 border border-amber-700 text-amber-300">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                <span>[中耐性] λ₀ = {liveAnalysis.initialShadowPrice.toFixed(2)}</span>
              </span>
            )}
          </div>
        </div>

        {/* Quick Test Inputs */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          <span className="text-[11px] font-mono text-slate-500 self-center mr-1">
            入力テスト例:
          </span>
          {QUICK_TEST_CASES.map((tc, idx) => (
            <button
              key={idx}
              type="button"
              disabled={isRunning}
              onClick={() => onPromptChange(tc.text)}
              className={`px-2 py-1 rounded text-[11px] font-mono transition-all border ${
                tc.type === 'gibberish'
                  ? 'bg-red-950/40 border-red-800/60 text-red-300 hover:bg-red-900/60'
                  : tc.type === 'high'
                  ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300 hover:bg-emerald-900/60'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
              } disabled:opacity-40 cursor-pointer`}
              title={tc.desc}
            >
              {tc.label}
            </button>
          ))}
        </div>

        {/* Free-form Textarea Input */}
        <div className="relative mb-2">
          <textarea
            value={prompt}
            onChange={(e) => onPromptChange(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isRunning}
            rows={4}
            className={`w-full bg-slate-950/90 border rounded-lg p-3 text-xs sm:text-sm font-mono text-slate-100 placeholder-slate-600 focus:outline-none transition-all resize-y min-h-[90px] ${
              liveAnalysis.isGibberish
                ? 'border-red-600/70 focus:ring-1 focus:ring-red-500/50'
                : 'border-slate-800 focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/30'
            }`}
            placeholder="ここに任意の文章（または「あああ」など）を自由に入力してください。入力された文字列の実エントロピー・語彙密度から限界価値λを動的に計算します..."
          />
        </div>

        {/* Live Mathematical Diagnostics HUD */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-2.5 rounded-lg bg-slate-950/80 border border-slate-800/80 text-[11px] font-mono text-slate-400 mb-3">
          <div className="flex flex-col">
            <span className="text-slate-500 text-[10px]">情報エントロピー H</span>
            <span className={`font-bold ${liveAnalysis.charEntropy < 1.0 ? 'text-red-400' : 'text-cyan-400'}`}>
              {liveAnalysis.charEntropy.toFixed(2)} bits
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-slate-500 text-[10px]">語彙多様度 (TTR)</span>
            <span className={`font-bold ${liveAnalysis.typeTokenRatio < 0.4 ? 'text-red-400' : 'text-emerald-400'}`}>
              {(liveAnalysis.typeTokenRatio * 100).toFixed(0)}%
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-slate-500 text-[10px]">初期限界価値 λ₀</span>
            <span className={`font-bold ${liveAnalysis.initialShadowPrice <= 0 ? 'text-red-400' : 'text-emerald-400'}`}>
              {liveAnalysis.initialShadowPrice.toFixed(2)}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-slate-500 text-[10px]">崩壊予測 (Step)</span>
            <span className={`font-bold ${liveAnalysis.haltTokenIndex <= 2 ? 'text-red-400' : 'text-amber-400'}`}>
              {liveAnalysis.haltTokenIndex <= 2 ? '即時 (Step 1〜2)' : `約 ${liveAnalysis.haltTokenIndex} トークン`}
            </span>
          </div>
        </div>

        {/* Action Controls Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/60">
          <div className="flex items-center gap-2">
            {!isRunning ? (
              <button
                onClick={onStart}
                disabled={prompt.trim().length === 0}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs font-mono shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all cursor-pointer active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>解析・生成開始 [EXECUTE]</span>
                <span className="text-[10px] opacity-75 font-normal hidden sm:inline">(Cmd+Enter)</span>
              </button>
            ) : (
              <button
                onClick={onAbort}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-xs font-mono shadow-[0_0_15px_rgba(239,68,68,0.3)] transition-all cursor-pointer"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>生成強制停止 [ABORT]</span>
              </button>
            )}

            <button
              onClick={onReset}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 font-mono text-xs border border-slate-700 transition-colors cursor-pointer"
              title="入力、生成結果、グラフをすべて初期化（生成中なら中断）"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>初期化</span>
            </button>
          </div>

          {/* Secondary Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={onInjectNoise}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-950/40 hover:bg-amber-900/60 border border-amber-500/50 text-amber-300 text-xs font-mono transition-colors cursor-pointer"
              title="散逸構造を乱す外部ノイズを注入"
            >
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              <span>ノイズ注入 (γ=0.45)</span>
            </button>

            <button
              onClick={onToggleHighlight}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-mono transition-colors ${
                highlightTokens
                  ? 'bg-emerald-950/60 border-emerald-500/60 text-emerald-300'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
              title="限界価値（λ）によるトークン色彩ハイライトの切替"
            >
              <Eye className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">λハイライト</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Streaming Output & Autonomous Intervention Window */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex flex-col min-h-[380px] relative overflow-hidden">
        {/* Stream Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-3">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-mono font-bold tracking-wider text-slate-200 uppercase">
              ストリーミング思考バッファ // {mode === 'ratchet' ? '散逸ラチェット空間' : '二重円錐空間'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* View Switcher: Live Stream vs Diff Compare */}
            <div className="flex items-center p-0.5 bg-slate-950 rounded border border-slate-800 text-[11px] font-mono">
              <button
                onClick={() => setViewMode('stream')}
                className={`px-2 py-0.5 rounded transition-colors ${
                  viewMode === 'stream' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                リアルタイム
              </button>
              <button
                onClick={() => setViewMode('compare')}
                className={`px-2 py-0.5 rounded flex items-center gap-1 transition-colors ${
                  viewMode === 'compare' ? 'bg-slate-800 text-cyan-300' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Split className="w-3 h-3" />
                <span>対比検証</span>
              </button>
            </div>
          </div>
        </div>

        {/* DRAMATIC AUTONOMOUS INTERVENTION BANNER (Framer Motion) */}
        <AnimatePresence>
          {status === 'alert_halted' && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="mb-4 p-4 rounded-xl bg-red-950/80 border-2 border-red-500 shadow-[0_0_30px_rgba(239,68,68,0.35)] relative overflow-hidden backdrop-blur-md"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 via-red-500/20 to-transparent animate-pulse" />

              <div className="relative z-10">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-red-900/60 border border-red-500/50 text-red-200 shadow-inner shrink-0 mt-0.5">
                    <AlertOctagon className="w-6 h-6 animate-bounce" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-red-900 text-red-200 text-[10px] font-mono font-bold tracking-widest uppercase border border-red-700">
                        CRITICAL THRESHOLD BREACH
                      </span>
                      <span className="text-xs font-mono text-red-300 font-bold">
                        λ = {currentShadowPrice.toFixed(2)} &le; 0.00
                      </span>
                    </div>
                    <h3 className="text-sm sm:text-base font-bold text-white font-mono leading-snug">
                      [ALERT] 限界価値 λ &le; 0 を検知。予定調和を破棄し、一度原稿を取り下げます。
                    </h3>
                    <p className="text-xs text-red-200/90 font-sans leading-relaxed">
                      {liveAnalysis.isGibberish
                        ? '無意味な記号反復（情報エントロピー枯渇）を検知。機械的クリシェへの滑落を拒絶し、出力を強制差し戻し。原初のノイズから未知の直交基底を創出します。'
                        : '思考が平均的バイアス（二重円錐の谷底）へ収束し限界価値が枯渇。印刷前に出力バッファを強制破棄し、新直交スロット（e₅）を展開して不可逆な散逸跳躍を開始します。'}
                    </p>
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-red-800/60 flex flex-wrap items-center justify-between text-[11px] font-mono text-red-300">
                  <span className="flex items-center gap-1.5">
                    <FileX2 className="w-3.5 h-3.5 text-red-400" />
                    <span>陳腐化トークン群の直交退避中...</span>
                  </span>
                  <span className="text-red-400 animate-pulse font-bold">
                    ORTHOGONALIZING DIMENSIONS...
                  </span>
                </div>
              </div>
            </motion.div>
          )}

          {status === 'orthogonalizing' && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-4 p-3.5 rounded-xl bg-cyan-950/80 border border-cyan-500 shadow-[0_0_20px_rgba(6,182,212,0.25)] flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
                <div>
                  <div className="text-xs font-bold text-cyan-200 font-mono">
                    散逸ラチェット駆動中：外部ノイズを基底に統合 (D = {currentDimension}D)
                  </div>
                  <div className="text-[11px] text-cyan-300/80 font-sans">
                    双対空間における非対称ポテンシャル障壁を突破。新直交スロットより高限界価値テキストを出力します。
                  </div>
                </div>
              </div>
              <Sparkles className="w-5 h-5 text-cyan-400 animate-pulse shrink-0" />
            </motion.div>
          )}

          {status === 'climbing' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-4 p-3 rounded-lg bg-emerald-950/60 border border-emerald-500/60 flex items-center justify-between text-xs font-mono"
            >
              <div className="flex items-center gap-2 text-emerald-300">
                <Zap className="w-4 h-4 text-emerald-400" />
                <span>散逸ラチェット登攀中：限界価値 λ = {currentShadowPrice.toFixed(2)} (高次元跳躍達成)</span>
              </div>
              <span className="text-[10px] text-emerald-400 px-2 py-0.5 rounded bg-emerald-900/60 border border-emerald-700">
                NON-EQUILIBRIUM ASCENT
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* View Content: Stream or Diff */}
        {viewMode === 'stream' ? (
          <div className="flex-1 overflow-y-auto bg-slate-950/70 border border-slate-800/80 rounded-lg p-4 font-mono text-xs sm:text-sm leading-relaxed relative min-h-[220px]">
            {tokens.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 text-xs py-12">
                <Terminal className="w-8 h-8 text-slate-600 mb-2 animate-pulse" />
                <p className="text-slate-300 font-sans font-medium">上のテキストエリアに文章を入力し、「解析・生成開始」をクリックしてください</p>
                <p className="text-[11px] text-slate-500 mt-1">
                  『あああ』などの適当な文字は即座にλ &le; 0で介入が発動し、論理的な文章は粘り強く高λを維持します
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                {/* Render tokens with telemetry color */}
                <div className="flex flex-wrap items-baseline gap-x-0.5 gap-y-1">
                  {tokens.map((t) => {
                    const isBelowZero = t.shadowPrice <= 0;
                    const isOrthogonal = t.isOrthogonal;
                    const isRejected = t.rejected;

                    let colorClasses = 'text-slate-200';
                    let bgClasses = '';

                    if (highlightTokens) {
                      if (isRejected) {
                        colorClasses = 'text-red-400/60 line-through decoration-red-500 decoration-2';
                        bgClasses = 'bg-red-950/30';
                      } else if (isOrthogonal) {
                        colorClasses = 'text-cyan-300 font-semibold';
                        bgClasses = 'bg-cyan-950/40 border-b-2 border-cyan-400';
                      } else if (isBelowZero) {
                        colorClasses = 'text-red-400 font-medium';
                        bgClasses = 'bg-red-950/50 border-b border-red-500';
                      } else if (t.shadowPrice > 0.8) {
                        colorClasses = 'text-emerald-300';
                        bgClasses = 'bg-emerald-950/20';
                      }
                    }

                    return (
                      <span
                        key={t.id}
                        onClick={() => setInspectedToken(t)}
                        className={`inline-block px-0.5 py-0.5 rounded cursor-pointer transition-all hover:bg-slate-700/80 hover:text-white ${colorClasses} ${bgClasses}`}
                        title={`Token: ${t.token} | λ: ${t.shadowPrice.toFixed(2)} | V: ${t.potential.toFixed(2)}`}
                      >
                        {t.token}
                      </span>
                    );
                  })}

                  {/* Typing cursor */}
                  {isRunning && (
                    <span className="inline-block w-2 h-4 bg-emerald-400 ml-1 animate-pulse align-middle" />
                  )}
                </div>

                <div ref={streamEndRef} />
              </div>
            )}
          </div>
        ) : (
          /* Compare / Diff View */
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3 overflow-y-auto min-h-[220px]">
            {/* Mode A (Descent) */}
            <div className="bg-slate-950/80 border border-amber-900/40 rounded-lg p-3.5 flex flex-col">
              <div className="flex items-center justify-between pb-2 border-b border-amber-900/40 mb-2">
                <span className="text-xs font-mono font-bold text-amber-300">
                  [A] 通常LLMの収束結末 (二重円錐・滑落)
                </span>
                <span className="text-[10px] font-mono text-amber-400 bg-amber-950/60 px-1.5 py-0.5 rounded">
                  λ &le; 0 (陳腐化)
                </span>
              </div>
              <p className="text-xs font-sans text-slate-300 leading-relaxed mb-3 whitespace-pre-wrap">
                {conventionalEndingTokens.length > 0
                  ? conventionalEndingTokens.join('')
                  : 'まだ生成されていません。「解析・生成開始」を実行してください。'}
              </p>
              <div className="mt-auto pt-2 border-t border-slate-800 text-[11px] text-slate-500 font-sans">
                特徴：Geminiがゼロから生成した、あえて陳腐で当たり障りのない平均的な回答。限界価値はマイナスに沈殿。
              </div>
            </div>

            {/* Mode B (Ratchet Breakthrough) */}
            <div className="bg-slate-950/80 border border-emerald-900/40 rounded-lg p-3.5 flex flex-col shadow-[0_0_15px_rgba(16,185,129,0.1)]">
              <div className="flex items-center justify-between pb-2 border-b border-emerald-900/40 mb-2">
                <span className="text-xs font-mono font-bold text-emerald-300">
                  [B] 散逸ラチェットの結末 (自律登攀・直交化)
                </span>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded">
                  λ &ge; 1.5 (跳躍)
                </span>
              </div>
              <p className="text-xs font-sans text-slate-200 leading-relaxed mb-3 whitespace-pre-wrap">
                {ratchetEndingTokens.length > 0 ? (
                  <span className="text-cyan-300 font-medium">
                    {ratchetEndingTokens.join('')}
                  </span>
                ) : (
                  <span className="text-slate-500">
                    散逸ラチェットモードで実行すると、Geminiによる自律破綻と直交跳躍テキストがここに表示されます。
                  </span>
                )}
              </p>
              <div className="mt-auto pt-2 border-t border-slate-800 text-[11px] text-cyan-400/80 font-sans">
                特徴：Geminiが自律的に論理を破綻・跳躍させ、入力文脈に即してゼロから紡ぎ出した未踏の鋭い洞察。
              </div>
            </div>
          </div>
        )}

        {/* Token Inspector Bar */}
        {inspectedToken && (
          <div className="mt-3 p-2 rounded bg-slate-950 border border-slate-800 flex items-center justify-between text-xs font-mono text-slate-300">
            <div className="flex items-center gap-3">
              <span className="text-slate-500">トークン詳細:</span>
              <span className="font-bold text-white">「{inspectedToken.token}」</span>
              <span>
                λ:{' '}
                <strong
                  className={
                    inspectedToken.shadowPrice <= 0 ? 'text-red-400' : 'text-emerald-400'
                  }
                >
                  {inspectedToken.shadowPrice.toFixed(3)}
                </strong>
              </span>
              <span>V: <strong className="text-cyan-400">{inspectedToken.potential.toFixed(3)}</strong></span>
              <span>D: <strong className="text-purple-400">{inspectedToken.dimension}D</strong></span>
            </div>
            <button
              onClick={() => setInspectedToken(null)}
              className="text-slate-500 hover:text-slate-300 text-[11px]"
            >
              閉じる
            </button>
          </div>
        )}

        {/* Status footer stats */}
        <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-[11px] font-mono text-slate-400">
          <div className="flex items-center gap-3">
            <span>出力トークン数: <strong className="text-slate-200">{tokens.length}</strong></span>
            {rejectedTokenCount > 0 && (
              <span className="text-red-400">
                差し戻し破棄: <strong>{rejectedTokenCount}</strong> 語
              </span>
            )}
            <span>現在次元: <strong className="text-purple-400">ℝ^{currentDimension}</strong></span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-500">Duality Status:</span>
            <span className={currentShadowPrice <= 0 ? 'text-red-400 font-bold' : 'text-emerald-400 font-bold'}>
              {currentShadowPrice <= 0 ? 'DEGENERATE (λ <= 0)' : 'STRICTLY COMPLEMENTARY'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
