import React from 'react';
import { EngineMode, EngineStatus } from '../types/engine';
import {
  Compass,
  SlidersHorizontal,
  BookOpen,
  Volume2,
  VolumeX,
  Zap,
  Activity,
  ArrowDownRight,
  TrendingUp,
  Cpu
} from 'lucide-react';
import { soundFx } from '../lib/soundFx';

interface HeaderProps {
  mode: EngineMode;
  onModeChange: (mode: EngineMode) => void;
  status: EngineStatus;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onOpenTheory: () => void;
  onOpenSettings: () => void;
  currentShadowPrice: number;
}

export const Header: React.FC<HeaderProps> = ({
  mode,
  onModeChange,
  status,
  soundEnabled,
  onToggleSound,
  onOpenTheory,
  onOpenSettings,
  currentShadowPrice,
}) => {
  return (
    <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40 px-4 lg:px-6 py-3">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        {/* Brand & Subtitle */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-950/60 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
            <Cpu className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold tracking-wider text-slate-100 uppercase font-mono">
                Simplex-Ratchet Engine
              </h1>
              <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-emerald-400 border border-slate-700">
                v2.6
              </span>
            </div>
            <p className="text-xs text-slate-400 font-sans mt-0.5">
              ポテンシャル滑落から、ノイズ駆動による自律登攀へ
            </p>
          </div>
        </div>

        {/* Center / Mode Switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-lg w-full md:w-auto">
          <button
            onClick={() => onModeChange('standard')}
            className={`flex-1 md:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-mono rounded-md transition-all ${
              mode === 'standard'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
            title="予定調和・平均値への収束（二重円錐の谷底へ滑落）"
          >
            <ArrowDownRight className="w-3.5 h-3.5 text-amber-400" />
            <span>[A] 通常LLM (滑落)</span>
          </button>

          <button
            onClick={() => onModeChange('ratchet')}
            className={`flex-1 md:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-mono rounded-md transition-all ${
              mode === 'ratchet'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.25)]'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
            title="散逸ラチェット・限界価値検知による原稿取り下げ＆直交化跳躍"
          >
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            <span>[B] 散逸ラチェット (登攀)</span>
          </button>
        </div>

        {/* Right Action Bar */}
        <div className="flex items-center gap-2 self-end md:self-auto">
          {/* Status Indicator */}
          <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-xs font-mono">
            <span
              className={`w-2 h-2 rounded-full ${
                status === 'alert_halted'
                  ? 'bg-red-500 animate-ping'
                  : status === 'orthogonalizing'
                  ? 'bg-amber-400 animate-bounce'
                  : status === 'climbing'
                  ? 'bg-cyan-400 animate-pulse'
                  : status === 'streaming'
                  ? 'bg-emerald-400 animate-pulse'
                  : 'bg-slate-600'
              }`}
            />
            <span className="text-slate-400 text-[11px]">
              {status === 'idle' && 'STANDBY'}
              {status === 'streaming' && 'GENERATING'}
              {status === 'alert_halted' && 'HALTED (λ <= 0)'}
              {status === 'orthogonalizing' && 'ORTHOGONALIZING'}
              {status === 'climbing' && 'RATCHET ASCENT'}
              {status === 'completed' && 'OPTIMAL'}
            </span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-400 text-[11px]">λ:</span>
            <span
              className={`text-xs font-bold ${
                currentShadowPrice < 0
                  ? 'text-red-400'
                  : currentShadowPrice < 0.3
                  ? 'text-amber-400'
                  : 'text-emerald-400'
              }`}
            >
              {currentShadowPrice.toFixed(2)}
            </span>
          </div>

          {/* Sound Toggle */}
          <button
            onClick={() => {
              onToggleSound();
              soundFx.enabled = !soundEnabled;
            }}
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700 transition-colors"
            title={soundEnabled ? '音声をミュート' : '音声を有効化'}
          >
            {soundEnabled ? (
              <Volume2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <VolumeX className="w-4 h-4 text-slate-500" />
            )}
          </button>

          {/* Theory Modal Trigger */}
          <button
            onClick={onOpenTheory}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300 hover:text-white hover:border-slate-700 transition-colors"
          >
            <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">数理理論</span>
          </button>

          {/* Settings Trigger */}
          <button
            onClick={onOpenSettings}
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700 transition-colors"
            title="エンジン設定 & APIキー"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
