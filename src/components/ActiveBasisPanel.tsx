import React from 'react';
import { ActiveBasisVariable } from '../types/engine';
import { Layers, CheckCircle2, RefreshCw, AlertCircle, ArrowUpRight, Cpu } from 'lucide-react';

interface ActiveBasisPanelProps {
  basisVariables: ActiveBasisVariable[];
  currentDimension: number;
}

export const ActiveBasisPanel: React.FC<ActiveBasisPanelProps> = ({
  basisVariables,
  currentDimension,
}) => {
  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-3">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-purple-400" />
          <h2 className="text-xs font-mono font-bold tracking-wider text-slate-200 uppercase">
            アクティブ基底変数 (Active Basis: x_B = B⁻¹b)
          </h2>
        </div>
        <div className="text-[11px] font-mono text-purple-400 bg-purple-950/60 border border-purple-800/60 px-2 py-0.5 rounded">
          Dim: ℝ^{currentDimension}
        </div>
      </div>

      {/* Subtitle / Theorem Info */}
      <div className="text-[11px] text-slate-400 font-sans mb-3 flex items-center justify-between">
        <span>シンプレックス基底行列 B と双対解ベクトル y = c_B^T B⁻¹</span>
        <span className="font-mono text-slate-500 text-[10px]">Rank: {basisVariables.length}</span>
      </div>

      {/* Basis List */}
      <div className="space-y-2">
        {basisVariables.map((v) => {
          const isHighValue = v.shadowPrice >= 0.7;
          const isOrthogonal = v.type === 'orthogonal_slot';
          const isNoise = v.type === 'noise_injection';

          return (
            <div
              key={v.id}
              className={`p-2.5 rounded-lg border transition-all ${
                isOrthogonal
                  ? 'bg-cyan-950/40 border-cyan-500/50 shadow-[0_0_10px_rgba(6,182,212,0.15)]'
                  : isNoise
                  ? 'bg-amber-950/40 border-amber-500/50'
                  : 'bg-slate-950/60 border-slate-800/80'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[11px] text-slate-500">
                    e_{v.dimensionIndex}
                  </span>
                  <span className="text-xs font-medium text-slate-200">
                    {v.name}
                  </span>
                </div>

                {/* Status Badge */}
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.5 rounded flex items-center gap-1 ${
                    v.status === 'orthogonalized'
                      ? 'bg-cyan-900/60 text-cyan-300 border border-cyan-700'
                      : v.status === 'pivoting'
                      ? 'bg-amber-900/60 text-amber-300 border border-amber-700 animate-pulse'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {v.status === 'orthogonalized' && <ArrowUpRight className="w-2.5 h-2.5" />}
                  {v.status === 'pivoting' && <RefreshCw className="w-2.5 h-2.5 animate-spin" />}
                  {v.status === 'active' && <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />}
                  <span>
                    {v.status === 'orthogonalized'
                      ? '直交スロット展開'
                      : v.status === 'pivoting'
                      ? '基底置換 (Pivot)'
                      : '基底拘束中'}
                  </span>
                </span>
              </div>

              {/* Numerical detail indicators */}
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800/60 text-[10px] font-mono text-slate-400">
                <div className="flex items-center gap-1">
                  <span>限界価値 λ:</span>
                  <span
                    className={`font-bold ${
                      isHighValue
                        ? 'text-emerald-400'
                        : v.shadowPrice < 0
                        ? 'text-red-400'
                        : 'text-amber-400'
                    }`}
                  >
                    {v.shadowPrice.toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <span>双対スラック s:</span>
                  <span className="text-slate-300">{v.slack.toFixed(2)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-slate-500">タイプ:</span>
                  <span className="text-slate-400">{v.type}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
