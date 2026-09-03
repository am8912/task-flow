# Task Flow — Web

依照 `taskflow-mockup.html` 打造的輕量任務管理介面。這是**第一版**：提供可運作的
介面，包含側邊欄導航、light/dark 主題切換，以及以假資料驅動的互動式任務清單。
資料層的設計已預留替換空間，之後可用最少的改動接上 **Spring Boot REST API**。

## 技術棧

| 面向       | 選用                                              |
| ---------- | ------------------------------------------------- |
| 建置工具   | Vite 8                                            |
| UI 函式庫  | React 19 + TypeScript 6                           |
| 樣式       | Tailwind CSS v4（`@tailwindcss/vite`，無設定檔）  |
| 元件       | shadcn/ui（new-york 風格）                        |
| 圖示       | `@tabler/icons-react`                             |
| 路由       | React Router（`react-router-dom`）               |
| HTTP 用戶端| Axios（`src/services/api.ts`）                   |
| Lint       | ESLint + typescript-eslint                        |

## 環境需求

- Node.js 18 以上與 npm

## 開始開發

```bash
npm install        # 安裝相依套件
npm run dev        # 啟動開發伺服器（http://localhost:5173），支援 HMR
```

### 所有指令

```bash
npm run dev        # 開發伺服器，支援熱模組替換（HMR）
npm run build      # 先型別檢查（tsc -b）再打包至 dist/
npm run lint       # 對整個專案執行 ESLint
npm run preview    # 在本機預覽 production build
```

> 目前尚未設定測試工具（test runner）。

## 專案資料夾結構

專案依照「職責」分類組織。**各類檔案該放哪：**

```
task-flow-web/
├── public/                 # 靜態資源，於 / 路徑提供（favicon、icons）
├── index.html              # HTML 進入點；掛載 #root
├── components.json         # shadcn/ui 設定（供 `npx shadcn add ...` 使用）
├── vite.config.ts          # Vite 設定：@/ 別名 + /api 開發代理（proxy）
└── src/
    ├── main.tsx            # React 進入點 — 以 providers 包住 <App>
    ├── App.tsx             # React Router 路由與版面組合
    ├── index.css           # Tailwind 匯入 + 主題 tokens（light/dark）
    │
    ├── components/
    │   ├── ui/             # shadcn/ui 基礎元件 — 請勿手動修改；
    │   │                   #   以 `npx shadcn add <name>` 重新產生
    │   ├── layout/         # 應用外框：AppLayout、Sidebar、Topbar、PageContent
    │   └── tasks/          # 任務領域 UI：TaskItem、TaskSection、
    │                       #   CategoryBadge、ProgressCard
    │
    ├── pages/              # 每個路由一個元件（以 default export 匯出）
    │                       #   TodayPage、AllTasksPage、CompletedPage、CategoryPage
    │
    ├── context/           # React context providers 與 hooks
    │                       #   ThemeProvider / theme-context（light/dark）
    │                       #   TasksProvider / tasks-context（任務狀態）
    │
    ├── services/          # Axios 實例與 API 呼叫（api.ts）→ Spring Boot
    ├── data/              # mockTasks.ts — 種子假資料，之後由 API 取代
    ├── types/             # 共用 TypeScript 型別（Task、Category…）
    └── lib/               # 純函式工具：utils.ts（cn）、date.ts、tasks.ts（選取器）
```

### 慣例

- **路徑別名：** 以 `@/…` 匯入，取代冗長的相對路徑
  （於 `vite.config.ts` 與 `tsconfig.app.json` 設定）。
- **shadcn/ui：** 用 `npx shadcn add <component>` 新增基礎元件，檔案會產生在
  `src/components/ui/`。該資料夾已從 `react-refresh/only-export-components`
  這條 lint 規則排除，因為產生的檔案會同時匯出 variant 輔助函式。
- **Context 拆分：** React context 物件與其 `use*` hook 放在 `*-context.ts`，
  provider 元件則放在 `*Provider.tsx`。這是為了讓 Fast Refresh 正常運作
  （一個檔案只能匯出元件）。
- **TypeScript 嚴格度：** `tsconfig.app.json` 啟用了 `noUnusedLocals`、
  `noUnusedParameters` 與 `erasableSyntaxOnly`。請移除未使用的符號，而非用 `_`
  前綴；並避免只存在於執行期的 TS 語法（例如 `enum`）。

## 路由

| 路徑                   | 頁面            | 顯示內容                               |
| ---------------------- | --------------- | -------------------------------------- |
| `/`                    | TodayPage       | 今日到期／逾期 + 今日已完成            |
| `/all`                 | AllTasksPage    | 全部任務，分為未完成／已完成          |
| `/completed`           | CompletedPage   | 已完成任務                            |
| `/category/:category`  | CategoryPage    | `learning` \| `work` \| `personal`     |

未知路徑與無效分類都會導回 `/`。側邊欄使用 `NavLink`，因此會自動標示目前路由，
徽章數字（badge counts）也會依任務清單即時計算。

## 主題（Theming）

light/dark 的 tokens 以 CSS 變數定義在 `src/index.css`（移植自 mockup），並透過
`@theme inline` 暴露給 Tailwind 使用。Dark mode 是在 `<html>` 加上 `.dark` class
來切換；`ThemeProvider` 負責管理這個狀態，並將選擇保存到 `localStorage`。

## 接上 Spring Boot 後端（下一步）

資料層已預先設計好，方便日後替換：

1. `src/services/api.ts` 匯出一個已設定好的 Axios 實例，`baseURL: "/api"`。
2. `vite.config.ts` 在開發時將 `/api` 代理（proxy）至 `http://localhost:8080`，
   因此開發階段不需處理 CORS。
3. 將 `src/context/TasksProvider.tsx` 中的假資料種子替換為實際呼叫，例如
   `api.get<Task[]>("/tasks")`（參見該檔的 `TODO(api)` 註解）。`src/types/` 中的
   `Task` 型別即是用來對應後端的 JSON 結構。

### 與 Spring Boot 一起部署

```bash
npm run build
# 將 dist/ 內的內容複製到後端的
# src/main/resources/static/ — Spring Boot 會自動提供這些靜態檔案。
```

在 production 環境中，前後端共用同一個 origin，因此不需要 `/api` 代理。
