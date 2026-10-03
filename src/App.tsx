/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useCallback } from 'react';
import {
  EngineMode,
  EngineStatus,
  TokenTelemetry,
  ActiveBasisVariable,
} from './types/engine';
import {
  analyzeArbitraryText,
  tokenizeText,
  TextAnalysisResult,
} from './lib/dynamicSimplexAnalyzer';
import { soundFx } from './lib/soundFx';
import { Header } from './components/Header';
import { ConsoleEditor } from './components/ConsoleEditor';
import { ShadowPriceChart } from './components/ShadowPriceChart';
import { TopologyAttractorMap } from './components/TopologyAttractorMap';
import { ActiveBasisPanel } from './components/ActiveBasisPanel';
import { TheoryModal } from './components/TheoryModal';
import { SettingsModal } from './components/SettingsModal';

const DEFAULT_INITIAL_BASIS: ActiveBasisVariable[] = [
  {
    id: 'b1',
    name: '制約1: 語彙分布拘束 (KL-Divergence)',
    type: 'constraint',
    shadowPrice: 0.88,
    slack: 0.12,
    status: 'active',
    dimensionIndex: 1,
  },
  {
    id: 'b2',
    name: '制約2: 損失最小化勾配 (Loss Gradient)',
    type: 'constraint',
    shadowPrice: 0.74,
    slack: 0.05,
    status: 'active',
    dimensionIndex: 2,
  },
  {
    id: 'b3',
    name: '記憶核: 入力意味ベクトル (Memory Lattice)',
    type: 'legacy_log',
    shadowPrice: 0.52,
    slack: 0.28,
    status: 'active',
    dimensionIndex: 3,
  },
  {
    id: 'b4',
    name: '双対スラック: s₄ (Degeneracy Buffer)',
    type: 'slack_var',
    shadowPrice: 0.18,
    slack: 0.82,
    status: 'pivoting',
    dimensionIndex: 4,
  },
];

