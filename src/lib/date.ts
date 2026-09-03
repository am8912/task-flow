/** Date helpers for due-date labelling. All dates are handled as local
 *  `YYYY-MM-DD` strings so they stay stable regardless of timezone. */

/** Format a Date as a local `YYYY-MM-DD` string. */
export function toISODate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

/** Today's local date as `YYYY-MM-DD`. */
export function todayISO(): string {
  return toISODate(new Date())
}

/** `YYYY-MM-DD` for today shifted by `days` (negative = past). */
export function addDaysISO(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return toISODate(d)
}

/** Extract YYYY-MM-DD from either "YYYY-MM-DD" or "YYYY-MM-DDTHH:mm:ss". */
export function toDateOnly(iso: string): string {
  return iso.substring(0, 10)
}

/** Whole-day difference between an ISO date and today (positive = future). */
export function daysFromToday(iso: string): number {
  const start = new Date(todayISO() + "T00:00:00")
  const dateOnly = toDateOnly(iso)
  const target = new Date(dateOnly + "T00:00:00")
  return Math.round((target.getTime() - start.getTime()) / 86_400_000)
}

export function isToday(iso: string | null): boolean {
  return iso !== null && daysFromToday(iso) === 0
}

/** A task is overdue when its due date is in the past. */
export function isOverdue(iso: string | null): boolean {
  return iso !== null && daysFromToday(iso) < 0
}

export interface DueLabel {
  text: string
  overdue: boolean
}

/** Human-friendly due label, e.g. "Today", "Yesterday", "Jun 18". */
export function formatDueLabel(task: {
  dueDate: string | null
  statusCode: string
}): DueLabel | null {
  if (task.statusCode === "DONE") return { text: "Done", overdue: false }
  if (!task.dueDate) return null

  const diff = daysFromToday(task.dueDate)
  if (diff === 0) return { text: "Today", overdue: false }
  if (diff === 1) return { text: "Tomorrow", overdue: false }
  if (diff === -1) return { text: "Yesterday", overdue: true }

  const dateOnly = toDateOnly(task.dueDate)
  const d = new Date(dateOnly + "T00:00:00")
  const text = d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
  return { text, overdue: diff < 0 }
}

/** Long title-bar date, e.g. "Sun, Jun 14". */
export function formatToday(): string {
  return new Date().toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  })
}
