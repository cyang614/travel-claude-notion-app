export const travelPlanTool = {
  name: 'create_travel_plans',
  description: 'Create exactly 3 clearly different travel itinerary plans in Traditional Chinese JSON.',
  input_schema: {
    type: 'object',
    additionalProperties: false,
    required: ['plans'],
    properties: {
      plans: {
        type: 'array',
        minItems: 3,
        maxItems: 3,
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['plan_id', 'plan_name', 'plan_theme', 'estimated_cost', 'highlights', 'days', 'packing_tips', 'best_season'],
          properties: {
            plan_id: { type: 'string', enum: ['A', 'B', 'C'] },
            plan_name: { type: 'string', description: '4-8字，有特色' },
            plan_theme: { type: 'string', description: '主題描述（一句話）' },
            estimated_cost: { type: 'string' },
            highlights: { type: 'array', minItems: 3, items: { type: 'string' } },
            days: {
              type: 'array',
              items: {
                type: 'object',
                additionalProperties: false,
                required: ['day', 'title', 'morning', 'afternoon', 'evening', 'meal_recommendations', 'estimated_daily_cost'],
                properties: {
                  day: { type: 'integer' },
                  title: { type: 'string' },
                  morning: {
                    type: 'object',
                    additionalProperties: false,
                    required: ['activity', 'location', 'tip'],
                    properties: {
                      activity: { type: 'string' },
                      location: { type: 'string' },
                      tip: { type: 'string' }
                    }
                  },
                  afternoon: {
                    type: 'object',
                    additionalProperties: false,
                    required: ['activity', 'location', 'tip'],
                    properties: {
                      activity: { type: 'string' },
                      location: { type: 'string' },
                      tip: { type: 'string' }
                    }
                  },
                  evening: {
                    type: 'object',
                    additionalProperties: false,
                    required: ['activity', 'location', 'tip'],
                    properties: {
                      activity: { type: 'string' },
                      location: { type: 'string' },
                      tip: { type: 'string' }
                    }
                  },
                  meal_recommendations: { type: 'array', items: { type: 'string' } },
                  estimated_daily_cost: { type: 'string' }
                }
              }
            },
            packing_tips: { type: 'array', items: { type: 'string' } },
            best_season: { type: 'string' }
          }
        }
      }
    }
  }
};

export function buildTravelPrompt(input) {
  return `你是一位專業旅遊規劃師。請根據以下條件產出 3 個風格明顯不同、可真實選擇的旅遊行程方案，並使用台灣繁體中文。

使用者輸入：
- 目的地：${input.destination}
- 天數：${input.days} 天
- 預算：${input.budget}（台幣，含機票）
- 旅遊風格：${input.styles.join('、')}
- 同行人數：${input.group}
- 特殊需求：${input.notes || '無'}

規則：
1. 必須剛好輸出 3 個 plans，plan_id 依序為 A、B、C。
2. 三個方案風格要有明顯差異，例如：深度文化、輕鬆休閒、冒險探索；但仍需符合使用者選擇的旅遊風格。
3. 每個方案的 days 陣列必須剛好有 ${input.days} 天，day 從 1 到 ${input.days}。
4. 預算為台幣且含機票，請讓 estimated_cost 與 estimated_daily_cost 合理可執行。
5. plan_name 需 4-8 字、有特色。
6. 不要加入 schema 以外欄位。`;
}
