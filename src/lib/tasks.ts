import type { Task } from "@/types"
import { isDone } from "@/types"
import { isOverdue, isToday } from "@/lib/date"

/** Unfinished tasks that need attention today (due today or overdue). */
export function inProgressToday(tasks: Task[]): Task[] {
  return tasks.filter(
    (t) => !isDone(t) && (isToday(t.dueDate) || isOverdue(t.dueDate))
  )
}

/** Tasks marked complete today. */
export function doneToday(tasks: Task[]): Task[] {
  return tasks.filter((t) => isDone(t) && isToday(t.completedAt))
}

export interface SidebarCounts {
  today: number
  all: number
  completed: number
  byCategory: Record<string, number>
}

/** Derive every badge count shown in the sidebar from the task list. */
export function computeCounts(tasks: Task[]): SidebarCounts {
  const byCategory: Record<string, number> = {
    learning: 0,
    work: 0,
    personal: 0,
  }
  for (const t of tasks) {
    byCategory[t.category] = (byCategory[t.category] ?? 0) + 1
  }

  return {
    today: tasks.filter((t) => !isDone(t) && isToday(t.dueDate)).length,
    all: tasks.length,
    completed: tasks.filter((t) => isDone(t)).length,
    byCategory,
  }
}
