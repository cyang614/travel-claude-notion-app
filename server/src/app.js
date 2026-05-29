import express from 'express';
import cors from 'cors';
import { generateTravelPlans, refineTravelPlan } from './claude.js';
import { savePlansToNotion } from './notion.js';
import { generateAndSaveRequestSchema, generateRequestSchema, refineRequestSchema, saveRequestSchema } from './schemas.js';

function validationError(res, error) {
  return res.status(400).json({ ok: false, error: 'validation_error', details: error.flatten?.() || error.message });
}

export function createApp(deps = {}) {
  const app = express();
  app.use(cors({ origin: process.env.CLIENT_ORIGIN || true }));
  app.use(express.json({ limit: '2mb' }));

  const generate = deps.generateTravelPlans || generateTravelPlans;
  const save = deps.savePlansToNotion || savePlansToNotion;
  const refine = deps.refineTravelPlan || refineTravelPlan;

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

  app.post('/api/trips/generate-stream', async (req, res) => {
    const parsed = generateRequestSchema.safeParse(req.body);
    if (!parsed.success) return validationError(res, parsed.error);

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    const send = (data) => res.write(`data: ${JSON.stringify(data)}\n\n`);

    try {
      const result = await generate(parsed.data, {
        onProgress: (msg) => send({ type: 'progress', message: msg })
      });
      send({ type: 'done', plans: result.plans });
    } catch (error) {
      send({ type: 'error', message: error.message });
    }
    res.end();
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

  app.post('/api/trips/refine', async (req, res) => {
    const parsed = refineRequestSchema.safeParse(req.body);
    if (!parsed.success) return validationError(res, parsed.error);

    try {
      const plan = await refine(parsed.data);
      return res.json({ ok: true, plan });
    } catch (error) {
      return res.status(502).json({ ok: false, error: 'claude_error', message: error.message });
    }
  });

  app.post('/api/trips/generate-and-save', async (req, res) => {
    const parsed = generateAndSaveRequestSchema.safeParse(req.body);
    if (!parsed.success) return validationError(res, parsed.error);

    let result;
    try {
      result = await generate(parsed.data.input);
    } catch (error) {
      return res.status(502).json({ ok: false, error: 'claude_error', message: error.message });
    }

    try {
      const notion_pages = await save({ notionDatabaseId: parsed.data.notionDatabaseId, input: parsed.data.input, plans: result.plans });
      return res.json({ ok: true, ...result, notion_pages });
    } catch (error) {
      return res.status(502).json({ ok: false, error: 'notion_error', message: error.message });
    }
  });

  return app;
}
