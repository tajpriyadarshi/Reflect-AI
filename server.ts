import express, { Request, Response } from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const app = express();
const PORT = 3000;

// 1. Top-level body parser middleware configured BEFORE routes
app.use(express.json({ limit: '1mb' }));

// Model fallback ladder for high availability and resilient error recovery
const MODEL_FALLBACK_LADDER = [
  'gemini-3.6-flash',
  'gemini-3.1-flash-lite',
  'gemini-flash-latest',
  'gemini-3.7-flash'
];

interface ChatHistoryItem {
  role: 'user' | 'model';
  text?: string;
  parts?: Array<{ text: string }>;
}

let aiClient: GoogleGenAI | null = null;

function getAIClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn('GEMINI_API_KEY environment variable is not set. Using fallback responses or waiting for key.');
    }
    aiClient = new GoogleGenAI({ apiKey: apiKey || '' });
  }
  return aiClient;
}

// Resilient helper with automated fallback ladder
async function generateJournalReplyWithFallback(
  history: ChatHistoryItem[],
  promptText: string
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return `Thank you for sharing your thoughts: "${promptText}". I am currently operating in demo reflective mode because the GEMINI_API_KEY environment variable is not yet configured. Once configured in AI Studio Settings, full multi-turn conversational analysis will be enabled.`;
  }

  const ai = getAIClient();

  const systemInstruction = `You are an empathetic, insightful, and supportive AI Journal Companion and Reflective Guide.
Your purpose is to help the user process their thoughts, celebrate their wins, navigate dilemmas with gentle questions, and foster self-awareness.
- Keep your tone warm, articulate, grounded, and non-judgmental.
- Offer constructive reflections, highlight themes or emotional subtexts, and occasionally ask 1-2 thoughtful open-ended questions to deepen their self-exploration.
- Keep responses concise yet meaningful (typically 2-4 well-crafted paragraphs).
- Format using clean Markdown with clear headings or bullet points where appropriate.`;

  // Build conversational contents from history
  const contents: Array<{ role: string; parts: Array<{ text: string }> }> = [];

  for (const item of history) {
    if (!item) continue;
    const textContent = typeof item.text === 'string' 
      ? item.text 
      : (Array.isArray(item.parts) ? item.parts.map(p => p.text).join(' ') : '');
    
    if (textContent.trim()) {
      contents.push({
        role: item.role === 'model' ? 'model' : 'user',
        parts: [{ text: textContent.trim() }]
      });
    }
  }

  // Add the current prompt
  contents.push({
    role: 'user',
    parts: [{ text: promptText.trim() }]
  });

  let lastError: any = null;

  for (const modelName of MODEL_FALLBACK_LADDER) {
    try {
      const response = await ai.models.generateContent({
        model: modelName,
        contents,
        config: {
          systemInstruction,
          temperature: 0.7,
        },
      });

      const replyText = response.text?.trim();
      if (replyText) {
        return replyText;
      }
    } catch (err: any) {
      console.warn(`Attempt with model ${modelName} failed:`, err?.message || err);
      lastError = err;
      // Continue to next model in the fallback ladder
    }
  }

  throw new Error(`Failed to generate journal reflection after attempting all fallback models: ${lastError?.message || 'Unknown error'}`);
}

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
    timestamp: new Date().toISOString()
  });
});

// Reflective Chat / Journal API endpoint
app.post('/api/chat', async (req: Request, res: Response) => {
  try {
    // Defensive Payload Ingestion (Null-Safe Destructuring)
    const body = (req.body && typeof req.body === 'object') ? req.body : {};
    const promptText = typeof body.prompt === 'string' ? body.prompt.trim() : '';
    const rawHistory = Array.isArray(body.history) ? body.history : [];

    if (!promptText) {
      return res.status(400).json({
        error: 'A prompt text is required to generate a journal reflection.'
      });
    }

    // Sanitize history items
    const sanitizedHistory: ChatHistoryItem[] = rawHistory
      .filter((item: any) => item && typeof item === 'object')
      .map((item: any) => ({
        role: item.role === 'model' ? 'model' : 'user',
        text: typeof item.text === 'string' ? item.text.slice(0, 10000) : ''
      }));

    const reply = await generateJournalReplyWithFallback(sanitizedHistory, promptText);

    return res.json({
      reply,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Error processing journal entry:', error);
    return res.status(500).json({
      error: error.message || 'Internal server error while generating reflection.',
    });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Reflective AI Journal Server running on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server startup error:', err);
});
