import { describe, expect, it } from 'vitest';
import { buildPlanBlocks } from '../src/notion.js';

const plan = {
  plan_id: 'A',
  plan_name: '古都漫遊',
  plan_theme: '深度文化主題',
  estimated_cost: 'NT$50,000-60,000',
  highlights: ['亮點1', '亮點2', '亮點3'],
  days: [{
    day: 1,
    title: '古都散策',
    morning: { activity: '參拜', location: '清水寺', tip: '早到' },
    afternoon: { activity: '逛街', location: '二年坂', tip: '好走鞋' },
    evening: { activity: '夜景', location: '祇園', tip: '保暖' },
    meal_recommendations: ['湯豆腐', '抹茶'],
    estimated_daily_cost: 'NT$5,000'
  }],
  packing_tips: ['護照', '雨傘'],
  best_season: '春秋'
};

describe('buildPlanBlocks', () => {
  it('creates Notion blocks in the required order', () => {
    const blocks = buildPlanBlocks(plan);
    expect(blocks[0].type).toBe('heading_1');
    expect(blocks[1].type).toBe('callout');
    expect(blocks[1].callout.icon.emoji).toBe('✈️');
    expect(blocks.some((block) => block.type === 'heading_2' && block.heading_2.rich_text[0].text.content === 'Day 1：古都散策')).toBe(true);
    expect(blocks.some((block) => block.type === 'quote' && block.quote.rich_text[0].text.content.includes('湯豆腐、抹茶'))).toBe(true);
    expect(blocks.some((block) => block.type === 'to_do' && block.to_do.checked === false)).toBe(true);
    expect(blocks.at(-1).callout.icon.emoji).toBe('🗓️');
  });
});
