import React, { useMemo, useState } from 'react';
import { generateAndSave, generatePlans, savePlans } from './api.js';

const styleOptions = ['美食探索', '文化歷史', '自然景觀', '親子友善', '購物休閒', '冒險探索', '奢華度假', '背包省錢'];

const initialForm = {
  destination: '',
  days: 5,
  budget: '',
  styles: ['美食探索', '文化歷史'],
  group: 2,
  notes: '',
  notionDatabaseId: '',
  writeToNotion: true
};

function Checkbox({ label, checked, onChange }) {
  return (
    <label className="chip">
      <input type="checkbox" checked={checked} onChange={onChange} />
      <span>{label}</span>
    </label>
  );
}

function PlanCard({ plan }) {
  return (
    <article className="plan-card">
      <div className="plan-card__header">
        <span className="badge">方案 {plan.plan_id}</span>
        <div>
          <h3>{plan.plan_name}</h3>
          <p>{plan.plan_theme}</p>
        </div>
      </div>
      <p className="cost">{plan.estimated_cost}</p>
      <ul className="highlights">
        {plan.highlights.map((highlight) => <li key={highlight}>{highlight}</li>)}
      </ul>
      <details>
        <summary>查看每日行程 JSON 摘要</summary>
        <pre>{JSON.stringify(plan.days, null, 2)}</pre>
      </details>
    </article>
  );
}

export default function App() {
  const [form, setForm] = useState(initialForm);
  const [plans, setPlans] = useState([]);
  const [notionPages, setNotionPages] = useState([]);
  const [status, setStatus] = useState({ type: 'idle', message: '' });

  const input = useMemo(() => ({
    destination: form.destination,
    days: Number(form.days),
    budget: form.budget,
    styles: form.styles,
    group: Number(form.group),
    notes: form.notes
  }), [form]);

  const update = (field) => (event) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const toggleStyle = (style) => {
    setForm((prev) => ({
      ...prev,
      styles: prev.styles.includes(style)
        ? prev.styles.filter((item) => item !== style)
        : [...prev.styles, style]
    }));
  };

  async function handleGenerate(event) {
    event.preventDefault();
    setStatus({ type: 'loading', message: form.writeToNotion ? '正在請 Claude 規劃並寫入 Notion…' : '正在請 Claude 產生行程 JSON…' });
    setNotionPages([]);
    try {
      const result = form.writeToNotion
        ? await generateAndSave({ notionDatabaseId: form.notionDatabaseId, input })
        : await generatePlans(input);
      setPlans(result.plans);
      setNotionPages(result.notion_pages || []);
      setStatus({ type: 'success', message: form.writeToNotion ? '已完成行程產生並寫入 Notion。' : '已產生 3 個行程方案。' });
    } catch (error) {
      setStatus({ type: 'error', message: error.message });
    }
  }

  async function handleSaveOnly() {
    setStatus({ type: 'loading', message: '正在將目前 JSON 寫入 Notion…' });
    try {
      const result = await savePlans({ notionDatabaseId: form.notionDatabaseId, input, plans });
      setNotionPages(result.notion_pages || []);
      setStatus({ type: 'success', message: '已將目前 3 個方案寫入 Notion。' });
    } catch (error) {
      setStatus({ type: 'error', message: error.message });
    }
  }

  return (
    <main className="app-shell">
      <section className="hero">
        <p className="eyebrow">Claude API × Notion Database</p>
        <h1>旅遊行程 JSON 規劃器</h1>
        <p>讓實際操作者輸入目的地、預算與偏好，由 Claude 產出 3 種風格不同的完整行程，並一鍵建立 Notion Page。</p>
      </section>

      <section className="workspace">
        <form className="panel form-panel" onSubmit={handleGenerate}>
          <div className="form-grid">
            <label>
              目的地
              <input required value={form.destination} onChange={update('destination')} placeholder="例如：京都、大阪、冰島" />
            </label>
            <label>
              天數
              <input required min="1" max="30" type="number" value={form.days} onChange={update('days')} />
            </label>
            <label>
              預算（台幣，含機票）
              <input required value={form.budget} onChange={update('budget')} placeholder="例如：每人 60000、總預算 180000" />
            </label>
            <label>
              同行人數
              <input required min="1" max="50" type="number" value={form.group} onChange={update('group')} />
            </label>
          </div>

          <fieldset>
            <legend>旅遊風格</legend>
            <div className="chip-row">
              {styleOptions.map((style) => (
                <Checkbox key={style} label={style} checked={form.styles.includes(style)} onChange={() => toggleStyle(style)} />
              ))}
            </div>
          </fieldset>

          <label>
            特殊需求
            <textarea value={form.notes} onChange={update('notes')} placeholder="例如：長輩同行、不要紅眼班機、需素食、每天不要超過 2 萬步" />
          </label>

          <label>
            Notion Database ID
            <input value={form.notionDatabaseId} onChange={update('notionDatabaseId')} placeholder="可貼上 database id；若只產生 JSON 可留空" />
          </label>

          <label className="switch">
            <input type="checkbox" checked={form.writeToNotion} onChange={update('writeToNotion')} />
            <span>產生後立即寫入 Notion（每個方案建立一個 Page）</span>
          </label>

          <div className="actions">
            <button type="submit" disabled={status.type === 'loading'}>{form.writeToNotion ? '產生並寫入 Notion' : '只產生 JSON'}</button>
            <button type="button" className="secondary" disabled={!plans.length || !form.notionDatabaseId || status.type === 'loading'} onClick={handleSaveOnly}>將目前 JSON 寫入 Notion</button>
          </div>
          {status.message && <p className={`status ${status.type}`}>{status.message}</p>}
        </form>

        <section className="panel result-panel">
          <div className="result-header">
            <h2>產出結果</h2>
            <span>{plans.length ? `${plans.length} 個方案` : '尚未產生'}</span>
          </div>

          {notionPages.length > 0 && (
            <div className="notion-links">
              <h3>Notion Pages</h3>
              {notionPages.map((page) => (
                <a key={page.notion_page_id} href={page.notion_page_url} target="_blank" rel="noreferrer">方案 {page.plan_id}：{page.notion_page_id}</a>
              ))}
            </div>
          )}

          <div className="cards">
            {plans.map((plan) => <PlanCard key={plan.plan_id} plan={plan} />)}
          </div>

          {plans.length > 0 && (
            <details className="json-box" open>
              <summary>完整 JSON</summary>
              <pre>{JSON.stringify({ plans }, null, 2)}</pre>
            </details>
          )}
        </section>
      </section>
    </main>
  );
}
