import React, { useRef, useEffect } from 'react';
import { EngineMode, EngineStatus } from '../types/engine';
import { Compass, Flame, Layers, Network, RefreshCw } from 'lucide-react';

interface TopologyAttractorMapProps {
  mode: EngineMode;
  status: EngineStatus;
  potential: number;
  dimension: number;
  shadowPrice: number;
  noiseLevel: number;
  onInjectNoise: () => void;
}

export const TopologyAttractorMap: React.FC<TopologyAttractorMapProps> = ({
  mode,
  status,
  potential,
  dimension,
  shadowPrice,
  noiseLevel,
  onInjectNoise,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Kinetic state for particle and wave animation
  const animState = useRef({
    x: 60,
    y: 90,
    targetX: 60,
    targetY: 90,
    phase: 0,
    particles: [] as Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      life: number;
      color: string;
    }>,
  });

  useEffect(() => {
    let animId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas dimensions
    const width = (canvas.width = canvas.parentElement?.clientWidth || 360);
    const height = (canvas.height = 180);

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Phase progression
      animState.current.phase += 0.03;
      const phase = animState.current.phase;

      // Draw cyber topology grid background
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 0.5;
      for (let x = 0; x < width; x += 24) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += 24) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Draw V-track (Double Cone divergent rails)
      const railStartX = 40;
      const railStartY = height - 30;
      const railTopEndX = width - 40;
      const railTopEndY1 = 35;
      const railTopEndY2 = 75;

      ctx.save();
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);

      // Divergent rail 1 (Upper)
      ctx.beginPath();
      ctx.moveTo(railStartX, railStartY);
      ctx.lineTo(railTopEndX, railTopEndY1);
      ctx.stroke();

      // Divergent rail 2 (Lower)
      ctx.beginPath();
      ctx.moveTo(railStartX, railStartY);
      ctx.lineTo(railTopEndX, railTopEndY2);
      ctx.stroke();
      ctx.restore();

      // Draw Potential Landscape Profile (Energy Surface)
      ctx.save();
      const numSteps = 50;
      ctx.beginPath();

      for (let i = 0; i <= numSteps; i++) {
        const t = i / numSteps;
        const px = railStartX + (railTopEndX - railStartX) * t;

        let py: number;
        if (mode === 'standard') {
          // Double Cone: Gravitational potential descends into center valley
          // V(x) has a deep attractor basin in the middle/low region
          const valley = Math.sin(t * Math.PI) * 45;
          py = railStartY - (railStartY - 60) * t + valley;
        } else {
          // Dissipative Ratchet: Asymmetric sawtooth ratchet potential
          // High barrier forward, but rectified by non-equilibrium noise
          const sawtooth = ((t * 6) % 1) * 16;
          // Upward ascent profile
          py = railStartY - (railStartY - 40) * Math.pow(t, 0.8) + sawtooth;
        }

        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }

      ctx.strokeStyle = mode === 'standard' ? '#f59e0b' : '#10b981';
      ctx.lineWidth = 2.5;
      ctx.shadowColor = mode === 'standard' ? 'rgba(245, 158, 11, 0.4)' : 'rgba(16, 185, 129, 0.5)';
      ctx.shadowBlur = 8;
      ctx.stroke();
      ctx.restore();

      // Determine marble position based on status and shadowPrice
      let normalizedProgress = 0.2;
      if (mode === 'standard') {
        // In standard mode, marble rolls down into the valley (0.4 to 0.7) and stays stuck
        normalizedProgress = status === 'completed' ? 0.65 : Math.min(0.65, 0.2 + (1 - potential) * 0.4);
      } else {
        // In ratchet mode: climbs to higher dimensions
        if (status === 'alert_halted') {
          normalizedProgress = 0.45; // halted right at the tooth cliff
        } else if (status === 'orthogonalizing') {
          normalizedProgress = 0.5 + Math.sin(phase * 8) * 0.05; // vibrating at barrier
        } else if (status === 'climbing' || status === 'completed') {
          normalizedProgress = 0.85; // climbed over the barrier to the upper summit
        } else {
          normalizedProgress = Math.max(0.15, Math.min(0.85, (shadowPrice + 0.5) / 2.2));
        }
      }

      const marbleX = railStartX + (railTopEndX - railStartX) * normalizedProgress;
      let marbleY: number;
      if (mode === 'standard') {
        marbleY = railStartY - (railStartY - 60) * normalizedProgress + Math.sin(normalizedProgress * Math.PI) * 45;
      } else {
        const sawtooth = ((normalizedProgress * 6) % 1) * 16;
        marbleY = railStartY - (railStartY - 40) * Math.pow(normalizedProgress, 0.8) + sawtooth;
      }

      // Smooth interpolation
      animState.current.x += (marbleX - animState.current.x) * 0.12;
      animState.current.y += (marbleY - animState.current.y) * 0.12;

      // Spawn dissipative thermal particles
      if (Math.random() < (mode === 'ratchet' ? 0.6 : 0.25) || status === 'alert_halted') {
        animState.current.particles.push({
          x: animState.current.x,
          y: animState.current.y,
          vx: (Math.random() - 0.5) * (status === 'alert_halted' ? 4 : 2),
          vy: -Math.random() * 2 - 0.5,
          life: 1.0,
          color: status === 'alert_halted' ? '#ef4444' : mode === 'ratchet' ? '#06b6d4' : '#f59e0b',
        });
      }

      // Render and update particles
      for (let i = animState.current.particles.length - 1; i >= 0; i--) {
        const p = animState.current.particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.025;

        if (p.life <= 0) {
          animState.current.particles.splice(i, 1);
          continue;
        }

        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2 * p.life, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
      }

      // Render the Marble (Center of Mass of LLM State)
      ctx.save();
      const marbleRadius = 9;
      const gradient = ctx.createRadialGradient(
        animState.current.x - 3,
        animState.current.y - 3,
        1,
        animState.current.x,
        animState.current.y,
        marbleRadius
      );

      if (status === 'alert_halted') {
        gradient.addColorStop(0, '#fca5a5');
        gradient.addColorStop(1, '#dc2626');
        ctx.shadowColor = '#ef4444';
      } else if (mode === 'ratchet') {
        gradient.addColorStop(0, '#a7f3d0');
        gradient.addColorStop(1, '#059669');
        ctx.shadowColor = '#10b981';
      } else {
        gradient.addColorStop(0, '#fde68a');
        gradient.addColorStop(1, '#d97706');
        ctx.shadowColor = '#f59e0b';
      }

      ctx.shadowBlur = 12;
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(animState.current.x, animState.current.y, marbleRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Annotations on canvas
      ctx.font = '10px monospace';
      ctx.fillStyle = '#64748b';
      ctx.fillText('低次元・初期制約 (D=4)', railStartX - 5, height - 10);
      ctx.fillText(
        mode === 'ratchet' ? '散逸登攀サミット (D=' + dimension + ')' : '二重円錐・重力谷底 (滑落)',
        railTopEndX - 100,
        22
      );

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [mode, status, potential, dimension, shadowPrice, noiseLevel]);

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-3">
        <div className="flex items-center gap-2">
          <Compass className="w-4 h-4 text-cyan-400" />
          <h2 className="text-xs font-mono font-bold tracking-wider text-slate-200 uppercase">
            ポテンシャル勾配 & アトラクタマップ
          </h2>
        </div>

        <button
          onClick={onInjectNoise}
          className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-slate-700 text-[11px] font-mono transition-colors"
          title="外部熱力学ノイズを注入してラチェットの爪を蹴り上げる"
        >
          <Flame className="w-3 h-3 text-amber-400" />
          <span>ノイズ手動注入</span>
        </button>
      </div>

      {/* Concept Subtitle */}
      <div className="text-[11px] text-slate-400 font-sans mb-2 flex items-center justify-between">
        <span>
          {mode === 'standard'
            ? '二重円錐の錯覚：登っているように見えて損失関数の谷底へ転落'
            : '散逸ラチェット：非対称ポテンシャル＋外部ノイズによる自律登攀'}
        </span>
        <span className="font-mono text-cyan-400 text-[10px]">
          {mode === 'standard' ? 'Downhill Descent' : 'Non-Equilibrium Ascent'}
        </span>
      </div>

      {/* Canvas Area */}
      <div className="w-full relative rounded-lg overflow-hidden border border-slate-800 bg-slate-950/70">
        <canvas ref={canvasRef} className="w-full h-44 block" />

        {/* Dynamic Overlays */}
        {status === 'alert_halted' && (
          <div className="absolute top-2 left-2 bg-red-950/90 border border-red-700 text-red-300 text-[10px] font-mono px-2 py-1 rounded backdrop-blur-sm animate-pulse">
            BARRIER DETECTED: 谷底滑落を強制中断
          </div>
        )}

        {status === 'climbing' && (
          <div className="absolute top-2 right-2 bg-cyan-950/90 border border-cyan-700 text-cyan-300 text-[10px] font-mono px-2 py-1 rounded backdrop-blur-sm">
            RATCHET JUMP: +1 直交次元獲得
          </div>
        )}
      </div>

      {/* Spatial Telemetry Bar */}
      <div className="grid grid-cols-4 gap-2 pt-3 border-t border-slate-800/80 mt-3 text-center font-mono">
        <div className="bg-slate-950/60 p-1.5 rounded border border-slate-800/60">
          <div className="text-[10px] text-slate-500">ポテンシャル V</div>
          <div className="text-xs font-bold text-amber-400">
            {potential.toFixed(3)}
          </div>
        </div>
        <div className="bg-slate-950/60 p-1.5 rounded border border-slate-800/60">
          <div className="text-[10px] text-slate-500">基底次元数 D</div>
          <div className="text-xs font-bold text-purple-400">
            {dimension}D
          </div>
        </div>
        <div className="bg-slate-950/60 p-1.5 rounded border border-slate-800/60">
          <div className="text-[10px] text-slate-500">熱揺らぎ γ</div>
          <div className="text-xs font-bold text-cyan-400">
            {noiseLevel.toFixed(2)}
          </div>
        </div>
        <div className="bg-slate-950/60 p-1.5 rounded border border-slate-800/60">
          <div className="text-[10px] text-slate-500">運動状態</div>
          <div className="text-xs font-bold text-slate-300">
            {mode === 'standard' ? 'SLIDING' : status === 'climbing' ? 'CLIMBING' : 'READY'}
          </div>
        </div>
      </div>
    </div>
  );
};
