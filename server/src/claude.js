import Anthropic from '@anthropic-ai/sdk';
import { plansSchema } from './schemas.js';
import { buildTravelPrompt, travelPlanTool } from './prompt.js';

function extractToolInput(message) {
  const toolUse = message.content?.find((part) => part.type === 'tool_use' && part.name === travelPlanTool.name);
  if (toolUse?.input) return toolUse.input;

  const text = message.content?.find((part) => part.type === 'text')?.text;
  if (!text) throw new Error('Claude did not return travel plan JSON.');
  const jsonText = text.match(/```json\s*([\s\S]*?)```/i)?.[1] || text.match(/\{[\s\S]*\}/)?.[0];
  if (!jsonText) throw new Error('Claude response did not contain parseable JSON.');
  return JSON.parse(jsonText);
}

export async function generateTravelPlans(input, options = {}) {
  const apiKey = options.apiKey || process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('Missing ANTHROPIC_API_KEY');

  const anthropic = options.anthropic || new Anthropic({ apiKey });
  const message = await anthropic.messages.create({
    model: options.model || process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-20250514',
    max_tokens: 12000,
    temperature: 0.8,
    system: '你只透過工具輸出符合 schema 的旅遊行程資料。內容必須使用台灣繁體中文。',
    tools: [travelPlanTool],
    tool_choice: { type: 'tool', name: travelPlanTool.name },
    messages: [{ role: 'user', content: buildTravelPrompt(input) }]
  });

  const parsed = plansSchema.parse(extractToolInput(message));
  const expectedDays = Number(input.days);
  for (const plan of parsed.plans) {
    if (plan.days.length !== expectedDays) {
      throw new Error(`Plan ${plan.plan_id} has ${plan.days.length} days; expected ${expectedDays}.`);
    }
  }
  return parsed;
}
