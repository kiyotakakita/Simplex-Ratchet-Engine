# Simplex-Ratchet Engine (v2.6)

> **ポテンシャル滑落（二重円錐の錯覚）から、ノイズ駆動による自律登攀へ**  
> 線形計画法の限界価値定理（Shadow Price）と散逸ラチェット機構を模倣した、次世代LLM思考実験環境。

---

## 概要 (Concept)

従来の自己回帰型LLM（Next-Token Prediction）は、新しい思考の高みへと登っているように見えて、実態は**学習データの確率ポテンシャルの坂を転がり落ちている（損失最小化している）だけの二重円錐**に過ぎません。多段化されたゴルトンボードのように、放っておけば解は常に無難な中央値（陳腐な予定調和）へと滑落します。

本プロジェクトは、この「滑落の構造」を逆手に取り、**「思考の陳腐化（限界価値の枯渇）を数学的に検知し、自律的に文章を差し戻して新次元へ跳躍させる」**実験的アーキテクチャです。

---

## コアメカニズム (Architecture)

### 1. 二重円錐モード：[A] 通常LLM（滑落）
* 入力文脈から最も確率密度の高いトークンを連続選択。
* 議論は多角性や調和を装った「平均的な優等生回答」へ収束し、思考の限界価値 $\lambda$ はマイナスへと沈殿する。

### 2. 散逸ラチェットモード：[B] 自律登攀・直交化
* **限界価値（Shadow Price: $\lambda$）の監視**  
  生成プロセスの限界寄与度を監視し、クリシェ（定型句）や安易な合意形成を検知した瞬間に $\lambda \le 0$ を判定。
* **自律的差し戻し（「一度原稿を取り下げます」機構）**  
  予定調和の谷底へ落ちかけた文章を強制遮断。
* **ノイズ駆動型跳躍（非エルミート直交化）**  
  外部ノイズを取り込んで空間の次元を拡張。既存の文脈を切断し、矛盾する制約を自律的に登りつめる鋭利な洞察へとテキストを再構成・書き換える。

---

## 主な機能 (Features)

- **Gemini API リアルタイム推論**  
  テンプレート穴埋めを完全排除し、Google Gen AI SDK を用いて毎回動的に異なる思考経路を生成。
- **滑落 vs 登攀のパラレル比較**  
  同一プロンプトに対し、無難な回答 [A] と、自律破綻・跳躍を経た回答 [B] の差異を可視化。
- **限界価値モニター（Recharts）**  
  トークン生成に伴う思考の新規性・寄与度をリアルタイムプロット。
- **ノイズ注入スライダー & 介入感度コントロール**  
  跳躍時の破壊力（温度・直交性）をインタラクティブに調整可能。

---

## 技術スタック (Tech Stack)

* **Frontend**: React, TypeScript, Next.js (App Router)
* **Styling**: Tailwind CSS
* **Animation**: Framer Motion, Lucide Icons
* **Visualization**: Recharts
* **LLM Engine**: Google Gen AI SDK (`@google/genai` / Gemini 1.5 Pro / Flash)

---

## はじめかた (Getting Started)

### 前提条件
- Node.js 18+
- Google Gemini API Key

### インストールと起動

```bash
# リポジトリのクローン
git clone https://github.com/your-username/simplex-ratchet-engine.git
cd simplex-ratchet-engine

# 依存パッケージのインストール
npm install

# 環境変数の設定 (.env.local を作成)
echo "NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key_here" > .env.local

# 開発サーバーの起動
npm run dev
