# Claude 旅遊行程 Notion 規劃器

這是一個 Node/Express + React Web App，讓實際操作者輸入旅遊條件，透過 Claude API 產出 3 個風格不同的完整旅遊行程 JSON，並可將每個方案建立為 Notion database 裡的一個新 Page。

## 功能

- 表單輸入：目的地、天數、預算、旅遊風格、同行人數、特殊需求、Notion Database ID
- Claude 使用 tool use / structured output 產出固定 JSON schema
- 可只產生 JSON，也可「產生後立即寫入 Notion」
- 寫入 Notion 時每個方案建立一個 Page，包含：
  - Page properties：Title、目的地、天數、預算範圍、旅遊風格、預估花費、建立日期、狀態
  - Page content：方案主題、亮點、每日行程、餐食推薦、打包清單、最佳季節
- 前端可預覽方案卡片、完整 JSON、Notion Page 連結

## Notion database 欄位需求

請先在 Notion 建立 database，並分享給你的 Notion integration。欄位需包含：

| 欄位名稱 | 型別 |
| --- | --- |
| Title | Title |
| 目的地 | Select |
| 天數 | Number |
| 預算範圍 | Rich text |
| 旅遊風格 | Multi-select |
| 預估花費 | Rich text |
| 建立日期 | Date |
| 狀態 | Select |

> 如果你的標題欄位叫 `Name` 而不是 `Title`，請在 `.env` 設定 `NOTION_TITLE_PROPERTY=Name`。

## 安裝

```bash
cd /home/rickyyang/workspace/travel-claude-notion-app
npm install
cp .env.example .env
```

編輯 `.env`：

```env
ANTHROPIC_API_KEY=sk-ant-your-key
NOTION_TOKEN=ntn_or_secret_your_notion_token
ANTHROPIC_MODEL=claude-sonnet-4-20250514
PORT=3001
CLIENT_ORIGIN=http://localhost:5173
NOTION_TITLE_PROPERTY=Title
```

## 開發啟動

```bash
npm run dev
```

- 前端：http://localhost:5173
- 後端：http://localhost:3001

## 測試與建置

```bash
npm test
npm run build
```

## API

### `POST /api/trips/generate`

只產生 JSON。

### `POST /api/trips/save`

將目前 JSON 寫入 Notion。

### `POST /api/trips/generate-and-save`

先請 Claude 產生 JSON，再將 3 個方案寫入 Notion。

成功寫入時回傳：

```json
{
  "ok": true,
  "notion_pages": [
    {
      "plan_id": "A",
      "notion_page_id": "...",
      "notion_page_url": "..."
    }
  ]
}
```

## 安全注意

- 不要提交 `.env`
- 不要把 Anthropic 或 Notion token 貼在前端程式碼
- API token 只在 server 端透過環境變數讀取
