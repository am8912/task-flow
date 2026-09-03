import type { CategoryMeta, Task } from "@/types"
import { addDaysISO } from "@/lib/date"

/** Category display metadata, in sidebar order. */
export const CATEGORIES: CategoryMeta[] = [
  { key: "learning", label: "Learning" },
  { key: "work", label: "Work" },
  { key: "personal", label: "Personal" },
]

export const CATEGORY_LABEL: Record<string, string> = {
  learning: "Learning",
  work: "Work",
  personal: "Personal",
  reading: "Reading",
  health: "Health",
}

export function toCategoryKey(name: string | null | undefined): string {
  return (name ?? "uncategorized").trim().toLowerCase().replace(/\s+/g, "-")
}

export function formatCategoryLabel(category: string | null | undefined): string {
  const key = toCategoryKey(category)
  if (CATEGORY_LABEL[key]) return CATEGORY_LABEL[key]
  return key
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ") || "Uncategorized"
}

const now = new Date().toISOString()

function mockTask(
  partial: Pick<Task, "taskId" | "categoryId" | "category" | "statusCode" | "taskTitle"> &
    Partial<Pick<Task, "dueDate" | "completedAt">>
): Task {
  return {
    planId: null,
    description: null,
    priorityId: 3,
    plannedDate: null,
    deletedAt: null,
    createdAt: now,
    updatedAt: now,
    dueDate: null,
    completedAt: null,
    ...partial,
  }
}

export const mockTasks: Task[] = [
  mockTask({ taskId: 1, categoryId: 1, category: "learning", statusCode: "TODO", taskTitle: "閱讀 React Router 官方文件", dueDate: addDaysISO(0) }),
  mockTask({ taskId: 2, categoryId: 1, category: "learning", statusCode: "TODO", taskTitle: "TypeScript 泛型練習", dueDate: addDaysISO(-1) }),
  mockTask({ taskId: 3, categoryId: 1, category: "learning", statusCode: "TODO", taskTitle: "觀看 Tailwind v4 教學影片", dueDate: addDaysISO(0) }),
  mockTask({ taskId: 4, categoryId: 1, category: "learning", statusCode: "DONE", taskTitle: "完成 LeetCode 每日一題", dueDate: addDaysISO(-1), completedAt: addDaysISO(-1) }),
  mockTask({ taskId: 5, categoryId: 1, category: "learning", statusCode: "DONE", taskTitle: "複習 SQL JOIN 語法", dueDate: addDaysISO(-2), completedAt: addDaysISO(-2) }),
  mockTask({ taskId: 6, categoryId: 2, category: "work", statusCode: "TODO", taskTitle: "完成 Spring Boot REST API 初稿", dueDate: addDaysISO(0) }),
  mockTask({ taskId: 7, categoryId: 2, category: "work", statusCode: "DONE", taskTitle: "建立 Vite 專案空殼", dueDate: addDaysISO(0), completedAt: addDaysISO(0) }),
  mockTask({ taskId: 8, categoryId: 2, category: "work", statusCode: "TODO", taskTitle: "撰寫 API 規格文件", dueDate: addDaysISO(4) }),
  mockTask({ taskId: 9, categoryId: 2, category: "work", statusCode: "TODO", taskTitle: "Code review PR #42", dueDate: addDaysISO(1) }),
  mockTask({ taskId: 10, categoryId: 3, category: "personal", statusCode: "DONE", taskTitle: "安裝 shadcn/ui 元件庫", dueDate: addDaysISO(0), completedAt: addDaysISO(0) }),
  mockTask({ taskId: 11, categoryId: 3, category: "personal", statusCode: "TODO", taskTitle: "預約牙醫", dueDate: addDaysISO(0) }),
  mockTask({ taskId: 12, categoryId: 3, category: "personal", statusCode: "TODO", taskTitle: "整理桌面與備份檔案", dueDate: addDaysISO(6) }),
]
