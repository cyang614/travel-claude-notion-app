import { z } from 'zod';

export const travelInputSchema = z.object({
  destination: z.string().trim().min(1, '請輸入目的地'),
  days: z.coerce.number().int().min(1, '天數至少 1 天').max(30, '天數最多 30 天'),
  budget: z.string().trim().min(1, '請輸入預算'),
  styles: z.array(z.string().trim().min(1)).min(1, '請至少選擇一種旅遊風格'),
  group: z.coerce.number().int().min(1, '同行人數至少 1 人').max(50, '同行人數最多 50 人'),
  notes: z.string().trim().optional().default('')
});

const timeSlotSchema = z.object({
  activity: z.string(),
  location: z.string(),
  tip: z.string(),
  lat: z.number(),
  lng: z.number()
});

const daySchema = z.object({
  day: z.number().int().min(1),
  title: z.string().min(1),
  morning: timeSlotSchema,
  afternoon: timeSlotSchema,
  evening: timeSlotSchema,
  meal_recommendations: z.array(z.string()).min(1),
  estimated_daily_cost: z.string().min(1)
});

export const planSchema = z.object({
  plan_id: z.enum(['A', 'B', 'C']).or(z.string().min(1)),
  plan_name: z.string().min(2),
  plan_theme: z.string().min(1),
  estimated_cost: z.string().min(1),
  highlights: z.array(z.string()).min(3),
  days: z.array(daySchema).min(1),
  packing_tips: z.array(z.string()).min(1),
  best_season: z.string().min(1)
});

export const plansSchema = z.object({
  plans: z.array(planSchema).length(3)
});

export const generateRequestSchema = travelInputSchema;

export const saveRequestSchema = z.object({
  notionDatabaseId: z.string().trim().min(1, '請輸入 Notion Database ID'),
  input: travelInputSchema,
  plans: plansSchema.shape.plans
});

export const generateAndSaveRequestSchema = z.object({
  notionDatabaseId: z.string().trim().min(1, '請輸入 Notion Database ID'),
  input: travelInputSchema
});

export const refineRequestSchema = z.object({
  plan: planSchema,
  feedback: z.string().trim().min(1, '請輸入修改意見'),
  input: travelInputSchema
});
