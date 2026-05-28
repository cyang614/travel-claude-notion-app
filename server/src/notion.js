import { Client } from '@notionhq/client';

const notionVersion = '2022-06-28';

const richText = (content) => content ? [{ type: 'text', text: { content: String(content).slice(0, 2000) } }] : [];

function planTitle(input, plan) {
  return `${input.destination} ${input.days}天 — ${plan.plan_name}`;
}

function buildPlanProperties(input, plan) {
  const titleProperty = process.env.NOTION_TITLE_PROPERTY || 'Title';
  return {
    [titleProperty]: { title: richText(planTitle(input, plan)) },
    '目的地': { select: { name: input.destination } },
    '天數': { number: Number(input.days) },
    '預算範圍': { rich_text: richText(input.budget) },
    '旅遊風格': { multi_select: input.styles.map((style) => ({ name: style })) },
    '預估花費': { rich_text: richText(plan.estimated_cost) },
    '建立日期': { date: { start: new Date().toISOString().slice(0, 10) } },
    '狀態': { select: { name: '已規劃' } }
  };
}

export function buildPlanBlocks(plan) {
  const blocks = [
    { object: 'block', type: 'heading_1', heading_1: { rich_text: richText(plan.plan_theme) } },
    { object: 'block', type: 'callout', callout: { icon: { type: 'emoji', emoji: '✈️' }, rich_text: richText(plan.highlights.join('\n')) } },
    { object: 'block', type: 'divider', divider: {} }
  ];

  for (const day of plan.days) {
    blocks.push(
      { object: 'block', type: 'heading_2', heading_2: { rich_text: richText(`Day ${day.day}：${day.title}`) } },
      { object: 'block', type: 'bulleted_list_item', bulleted_list_item: { rich_text: richText(`🌅 上午｜${day.morning.activity}｜${day.morning.location}`) } },
      { object: 'block', type: 'bulleted_list_item', bulleted_list_item: { rich_text: richText(`☀️ 下午｜${day.afternoon.activity}｜${day.afternoon.location}`) } },
      { object: 'block', type: 'bulleted_list_item', bulleted_list_item: { rich_text: richText(`🌙 晚上｜${day.evening.activity}｜${day.evening.location}`) } },
      { object: 'block', type: 'quote', quote: { rich_text: richText(`🍜 今日推薦：${day.meal_recommendations.join('、')}`) } }
    );
  }

  blocks.push(
    { object: 'block', type: 'divider', divider: {} },
    { object: 'block', type: 'heading_2', heading_2: { rich_text: richText('打包清單') } },
    ...plan.packing_tips.map((tip) => ({ object: 'block', type: 'to_do', to_do: { rich_text: richText(tip), checked: false } })),
    { object: 'block', type: 'callout', callout: { icon: { type: 'emoji', emoji: '🗓️' }, rich_text: richText(`最佳出發季節：${plan.best_season}`) } }
  );

  return blocks;
}

async function appendBlocksInChunks(notion, blockId, blocks) {
  for (let i = 0; i < blocks.length; i += 90) {
    await notion.blocks.children.append({ block_id: blockId, children: blocks.slice(i, i + 90) });
  }
}

export async function savePlanToNotion({ notionDatabaseId, input, plan, notionClient }) {
  const token = process.env.NOTION_TOKEN || process.env.NOTION_API_KEY;
  if (!notionClient && !token) throw new Error('Missing NOTION_TOKEN');

  const notion = notionClient || new Client({ auth: token, notionVersion });
  const page = await notion.pages.create({
    parent: { database_id: notionDatabaseId },
    properties: buildPlanProperties(input, plan)
  });

  await appendBlocksInChunks(notion, page.id, buildPlanBlocks(plan));

  return {
    plan_id: plan.plan_id,
    notion_page_id: page.id,
    notion_page_url: page.url
  };
}

export async function savePlansToNotion({ notionDatabaseId, input, plans, notionClient }) {
  const pages = [];
  for (const plan of plans) {
    pages.push(await savePlanToNotion({ notionDatabaseId, input, plan, notionClient }));
  }
  return pages;
}
