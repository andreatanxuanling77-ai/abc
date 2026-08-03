import express from 'express';
import { spawn } from 'child_process';
import path from 'path';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(express.json());

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;
const isProd = process.env.NODE_ENV === 'production';

// Initialize Gemini Client
const apiKey = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({
  apiKey: apiKey || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Helper to validate API key
const checkApiKey = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (!apiKey) {
    return res.status(401).json({
      error: 'Gemini API key is not configured. Please open Settings > Secrets to add your GEMINI_API_KEY.',
    });
  }
  next();
};

// 1. Standard Content Generation API
app.post('/api/gemini/generate', checkApiKey, async (req, res) => {
  try {
    const { prompt, systemInstruction, temperature } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required.' });
    }

    const config: any = {};
    if (systemInstruction) config.systemInstruction = systemInstruction;
    if (temperature !== undefined) config.temperature = temperature;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: config,
    });

    res.json({ text: response.text });
  } catch (error: any) {
    console.error('Gemini API Error:', error);
    res.status(500).json({ error: error.message || 'Error occurred during generation.' });
  }
});

// 2. Structured JSON Generation API
app.post('/api/gemini/structured', checkApiKey, async (req, res) => {
  try {
    const { prompt, systemInstruction, schema, temperature } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required.' });
    }
    if (!schema) {
      return res.status(400).json({ error: 'JSON Schema is required.' });
    }

    const config: any = {
      responseMimeType: 'application/json',
      responseSchema: schema,
    };
    if (systemInstruction) config.systemInstruction = systemInstruction;
    if (temperature !== undefined) config.temperature = temperature;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: config,
    });

    const parsedJson = JSON.parse(response.text?.trim() || '{}');
    res.json({ data: parsedJson });
  } catch (error: any) {
    console.error('Gemini Structured API Error:', error);
    res.status(500).json({ error: error.message || 'Error occurred during structured generation.' });
  }
});

if (isProd) {
  // Production server serving built client files on port 3000
  const distPath = path.resolve('dist');
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(distPath, 'index.html'));
  });

  app.listen(PORT, () => {
    console.log(`[Production] Fullstack server running on port ${PORT}`);
  });
} else {
  // Development server: Express on 3001, Vite spawned on 3000
  const API_PORT = 3001;
  app.listen(API_PORT, '0.0.0.0', () => {
    console.log(`[Dev Backend] Express API listening on http://localhost:${API_PORT}`);
  });

  console.log('[Dev Frontend] Spawning Vite on port 3000...');
  const vite = spawn('npx', ['vite', '--port', '3000', '--host', '0.0.0.0'], {
    stdio: 'inherit',
    shell: true,
  });

  vite.on('close', (code) => {
    console.log(`Vite development server exited with code ${code}`);
    process.exit(code || 0);
  });
}
