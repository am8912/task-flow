/** Task categories are backend-driven. The sidebar still highlights the core three. */
export type Category = string

/** Maps 1:1 onto the Spring Boot Task entity JSON response. */
export interface Task {
  taskId: number
  planId: number | null
  categoryId: number
  /** UI-only display key resolved from categories.categoryName when needed. */
  category: Category
  statusCode: string
  taskTitle: string
  description: string | null
  priorityId: number
  plannedDate: string | null
  dueDate: string | null
  completedAt: string | null
  deletedAt: string | null
  createdAt: string
  updatedAt: string
}

export function isDone(task: Task): boolean {
  return task.statusCode === "DONE"
}

/** Metadata describing a category for rendering (label, accent colour). */
export interface CategoryMeta {
  key: Category
  label: string
}
