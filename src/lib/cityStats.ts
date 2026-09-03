import type { Task } from "@/types"
import { isDone } from "@/types"
import { isOverdue, isToday } from "@/lib/date"
import type { CityStats } from "@/components/city/cityEngine"

/**
 * Fake seed values for the city, matching the design component's defaults.
 * Used until the task list loads (or when running without an API).
 */
export const MOCK_CITY_STATS: CityStats = {
  completedTasksToday: 12,
  pendingTasks: 20,
  overdueTasks: 3,
  newTasksToday: 5,
}

/** Per-metric slider bounds / normalisation denominators. */
export type CityStatMax = Record<keyof CityStats, number>

/** Default bounds — mirrors the design component's `min`/`max`. */
export const CITY_STAT_MAX: CityStatMax = {
  completedTasksToday: 20, // 會被覆蓋掉，實際沒用
  pendingTasks: 10,
  overdueTasks: 6,
  newTasksToday: 6,
}

/**
 * Live bounds derived from the task list. `completedTasksToday`'s max is the
 * total of today's workload (done today + still-due today), so the city's
 * growth ratio (`completed / max`) equals today's completion rate. The other
 * metrics keep their fixed design bounds.
 */
export function deriveCityStatMax(tasks: Task[]): CityStatMax {
  const completedToday = tasks.filter((t) => isDone(t) && isToday(t.completedAt)).length
  const remainingToday = tasks.filter(
    (t) => !isDone(t) && (isToday(t.dueDate) || isOverdue(t.dueDate))
  ).length
  return {
    ...CITY_STAT_MAX,
    completedTasksToday: Math.max(1, completedToday + remainingToday),
  }
}

/** Project the live task list onto the four metrics the city renders. */
export function deriveCityStats(tasks: Task[]): CityStats {
  return {
    completedTasksToday: tasks.filter((t) => isDone(t) && isToday(t.completedAt)).length,
    pendingTasks: tasks.filter((t) => !isDone(t)).length,
    overdueTasks: tasks.filter((t) => !isDone(t) && isOverdue(t.dueDate)).length,
    newTasksToday: tasks.filter((t) => isToday(t.createdAt)).length,
  }
}
