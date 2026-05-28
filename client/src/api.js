const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001';

async function requestJson(path, payload) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.ok === false) {
    throw new Error(data.message || data.error || '請求失敗');
  }
  return data;
}

export function generatePlans(input) {
  return requestJson('/api/trips/generate', input);
}

export function savePlans({ notionDatabaseId, input, plans }) {
  return requestJson('/api/trips/save', { notionDatabaseId, input, plans });
}

export function generateAndSave({ notionDatabaseId, input }) {
  return requestJson('/api/trips/generate-and-save', { notionDatabaseId, input });
}
