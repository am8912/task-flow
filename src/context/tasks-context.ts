import { createContext, useContext } from "react"
import type { Task } from "@/types"

export interface CreateTaskPayload {
  taskTitle: string
  categoryId: number
  category: string
  dueDate: string | null
}

export type UpdateTaskPayload = Partial<
  Pick<
    Task,
    | "taskTitle"
    | "description"
    | "categoryId"
    | "category"
    | "dueDate"
    | "plannedDate"
    | "priorityId"
    | "statusCode"
  >
>

export interface TasksContextValue {
  tasks: Task[]
  toggleTask: (id: number) => Promise<void>
  addTask: (payload: CreateTaskPayload) => Promise<void>
  updateTask: (id: number, payload: UpdateTaskPayload) => Promise<void>
  updateTaskCategory: (id: number, categoryId: number) => Promise<void>
  updateTaskNote: (id: number, description: string | null) => Promise<void>
  deleteTask: (id: number) => Promise<void>
}

export const TasksContext = createContext<TasksContextValue | undefined>(
  undefined
)

/** Access the task list and mutators. Must be inside <TasksProvider>. */
export function useTasks(): TasksContextValue {
  const ctx = useContext(TasksContext)
  if (!ctx) throw new Error("useTasks must be used within a TasksProvider")
  return ctx
}
