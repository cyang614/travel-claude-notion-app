import { describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';

const input = {
  destination: '京都',
  days: 2,
  budget: '60000',
  styles: ['文化歷史', '美食探索'],
  group: 2,
  notes: '不要太趕'
};

const samplePlans = [
  {
    plan_id: 'A',
    plan_name: '古都漫遊',
    plan_theme: '用慢步調走進京都古寺與町家風景。',
    estimated_cost: '每人 NT$50,000-58,000',
    highlights: ['清水寺', '祇園', '錦市場'],
    days: [1, 2].map((day) => ({
      day,
      title: `文化第${day}天`,
      morning: { activity: '參拜古寺', location: '清水寺', tip: '早點到' },
      afternoon: { activity: '散步老街', location: '二年坂', tip: '穿好走鞋' },
      evening: { activity: '祇園夜景', location: '祇園', tip: '保持安靜' },
      meal_recommendations: ['湯豆腐', '抹茶甜點'],
      estimated_daily_cost: '每人 NT$4,000-6,000'
    })),
    packing_tips: ['舒適鞋', '行動電源'],
    best_season: '春季賞櫻或秋季賞楓'
  },
  {
    plan_id: 'B',
    plan_name: '職人小旅',
    plan_theme: '以手作體驗與在地小店串起京都日常。',
    estimated_cost: '每人 NT$52,000-60,000',
    highlights: ['和菓子體驗', '町家咖啡', '鴨川散步'],
    days: [1, 2].map((day) => ({
      day,
      title: `職人第${day}天`,
      morning: { activity: '市場採買', location: '錦市場', tip: '準備現金' },
      afternoon: { activity: '手作體驗', location: '河原町', tip: '先預約' },
      evening: { activity: '鴨川散步', location: '鴨川', tip: '帶薄外套' },
      meal_recommendations: ['京料理', '咖啡甜點'],
      estimated_daily_cost: '每人 NT$4,500-6,500'
    })),
    packing_tips: ['環保袋', '相機'],
    best_season: '四季皆宜，避開日本連假更舒適'
  },
  {
    plan_id: 'C',
    plan_name: '山林神社',
    plan_theme: '結合近郊山林、神社與自然景觀。',
    estimated_cost: '每人 NT$48,000-56,000',
    highlights: ['伏見稻荷', '嵐山', '竹林小徑'],
    days: [1, 2].map((day) => ({
      day,
      title: `自然第${day}天`,
      morning: { activity: '神社健行', location: '伏見稻荷', tip: '補充水分' },
      afternoon: { activity: '嵐山散策', location: '嵐山', tip: '避開午後人潮' },
      evening: { activity: '溫泉放鬆', location: '京都市區', tip: '確認刺青規定' },
      meal_recommendations: ['蕎麥麵', '串燒'],
      estimated_daily_cost: '每人 NT$3,500-5,500'
    })),
    packing_tips: ['防曬', '輕便雨具'],
    best_season: '秋季與初夏'
  }
];

describe('travel app API', () => {
  it('generates travel plans', async () => {
    const generateTravelPlans = vi.fn().mockResolvedValue({ plans: samplePlans });
    const app = createApp({ generateTravelPlans });

    const res = await request(app).post('/api/trips/generate').send(input);

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.plans).toHaveLength(3);
    expect(generateTravelPlans).toHaveBeenCalledWith(input);
  });

  it('saves generated plans to Notion', async () => {
    const savePlansToNotion = vi.fn().mockResolvedValue([
      { plan_id: 'A', notion_page_id: 'page-a', notion_page_url: 'https://notion.so/page-a' }
    ]);
    const app = createApp({ savePlansToNotion });

    const res = await request(app).post('/api/trips/save').send({ notionDatabaseId: 'db123', input, plans: samplePlans });

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.notion_pages[0].notion_page_id).toBe('page-a');
    expect(savePlansToNotion).toHaveBeenCalled();
  });

  it('validates required fields', async () => {
    const app = createApp();
    const res = await request(app).post('/api/trips/generate').send({ destination: '' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('validation_error');
  });
});
