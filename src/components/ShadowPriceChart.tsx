import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  CartesianGrid
} from 'recharts';
import { TokenTelemetry } from '../types/engine';
import { Activity, AlertTriangle, Sparkles, TrendingUp } from 'lucide-react';

interface ShadowPriceChartProps {
  telemetryData: TokenTelemetry[];
  currentShadowPrice: number;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: TokenTelemetry;
    value: number;
  }>;
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const isBelowZero = data.shadowPrice <= 0;
    return (
      <div className="bg-slate-900/95 border border-slate-700 p-2.5 rounded-lg shadow-xl text-xs font-mono backdrop-blur-sm">
        <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-1 mb-1.5">
          <span className="text-slate-400">Step #{data.id}</span>
          <span className={`font-bold px-1.5 py-0.5 rounded text-[10px] ${
            isBelowZero ? 'bg-red-950 text-red-400 border border-red-800' : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
          }`}>
            {data.isOrthogonal ? 'ORTHOGONAL' : isBelowZero ? 'DEPLETED' : 'CONVERGENT'}
          </span>
        </div>
        <div className="space-y-1">
          <div className="text-slate-200">
            <span className="text-slate-400">トークン: </span>
            <span className="font-semibold text-white">「{data.token}」</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">限界価値 λ: </span>
            <span className={`font-bold ${isBelowZero ? 'text-red-400' : 'text-emerald-400'}`}>
              {data.shadowPrice.toFixed(3)}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">ポテンシャル V: </span>
            <span className="text-cyan-400">{data.potential.toFixed(3)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">基底次元 D: </span>
            <span className="text-purple-400">{data.dimension}D</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export const ShadowPriceChart: React.FC<ShadowPriceChartProps> = ({
  telemetryData,
  currentShadowPrice,
}) => {
  // Format data for chart
  const chartData = telemetryData.map((item) => ({
    ...item,
    positiveValue: item.shadowPrice > 0 ? item.shadowPrice : 0,
    negativeValue: item.shadowPrice <= 0 ? item.shadowPrice : 0,
  }));

  const isAlertZone = currentShadowPrice <= 0;
  const isRatchetJump = currentShadowPrice > 1.2;

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-3">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-emerald-400" />
          <h2 className="text-xs font-mono font-bold tracking-wider text-slate-200 uppercase">
            双対問題・限界価値 (Shadow Price: λ) モニター
          </h2>
        </div>

        {/* Current status indicator badge */}
        <div className="flex items-center gap-2 text-xs font-mono">
          {isAlertZone ? (
            <div className="flex items-center gap-1 text-red-400 bg-red-950/60 border border-red-800/80 px-2 py-0.5 rounded animate-pulse">
              <AlertTriangle className="w-3 h-3" />
              <span>枯渇領域 (λ ≤ 0)</span>
            </div>
          ) : isRatchetJump ? (
            <div className="flex items-center gap-1 text-cyan-300 bg-cyan-950/60 border border-cyan-800/80 px-2 py-0.5 rounded shadow-[0_0_8px_rgba(6,182,212,0.3)]">
              <Sparkles className="w-3 h-3 text-cyan-400 animate-spin" />
              <span>散逸登攀 (跳躍中)</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-slate-400">
              <TrendingUp className="w-3 h-3 text-slate-500" />
              <span>通常双対勾配</span>
            </div>
          )}
        </div>
      </div>

      {/* Description caption */}
      <div className="text-[11px] text-slate-400 font-sans mb-3 flex items-center justify-between">
        <span>∂z*/∂bᵢ : 制約緩和がもたらす目的関数フロンティアへの限界寄与度</span>
        <span className="font-mono text-slate-500 text-[10px]">Dual Simplex Theorem</span>
      </div>

      {/* Recharts Area */}
      <div className="h-52 w-full">
        {telemetryData.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 font-mono text-xs border border-dashed border-slate-800/60 rounded-lg">
            <Activity className="w-6 h-6 mb-2 text-slate-600 animate-pulse" />
            <span>生成実行時にリアルタイムプロットが開始されます</span>
            <span className="text-[10px] text-slate-600 mt-1">Ready to track λ across token timeline</span>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="positiveGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="negativeGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.0} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0.5} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.6} />
              <XAxis
                dataKey="id"
                stroke="#64748b"
                tick={{ fontSize: 10, fontFamily: 'monospace' }}
                tickFormatter={(val) => `#${val}`}
              />
              <YAxis
                domain={[-0.5, 2.0]}
                stroke="#64748b"
                tick={{ fontSize: 10, fontFamily: 'monospace' }}
                ticks={[-0.5, 0, 0.5, 1.0, 1.5, 2.0]}
              />
              <Tooltip content={<CustomTooltip />} />
              {/* Zero threshold line */}
              <ReferenceLine
                y={0}
                stroke="#ef4444"
                strokeDasharray="4 4"
                strokeWidth={1.5}
                label={{
                  value: 'λ = 0.0 (陳腐化閾値)',
                  position: 'insideBottomRight',
                  fill: '#ef4444',
                  fontSize: 10,
                  fontFamily: 'monospace',
                }}
              />
              {/* Reference line for breakthrough frontier */}
              <ReferenceLine
                y={1.0}
                stroke="#06b6d4"
                strokeDasharray="2 2"
                opacity={0.5}
                label={{
                  value: 'λ = 1.0 (跳躍領域)',
                  position: 'insideTopLeft',
                  fill: '#06b6d4',
                  fontSize: 9,
                  fontFamily: 'monospace',
                }}
              />
              <Area
                type="monotone"
                dataKey="shadowPrice"
                stroke={isAlertZone ? '#ef4444' : isRatchetJump ? '#06b6d4' : '#10b981'}
                strokeWidth={2}
                fill="url(#positiveGradient)"
                activeDot={{
                  r: 5,
                  stroke: isAlertZone ? '#ef4444' : '#10b981',
                  strokeWidth: 2,
                  fill: '#0f172a',
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Footer Metrics */}
      <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-800/80 mt-3 text-center font-mono">
        <div className="bg-slate-950/60 p-1.5 rounded border border-slate-800/60">
          <div className="text-[10px] text-slate-500">最新 λ (Shadow Price)</div>
          <div className={`text-xs font-bold ${currentShadowPrice <= 0 ? 'text-red-400' : 'text-emerald-400'}`}>
            {currentShadowPrice.toFixed(3)}
          </div>
        </div>
        <div className="bg-slate-950/60 p-1.5 rounded border border-slate-800/60">
          <div className="text-[10px] text-slate-500">陳腐化回避率</div>
          <div className="text-xs font-bold text-cyan-400">
            {telemetryData.length > 0
              ? `${Math.round(
                  (telemetryData.filter((d) => d.shadowPrice > 0).length /
                    telemetryData.length) *
                    100
                )}%`
              : '100%'}
          </div>
        </div>
        <div className="bg-slate-950/60 p-1.5 rounded border border-slate-800/60">
          <div className="text-[10px] text-slate-500">双対性ギャップ Δ</div>
          <div className="text-xs font-bold text-slate-300">
            {telemetryData.length > 0
              ? Math.abs(currentShadowPrice * 0.12).toFixed(4)
              : '0.0000'}
          </div>
        </div>
      </div>
    </div>
  );
};
