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

export function refinePlan({ plan, feedback, input }) {
  return requestJson('/api/trips/refine', { plan, feedback, input });
}

export function generatePlansStream(input, { onProgress, onDone, onError }) {
  fetch(`${API_BASE}/api/trips/generate-stream`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input)
  }).then(async (res) => {
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n\n');
      buffer = lines.pop();
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        try {
          const event = JSON.parse(line.slice(6));
          if (event.type === 'progress') onProgress?.(event.message);
          else if (event.type === 'done') onDone?.(event.plans);
          else if (event.type === 'error') onError?.(new Error(event.message));
        } catch {}
      }
    }
  }).catch(onError);
}
