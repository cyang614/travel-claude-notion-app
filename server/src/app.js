import express from 'express';
import cors from 'cors';
import { generateTravelPlans } from './claude.js';
import { savePlansToNotion } from './notion.js';
import { generateAndSaveRequestSchema, generateRequestSchema, saveRequestSchema } from './schemas.js';

function validationError(res, error) {
  return res.status(400).json({ ok: false, error: 'validation_error', details: error.flatten?.() || error.message });
}

export function createApp(deps = {}) {
  const app = express();
  app.use(cors({ origin: process.env.CLIENT_ORIGIN || true }));
  app.use(express.json({ limit: '2mb' }));

  const generate = deps.generateTravelPlans || generateTravelPlans;
  const save = deps.savePlansToNotion || savePlansToNotion;

  app.get('/api/health', (_req, res) => res.json({ ok: true }));

  app.post('/api/trips/generate', async (req, res) => {
    const parsed = generateRequestSchema.safeParse(req.body);
    if (!parsed.success) return validationError(res, parsed.error);

    try {
      const result = await generate(parsed.data);
      return res.json({ ok: true, ...result });
    } catch (error) {
      return res.status(502).json({ ok: false, error: 'claude_error', message: error.message });
    }
  });

  app.post('/api/trips/save', async (req, res) => {
    const parsed = saveRequestSchema.safeParse(req.body);
    if (!parsed.success) return validationError(res, parsed.error);

    try {
      const notion_pages = await save({ notionDatabaseId: parsed.data.notionDatabaseId, input: parsed.data.input, plans: parsed.data.plans });
      return res.json({ ok: true, notion_pages });
    } catch (error) {
      return res.status(502).json({ ok: false, error: 'notion_error', message: error.message });
    }
  });

  app.post('/api/trips/generate-and-save', async (req, res) => {
    const parsed = generateAndSaveRequestSchema.safeParse(req.body);
    if (!parsed.success) return validationError(res, parsed.error);

    try {
      const result = await generate(parsed.data.input);
      const notion_pages = await save({ notionDatabaseId: parsed.data.notionDatabaseId, input: parsed.data.input, plans: result.plans });
      return res.json({ ok: true, ...result, notion_pages });
    } catch (error) {
      return res.status(502).json({ ok: false, error: 'generate_or_save_error', message: error.message });
    }
  });

  return app;
}
