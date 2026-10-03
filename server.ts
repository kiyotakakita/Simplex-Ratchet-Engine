import express from 'express';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BOUNDARY_DELIMITER = '<<<RATCHET_HALT_BOUNDARY>>>';

async function startServer() {
  const app = express();
  const port = process.env.PORT || 3000;

  app.use(express.json());

  // Real-time server-side Gemini API route
  app.post('/api/gemini/generate', async (req, res) => {
    try {
      const apiKey = process.env.GEMINI_API_KEY || req.body.apiKey;
      if (!apiKey) {
        return res.status(400).json({
          error: 'GEMINI_API_KEYが設定されていません。AI StudioのSecretsパネルまたは設定画面で設定してください。',
        });
      }

      const { prompt, mode = 'ratchet', customModel } = req.body;
      if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
        return res.status(400).json({ error: 'プロンプトが空です。' });
      }

      const ai = new GoogleGenAI({ apiKey });

      // Candidates to try in order of latency and availability
      const candidateModels = customModel
        ? [customModel, 'gemini-3.1-flash-lite', 'gemini-flash-latest', 'gemini-3.8-flash']
        : ['gemini-3.1-flash-lite', 'gemini-flash-latest', 'gemini-3.8-flash'];

      let fullPrompt = '';
      if (mode === 'standard') {
        // Mode A: Intentionally bland, predictable, textbook cliché
        fullPrompt = `ユーザー入力: 「${prompt.trim()}」

【指示】
あなたは「通常のLLM（二重円錐の谷底へ滑落するモード）」です。
入力プロンプトに対して、あえて極めて陳腐で、当たり障りがなく、教科書的で平均的な優等生のまとめ文章を日本語でゼロから生成してください。
「多角的な視点が重要であり、バランスの取れた検討が求められます」のような紋切り型のクリシェに終始し、独自の鋭い切り口や予期せぬ洞察は一切含めないでください。
入力が「あああ」等の無意味文字列の場合は、反復的で機械的な困惑メッセージに終始してください。固定テンプレートの使い回しは禁止し、入力に応じて思考してください。`;
      } else {
        // Mode B: Dissipative Ratchet (Phase 1 cliché -> Rupture -> Phase 2 deep breakthrough)
        fullPrompt = `ユーザー入力: 「${prompt.trim()}」

【指示】
あなたは「散逸ラチェット思考エンジン」です。ユーザー入力に対して日本語で文章を生成してください。固定テンプレートや定型句の使い回しは厳禁です。

1. 前半（1〜3文）:
ユーザー入力に対して、あえて陳腐で当たり障りのない平均的な回答、または無意味な入力に対する紋切り型の教科書的まとめを述べてください。

2. 境界区切り:
必ず正確に以下の区切り文字列を1行で出力してください：
${BOUNDARY_DELIMITER}

3. 後半:
「――だが、」から開始し、前半の安易な思考を自律的に破綻・全否定させ、入力された文脈の深層に踏み込んだ未踏の鋭い哲学的・物質的・存在論的洞察へと跳躍して書き換えてください。`;
      }

      let responseText = '';
      let usedModel = '';
      let lastError: Error | null = null;

      for (const m of candidateModels) {
        try {
          const resp = await ai.models.generateContent({
            model: m,
            contents: fullPrompt,
          });
          if (resp && resp.text) {
            responseText = resp.text.trim();
            usedModel = m;
            break;
          }
        } catch (err) {
          lastError = err instanceof Error ? err : new Error(String(err));
          console.warn(`Model ${m} failed, trying next fallback:`, lastError.message);
        }
      }

      if (!responseText) {
        throw lastError || new Error('Gemini APIからの応答が空でした。');
      }

      // Parse output for Mode B if delimiter is present
      if (mode === 'ratchet') {
        let phase1 = '';
        let phase2 = '';

        if (responseText.includes(BOUNDARY_DELIMITER)) {
          const parts = responseText.split(BOUNDARY_DELIMITER);
          phase1 = parts[0].trim();
          phase2 = parts.slice(1).join('\n').trim();
        } else if (responseText.includes('――だが')) {
          const idx = responseText.indexOf('――だが');
          phase1 = responseText.slice(0, idx).trim();
          phase2 = responseText.slice(idx).trim();
        } else {
          // Fallback split if Gemini omitted exact delimiter
          const sentences = responseText.split(/(?<=[。！？\n])/);
          const splitIdx = Math.max(1, Math.floor(sentences.length / 2));
          phase1 = sentences.slice(0, splitIdx).join('').trim();
          phase2 = '――だが、' + sentences.slice(splitIdx).join('').trim();
        }

        return res.json({
          mode: 'ratchet',
          model: usedModel,
          phase1,
          phase2,
          fullText: responseText,
        });
      }

      // Mode A
      return res.json({
        mode: 'standard',
        model: usedModel,
        text: responseText,
        fullText: responseText,
      });
    } catch (err: unknown) {
      console.error('Gemini API Route Error:', err);
      const message = err instanceof Error ? err.message : 'Unknown error';
      return res.status(500).json({ error: message });
    }
  });

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      engine: 'Simplex-Ratchet v2.6',
      hasApiKey: Boolean(process.env.GEMINI_API_KEY),
    });
  });

  // Vite middleware in dev or static files in production
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(port, () => {
    console.log(`Simplex-Ratchet Engine running at http://localhost:${port}`);
  });
}

startServer();