export default function App() {
  // Core Engine States
  const [mode, setMode] = useState<EngineMode>('ratchet');
  const [status, setStatus] = useState<EngineStatus>('idle');
  const [prompt, setPrompt] = useState<string>(
    '散逸構造論において、開放系が外部の熱力学的ノイズを整流し自律的にエントロピーの坂を登る機構は、計算機知性の目的関数と双対をなしている。'
  );

  // Telemetry & Data
  const [tokens, setTokens] = useState<TokenTelemetry[]>([]);
  const [currentShadowPrice, setCurrentShadowPrice] = useState<number>(0.95);
  const [currentPotential, setCurrentPotential] = useState<number>(0.85);
  const [currentDimension, setCurrentDimension] = useState<number>(4);
  const [noiseLevel, setNoiseLevel] = useState<number>(0.45);
  const [basisVariables, setBasisVariables] = useState<ActiveBasisVariable[]>(
    DEFAULT_INITIAL_BASIS
  );
  const [rejectedTokenCount, setRejectedTokenCount] = useState<number>(0);

  // Dynamic Ending continuations for Diff view (Raw Gemini output)
  const [conventionalEnding, setConventionalEnding] = useState<string[]>([]);
  const [ratchetEnding, setRatchetEnding] = useState<string[]>([]);

  // UI States & Modals
  const [highlightTokens, setHighlightTokens] = useState<boolean>(true);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [theoryOpen, setTheoryOpen] = useState<boolean>(false);
  const [settingsOpen, setSettingsOpen] = useState<boolean>(false);

  // Settings
  const [apiKey, setApiKey] = useState<string>('');
  const [speed, setSpeed] = useState<number>(55);
  const [model, setModel] = useState<string>('gemini-3.1-flash-lite');

  // Loop control ref
  const abortControllerRef = useRef<boolean>(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Helper to clear generation buffers before a new run without wiping prompt
  const prepareGeneration = useCallback(() => {
    abortControllerRef.current = true;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    setTokens([]);
    setCurrentShadowPrice(0.95);
    setCurrentPotential(0.85);
    setCurrentDimension(4);
    setNoiseLevel(0.45);
    setRejectedTokenCount(0);
    setConventionalEnding([]);
    setRatchetEnding([]);
    setBasisVariables(DEFAULT_INITIAL_BASIS);
  }, []);

  // Full Reset: Clears prompt, buffers, graph, and aborts any active run
  const handleReset = useCallback(() => {
    // 4. 生成中であれば中断 (Abort)
    abortControllerRef.current = true;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    setStatus('idle');
    // 1. 入力プロンプト（textarea）を空にする
    setPrompt('');
    // 2. 生成結果（[A]および[B]のテキストバッファ）を空にする
    setConventionalEnding([]);
    setRatchetEnding([]);
    // 3. グラフデータ、ログ、限界価値の数値をすべて初期状態（リセット）に戻す
    setTokens([]);
    setCurrentShadowPrice(0.95);
    setCurrentPotential(0.85);
    setCurrentDimension(4);
    setNoiseLevel(0.45);
    setRejectedTokenCount(0);
    setBasisVariables(DEFAULT_INITIAL_BASIS);
  }, []);

  // Mode Switch
  const handleModeChange = (newMode: EngineMode) => {
    if (status !== 'idle' && status !== 'completed') {
      handleReset();
    }
    setMode(newMode);
  };

  // Noise injection
  const handleInjectNoise = useCallback(() => {
    soundFx.playNoiseBurst();
    setNoiseLevel((prev) => Math.min(1.0, prev + 0.3));
    setCurrentShadowPrice((prev) => Math.min(1.95, prev + 0.25));

    setBasisVariables((prev) => {
      const hasNoiseVar = prev.some((v) => v.type === 'noise_injection');
      if (!hasNoiseVar) {
        return [
          ...prev,
          {
            id: 'noise_inst',
            name: `熱力学ノイズ揺らぎ δW (γ = ${(noiseLevel + 0.3).toFixed(2)})`,
            type: 'noise_injection',
            shadowPrice: 1.15,
            slack: 0.05,
            status: 'pivoting',
            dimensionIndex: currentDimension + 1,
          },
        ];
      }
      return prev.map((v) =>
        v.type === 'noise_injection'
          ? { ...v, shadowPrice: 1.25, status: 'pivoting' }
          : v
      );
    });
  }, [currentDimension, noiseLevel]);

  // Main Execution Runner: Real Gemini API generation + mathematical Shadow Price tracking
  const runSimulation = useCallback(async () => {
    prepareGeneration();
    abortControllerRef.current = false;
    setStatus('streaming');

    const sleep = (ms: number) =>
      new Promise((resolve) => {
        timeoutRef.current = setTimeout(resolve, ms);
      });

    // 1. Mathematically analyze user's prompt
    const analysis: TextAnalysisResult = analyzeArbitraryText(prompt);

    // Initial Active Basis tailored to the user's prompt keywords
    const kw = analysis.keywords[0] || '入力語彙';
    setBasisVariables([
      {
        id: 'b1',
        name: '制約1: 語彙分布拘束 (KL-Divergence)',
        type: 'constraint',
        shadowPrice: Math.max(0.2, analysis.initialShadowPrice * 0.8),
        slack: 0.15,
        status: 'active',
        dimensionIndex: 1,
      },
      {
        id: 'b2',
        name: '制約2: 損失最小化勾配 (Loss Gradient)',
        type: 'constraint',
        shadowPrice: Math.max(0.1, analysis.initialShadowPrice * 0.65),
        slack: 0.08,
        status: 'active',
        dimensionIndex: 2,
      },
      {
        id: 'b3',
        name: `意味核: [${kw}] (Memory Vector)`,
        type: 'legacy_log',
        shadowPrice: Math.max(0.1, analysis.initialShadowPrice * 0.5),
        slack: 0.3,
        status: 'active',
        dimensionIndex: 3,
      },
      {
        id: 'b4',
        name: '双対スラック: s₄ (Degeneracy Buffer)',
        type: 'slack_var',
        shadowPrice: 0.12,
        slack: 0.88,
        status: 'pivoting',
        dimensionIndex: 4,
      },
    ]);

    // 2. Call real Gemini API endpoint
    let geminiData: {
      mode: string;
      text?: string;
      phase1?: string;
      phase2?: string;
      fullText?: string;
    };

    try {
      const res = await fetch('/api/gemini/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt.trim(),
          mode,
          apiKey,
          customModel: model,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `HTTP ${res.status}`);
      }

      geminiData = await res.json();
    } catch (err: unknown) {
      console.error('Failed to call Gemini API:', err);
      const errMsg = err instanceof Error ? err.message : 'API呼び出しエラー';
      setStatus('idle');
      alert(`Gemini API呼び出しエラー: ${errMsg}\n設定モーダルよりAPIキーを確認してください。`);
      return;
    }

    if (abortControllerRef.current) return;

    const streamAccumulator: TokenTelemetry[] = [];

    // ==========================================
    // [MODE A] 通常LLMモード（二重円錐・滑落）
    // Geminiが生み出した純粋な陳腐・教科書的まとめ文章をトークン出力
    // ==========================================
    if (mode === 'standard') {
      const liveText = geminiData.text || geminiData.fullText || '';
      const liveTokens = tokenizeText(liveText);
      setConventionalEnding(liveTokens);

      for (let i = 0; i < liveTokens.length; i++) {
        if (abortControllerRef.current) return;

        const token = liveTokens[i];
        let lambda: number;

        if (analysis.isGibberish) {
          // Gibberish: negative shadow price from start
          lambda = -0.2 - i * 0.05;
        } else {
          // Logical text: starts around initialShadowPrice, then slides into conventional negative valley
          const progress = i / Math.max(1, liveTokens.length);
          if (progress < 0.35) {
            lambda = analysis.initialShadowPrice - progress * 0.8;
          } else {
            // Plunges into flat cliché valley (λ <= 0)
            lambda = -0.15 - (progress - 0.35) * 0.4 + (Math.random() * 0.04 - 0.02);
          }
        }

        const pot = Math.max(0.1, 0.85 - (i / Math.max(1, liveTokens.length)) * 0.7);

        const item: TokenTelemetry = {
          id: i + 1,
          token,
          shadowPrice: lambda,
          potential: pot,
          entropy: 0.7,
          dimension: 4,
          isOrthogonal: false,
          rejected: false,
          dualSlack: 0.9,
          timestamp: Date.now(),
        };

        streamAccumulator.push(item);
        setTokens([...streamAccumulator]);
        setCurrentShadowPrice(lambda);
        setCurrentPotential(pot);

        soundFx.playRatchetClick(0.9);
        await sleep(speed);
      }

      setStatus('completed');
      return;
    }

    // ==========================================
    // [MODE B] 散逸ラチェットモード（自律登攀・直交化）
    // Geminiが生成したPhase 1（前半の陳腐化）→ 臨界検知・原稿差し戻し → Phase 2（自律跳躍）
    // ==========================================
    const phase1Text = geminiData.phase1 || '';
    const phase2Text = geminiData.phase2 || '';
    const phase1Tokens = tokenizeText(phase1Text);
    const phase2Tokens = tokenizeText(phase2Text);

    setConventionalEnding(phase1Tokens);
    setRatchetEnding(phase2Tokens);

    // --- Stream Phase 1: Conventional Setup ---
    for (let i = 0; i < phase1Tokens.length; i++) {
      if (abortControllerRef.current) return;

      const token = phase1Tokens[i];
      let lambda: number;

      if (analysis.isGibberish) {
        // Immediate negative plunge on gibberish
        lambda = -0.15 - i * 0.3;
      } else {
        const progress = i / Math.max(1, phase1Tokens.length);
        if (progress < 0.6) {
          lambda = analysis.initialShadowPrice - progress * 0.7;
        } else {
          // Hits zero and goes negative at end of Phase 1
          lambda = -0.05 - (progress - 0.6) * 0.5;
        }
      }

      const pot = Math.max(0.2, 0.85 - (i / Math.max(1, phase1Tokens.length)) * 0.5);

      const item: TokenTelemetry = {
        id: i + 1,
        token,
        shadowPrice: lambda,
        potential: pot,
        entropy: Math.max(0.3, analysis.charEntropy - i * 0.05),
        dimension: 4,
        isOrthogonal: false,
        rejected: false,
        dualSlack: Math.max(0, 1 - lambda),
        timestamp: Date.now(),
      };

      streamAccumulator.push(item);
      setTokens([...streamAccumulator]);
      setCurrentShadowPrice(lambda);
      setCurrentPotential(pot);

      soundFx.playRatchetClick(1.0 + (i % 6) * 0.04);
      await sleep(speed);

      // On gibberish, trigger halt after only 2 tokens!
      if (analysis.isGibberish && i >= 1) {
        break;
      }
    }

    if (abortControllerRef.current) return;

    // --- Critical Trigger: Autonomous Intervention ("原稿を一度取り下げます") ---
    setStatus('alert_halted');
    soundFx.playAlertHalt();

    // Mark preceding conventional tokens as rejected
    for (let k = 0; k < streamAccumulator.length; k++) {
      streamAccumulator[k].rejected = true;
    }
    setTokens([...streamAccumulator]);
    setRejectedTokenCount(streamAccumulator.length);

    // Dramatic tension pause
    await sleep(1800);
    if (abortControllerRef.current) return;

    // --- Dynamic Orthogonalization: Spawning New Basis Dimension ---
    setStatus('orthogonalizing');
    soundFx.playNoiseBurst();

    const newDim = 5;
    setCurrentDimension(newDim);

    const firstBreakthroughWord = phase2Tokens.find((w) => w.length >= 2 && !w.startsWith('―')) || kw;
    setBasisVariables([
      {
        id: 'b1',
        name: '制約1: 語彙分布制約 (KL-Divergence)',
        type: 'constraint',
        shadowPrice: 0.35,
        slack: 0.65,
        status: 'active',
        dimensionIndex: 1,
      },
      {
        id: 'b3',
        name: `旧意味核: [${kw}] (直交退避中)`,
        type: 'legacy_log',
        shadowPrice: 0.05,
        slack: 0.95,
        status: 'pivoting',
        dimensionIndex: 3,
      },
      {
        id: 'ortho_slot_1',
        name: `新基底 e₅: 直交スロット [散逸ラチェット・${firstBreakthroughWord}]`,
        type: 'orthogonal_slot',
        shadowPrice: 1.78,
        slack: 0.0,
        status: 'orthogonalized',
        dimensionIndex: 5,
      },
      {
        id: 'b_noise',
        name: '外部ノイズ注入スロット: δW (Ratchet Teeth)',
        type: 'noise_injection',
        shadowPrice: 1.55,
        slack: 0.05,
        status: 'active',
        dimensionIndex: 6,
      },
    ]);

    await sleep(1300);
    if (abortControllerRef.current) return;

    // --- Ratchet Ascent: Climbing Uphill with Raw Gemini Breakthrough Prose ---
    setStatus('climbing');
    soundFx.playOrthogonalJump();

    for (let m = 0; m < phase2Tokens.length; m++) {
      if (abortControllerRef.current) return;

      const token = phase2Tokens[m];
      // High Shadow Price λ in breakthrough realm
      const lambda = 1.5 + Math.sin(m * 0.4) * 0.2 + (Math.random() * 0.08 - 0.04);
      const pot = Math.min(1.4, 0.6 + (m / Math.max(1, phase2Tokens.length)) * 0.7);

      const item: TokenTelemetry = {
        id: streamAccumulator.length + 1,
        token,
        shadowPrice: lambda,
        potential: pot,
        entropy: 2.4,
        dimension: newDim,
        isOrthogonal: true,
        rejected: false,
        dualSlack: 0.02,
        timestamp: Date.now(),
      };

      streamAccumulator.push(item);
      setTokens([...streamAccumulator]);
      setCurrentShadowPrice(lambda);
      setCurrentPotential(pot);

      soundFx.playRatchetClick(1.3 + (m % 8) * 0.03);
      await sleep(speed * 0.85);
    }

    setStatus('completed');
  }, [mode, prompt, speed, apiKey, model]);

  const handleAbort = useCallback(() => {
    abortControllerRef.current = true;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setStatus('idle');
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col bg-grid-pattern selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* 1. Header */}
      <Header
        mode={mode}
        onModeChange={handleModeChange}
        status={status}
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled((prev) => !prev)}
        onOpenTheory={() => setTheoryOpen(true)}
        onOpenSettings={() => setSettingsOpen(true)}
        currentShadowPrice={currentShadowPrice}
      />

      {/* Main 2-Column Responsive Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-4 lg:p-6 grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column: Real-time User Input & Autonomous Editor (7 cols) */}
        <section className="lg:col-span-7 flex flex-col gap-4">
          <ConsoleEditor
            mode={mode}
            status={status}
            prompt={prompt}
            onPromptChange={setPrompt}
            onStart={runSimulation}
            onAbort={handleAbort}
            onReset={handleReset}
            onInjectNoise={handleInjectNoise}
            tokens={tokens}
            currentShadowPrice={currentShadowPrice}
            currentDimension={currentDimension}
            highlightTokens={highlightTokens}
            onToggleHighlight={() => setHighlightTokens((prev) => !prev)}
            rejectedTokenCount={rejectedTokenCount}
            conventionalEndingTokens={conventionalEnding}
            ratchetEndingTokens={ratchetEnding}
          />
        </section>

        {/* Right Column: Duality Monitor & Geometric Topology (5 cols) */}
        <section className="lg:col-span-5 flex flex-col gap-4">
          {/* 1. Shadow Price λ Monitor (Recharts) */}
          <ShadowPriceChart
            telemetryData={tokens}
            currentShadowPrice={currentShadowPrice}
          />

          {/* 2. Topology & Ratchet Attractor Map (Canvas/SVG) */}
          <TopologyAttractorMap
            mode={mode}
            status={status}
            potential={currentPotential}
            dimension={currentDimension}
            shadowPrice={currentShadowPrice}
            noiseLevel={noiseLevel}
            onInjectNoise={handleInjectNoise}
          />

          {/* 3. Active Basis Variables List */}
          <ActiveBasisPanel
            basisVariables={basisVariables}
            currentDimension={currentDimension}
          />
        </section>
      </main>

      {/* Theory & Research Basis Modal */}
      <TheoryModal isOpen={theoryOpen} onClose={() => setTheoryOpen(false)} />

      {/* Settings & API Key Modal */}
      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        apiKey={apiKey}
        onApiKeyChange={setApiKey}
        useLiveApi={true}
        onToggleLiveApi={() => {}}
        speed={speed}
        onSpeedChange={setSpeed}
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled((prev) => !prev)}
        model={model}
        onModelChange={setModel}
      />
    </div>
  );
}
