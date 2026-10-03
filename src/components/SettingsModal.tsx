import React, { useState } from 'react';
import { X, SlidersHorizontal, Key, Gauge, Volume2, ShieldCheck, Cpu } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiKey: string;
  onApiKeyChange: (key: string) => void;
  useLiveApi: boolean;
  onToggleLiveApi: (useLive: boolean) => void;
  speed: number;
  onSpeedChange: (speed: number) => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  model: string;
  onModelChange: (model: string) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  apiKey,
  onApiKeyChange,
  useLiveApi,
  onToggleLiveApi,
  speed,
  onSpeedChange,
  soundEnabled,
  onToggleSound,
  model,
  onModelChange,
}) => {
  const [tempKey, setTempKey] = useState(apiKey);

  if (!isOpen) return null;

  const handleSave = () => {
    onApiKeyChange(tempKey);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-950 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <SlidersHorizontal className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white font-mono">
                エンジン設定 & API構成
              </h2>
              <p className="text-xs text-slate-400">
                モックシミュレーションとGemini API実行の切り替え
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-5 text-xs sm:text-sm text-slate-300 font-sans">
          {/* Execution Backend Selector */}
          <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-3.5 space-y-2">
            <label className="block text-xs font-mono font-bold text-slate-200">
              実行バックエンド
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => onToggleLiveApi(false)}
                className={`p-2.5 rounded-lg border text-left transition-all ${
                  !useLiveApi
                    ? 'bg-emerald-950/40 border-emerald-500/60 text-emerald-300 shadow-sm'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="font-bold font-mono text-xs flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>内蔵モックエンジン</span>
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  APIキー不要。指定の思考実験シナリオを完全再現。
                </div>
              </button>

              <button
                type="button"
                onClick={() => onToggleLiveApi(true)}
                className={`p-2.5 rounded-lg border text-left transition-all ${
                  useLiveApi
                    ? 'bg-cyan-950/40 border-cyan-500/60 text-cyan-300 shadow-sm'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="font-bold font-mono text-xs flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Gemini API (リアル実行)</span>
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Google GenAI SDKによるリアルタイムストリーミング。
                </div>
              </button>
            </div>
          </div>

          {/* Gemini API Key input if live API */}
          {useLiveApi && (
            <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-mono font-bold text-slate-200 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Gemini API Key</span>
                </label>
                <span className="text-[10px] text-slate-500">クライアント内保持</span>
              </div>
              <input
                type="password"
                value={tempKey}
                onChange={(e) => setTempKey(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs font-mono text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
              />
              <div className="pt-2">
                <label className="text-[11px] font-mono text-slate-400 block mb-1">使用モデル</label>
                <select
                  value={model}
                  onChange={(e) => onModelChange(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
                >
                  <option value="gemini-3.1-flash-lite">gemini-3.1-flash-lite (最速・安定推奨)</option>
                  <option value="gemini-flash-latest">gemini-flash-latest (最新Flash)</option>
                  <option value="gemini-3.8-flash">gemini-3.8-flash (次世代Flash)</option>
                  <option value="gemini-3.1-pro-preview">gemini-3.1-pro-preview (高精度推論)</option>
                </select>
              </div>
            </div>
          )}

          {/* Simulation Speed */}
          <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-mono font-bold text-slate-200 flex items-center gap-1.5">
                <Gauge className="w-3.5 h-3.5 text-amber-400" />
                <span>シミュレーション描画速度</span>
              </label>
              <span className="text-xs font-mono text-amber-400">
                {speed === 120 ? 'じっくり観察 (120ms)' : speed === 60 ? '標準 (60ms)' : '超高速 (25ms)'}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: '観察速度 (遅)', val: 120 },
                { label: '標準 (中)', val: 60 },
                { label: '高速 (速)', val: 25 },
              ].map((s) => (
                <button
                  key={s.val}
                  type="button"
                  onClick={() => onSpeedChange(s.val)}
                  className={`py-1.5 px-2 rounded-lg border text-xs font-mono transition-colors ${
                    speed === s.val
                      ? 'bg-amber-950/60 border-amber-500/60 text-amber-300'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Sound FX Toggle */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/50 border border-slate-800">
            <div className="flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-emerald-400" />
              <div>
                <div className="text-xs font-medium text-slate-200 font-mono">
                  ラチェット機構音 & 警報サウンド
                </div>
                <div className="text-[11px] text-slate-500">
                  Web Audio APIによる機械的ラチェットクリックと警報音
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={onToggleSound}
              className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                soundEnabled ? 'bg-emerald-500' : 'bg-slate-700'
              }`}
            >
              <span
                className={`block w-4 h-4 rounded-full bg-white transition-transform transform ${
                  soundEnabled ? 'translate-x-6' : 'translate-x-1'
                } top-1 absolute`}
              />
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-xs transition-colors"
          >
            キャンセル
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono font-bold text-xs transition-colors"
          >
            設定を保存
          </button>
        </div>
      </div>
    </div>
  );
};
