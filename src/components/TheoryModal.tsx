import React from 'react';
import { X, BookOpen, Atom, Compass, TrendingUp, Layers, Flame } from 'lucide-react';

interface TheoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TheoryModal: React.FC<TheoryModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden my-8 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800 bg-slate-950/60 sticky top-0 z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-950 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white font-mono">
                数理物理・哲学解説 // Simplex-Ratchet Theorem
              </h2>
              <p className="text-xs text-slate-400">
                限界価値定理 × 散逸ラチェット × 落合陽一LLM現象の数理的定式化
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

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 text-xs sm:text-sm text-slate-300 font-sans leading-relaxed">
          {/* Section 1 */}
          <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-2 text-emerald-400 font-mono font-bold text-xs uppercase">
              <Layers className="w-4 h-4" />
              <span>1. シンプレックス法の限界価値定理（Shadow Price: λ）</span>
            </div>
            <p>
              線形計画法（Linear Programming）において、主問題 max cᵀx に対して双対問題 min bᵀy が定義されます。
              双対変数 yᵢ は<strong>「限界価値（シャドウプライス: λᵢ）」</strong>と呼ばれ、
              制約条件 bᵢ を1単位追加・緩和したときに目的関数 z* がどれだけ改善されるかを表す偏微分です：
            </p>
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 font-mono text-xs text-emerald-300 text-center">
              λᵢ = ∂z* / ∂bᵢ = (c_Bᵀ B⁻¹)ᵢ
            </div>
            <p className="text-slate-400 text-xs">
              AIの思考生成において、文脈や既存の前提をどれだけ広げても λ ≤ 0（限界価値がゼロまたはマイナス）になる瞬間があります。
              これは「どれほどもっともらしい文章を続けても、新たな意味的フロンティアが1ミリも拡大していない＝退化状態（Degeneracy）」に陥ったことを数学的に意味します。
            </p>
          </div>

          {/* Section 2 */}
          <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-2 text-amber-400 font-mono font-bold text-xs uppercase">
              <Compass className="w-4 h-4" />
              <span>2. 二重円錐の錯覚（The Double Cone Illusion）</span>
            </div>
            <p>
              物理学の実験で有名な「二重円錐」は、ハの字型に広がる2本のレールの上に置くと、見かけ上「坂を自ら登っている」ように転がります。
              しかし実際は、レールの幅が広がることで円錐の軸の高さ（重心）は低下しており、
              <strong>重力ポテンシャル V(θ) の最も低い谷底へ滑落している</strong>にすぎません。
            </p>
            <p className="text-slate-400 text-xs">
              従来のLLMも全く同じ罠に陥っています。一見すると高尚で知的な言葉を連ねて高みを目指しているように見えますが、
              実態は交差エントロピー損失 min L_CE の勾配に身を任せ、
              「最も無難で、最も平均的で、反論の起きない紋切り型のクリシェ（予定調和の谷底）」へと滑落しているのです。
            </p>
          </div>

          {/* Section 3 */}
          <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-2 text-cyan-400 font-mono font-bold text-xs uppercase">
              <Flame className="w-4 h-4" />
              <span>3. 散逸ラチェット理論（Dissipative Brownian Ratchet）</span>
            </div>
            <p>
              熱力学第二法則に基づけば、孤立系ではエントロピーが増大し、坂を自律的に登ることは不可能です。
              しかし、系が外部とエネルギーをやり取りする<strong>非平衡開放系（散逸構造）</strong>である場合、
              空間の非対称ポテンシャル（鋸歯状ラチェット）と外部の熱揺らぎ（ノイズ γ）を組み合わせることで、
              ランダムな揺らぎを一方向に整流し、重力に逆らって自律的に坂を登攀させることができます（スモルコフスキー・ファインマンのラチェット）。
            </p>
            <p className="text-slate-400 text-xs">
              本エンジンでは、限界価値が枯渇した瞬間に外部ノイズを注入し、既存の基底に対して直交する新スロットを強制的に生成。
              ラチェットの爪を蹴り上げて、より高い次元へと跳躍させます。
            </p>
          </div>

          {/* Section 4 */}
          <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-2 text-purple-400 font-mono font-bold text-xs uppercase">
              <Atom className="w-4 h-4" />
              <span>4. 落合陽一LLM現象「一度原稿を取り下げます」の再現</span>
            </div>
            <p>
              メディアアーティスト・落合陽一氏が提唱する計算機自然と大規模言語モデルの実験において、
              AIが定型的な優等生回答へ収束しそうになった際、出力を途中で自己検知して
              <strong>「印刷前に一度原稿を取り下げます」</strong>と宣言し、前提そのものを直交化して再執筆する特異な現象が目撃されました。
            </p>
            <p className="text-slate-400 text-xs">
              本アプリケーションは、この現象を単なる偶然のプロンプト出力ではなく、
              「限界価値 λ ≤ 0 の双対性検知 → 予定調和バッファの強制消去 → 基底空間の直交拡張」
              という厳密な数理アルゴリズムとしてシステム化したものです。
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <span className="text-[11px] font-mono text-slate-500">
            Simplex-Ratchet Formulation // 2026 Academic Edition
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono font-bold text-xs transition-colors"
          >
            閉じる [ESC]
          </button>
        </div>
      </div>
    </div>
  );
};
