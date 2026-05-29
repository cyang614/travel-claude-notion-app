import './env.js';
import Anthropic from '@anthropic-ai/sdk';
import { planSchema, plansSchema } from './schemas.js';
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
  options.onProgress?.('正在連線 Claude API…');
  const message = await anthropic.messages.create({
    model: options.model || process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-20250514',
    max_tokens: 12000,
    temperature: 0.8,
    system: '你只透過工具輸出符合 schema 的旅遊行程資料。內容必須使用台灣繁體中文。',
    tools: [travelPlanTool],
    tool_choice: { type: 'tool', name: travelPlanTool.name },
    messages: [{ role: 'user', content: buildTravelPrompt(input) }]
  });

  options.onProgress?.('正在解析行程資料…');
  const parsed = plansSchema.parse(extractToolInput(message));
  options.onProgress?.('行程資料驗證完成');
  const expectedDays = Number(input.days);
  for (const plan of parsed.plans) {
    if (plan.days.length !== expectedDays) {
      throw new Error(`Plan ${plan.plan_id} has ${plan.days.length} days; expected ${expectedDays}.`);
    }
  }
  return parsed;
}

export async function refineTravelPlan({ plan, feedback, input }) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('Missing ANTHROPIC_API_KEY');

  const anthropic = new Anthropic({ apiKey });
  const message = await anthropic.messages.create({
    model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-20250514',
    max_tokens: 12000,
    temperature: 0.6,
    system: '你只透過工具輸出符合 schema 的旅遊行程資料。內容必須使用台灣繁體中文。',
    tools: [travelPlanTool],
    tool_choice: { type: 'tool', name: travelPlanTool.name },
    messages: [
      { role: 'user', content: buildTravelPrompt(input) },
      { role: 'assistant', content: [{ type: 'tool_use', id: 'refine_ctx', name: travelPlanTool.name, input: { plans: [plan] } }] },
      { role: 'user', content: `請根據以下意見修改方案 ${plan.plan_id}，只回傳這一個修改後的方案。修改意見：${feedback}` }
    ]
  });

  const toolInput = extractToolInput(message);
  const refinedPlan = planSchema.parse(toolInput.plans?.[0] || toolInput);
  if (refinedPlan.days.length !== Number(input.days)) {
    throw new Error(`Plan ${refinedPlan.plan_id} has ${refinedPlan.days.length} days; expected ${Number(input.days)}.`);
  }
  return refinedPlan;
}
