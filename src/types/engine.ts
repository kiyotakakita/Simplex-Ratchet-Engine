export type EngineMode = 'standard' | 'ratchet';

export type EngineStatus =
  | 'idle'
  | 'streaming'
  | 'alert_halted'
  | 'orthogonalizing'
  | 'climbing'
  | 'completed';

export interface TokenTelemetry {
  id: number;
  token: string;
  shadowPrice: number; // 限界価値 λ
  potential: number;   // ポテンシャル V(θ)
  entropy: number;     // 情報エントロピー S
  dimension: number;   // 基底次元数 D
  isOrthogonal: boolean; // 新次元生成後のトークンか
  rejected: boolean;   // 取り下げ対象となったか
  dualSlack: number;   // 双対スラック s_i
  timestamp: number;
}

export interface ActiveBasisVariable {
  id: string;
  name: string;
  type: 'constraint' | 'legacy_log' | 'noise_injection' | 'slack_var' | 'orthogonal_slot';
  shadowPrice: number;
  slack: number;
  status: 'active' | 'pivoting' | 'retired' | 'orthogonalized';
  dimensionIndex: number;
}

export interface SimulationPreset {
  id: string;
  title: string;
  category: string;
  prompt: string;
  haltTokenIndex: number; // 限界価値が0以下になるトークン位置
  initialTokens: string[];
  rejectedEnding: string[]; // モードAまたはモードBで取り下げられる陳腐な結末
  ratchetEnding: string[];   // モードBで直交化後に跳躍する切れ味鋭い結末
  contextNotes: string;
}

export interface EngineStats {
  shadowPrice: number;
  minShadowPrice: number;
  maxShadowPrice: number;
  currentPotential: number;
  dualGap: number;
  currentDimension: number;
  totalTokens: number;
  rejectedTokensCount: number;
  ratchetJumps: number;
  noiseLevel: number;
}
