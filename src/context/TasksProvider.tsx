import { useMemo, type ReactNode } from "react"
import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query"
import {
  TasksContext,
  type CreateTaskPayload,
  type UpdateTaskPayload,
} from "@/context/tasks-context"
import type { Task } from "@/types"
import { isDone } from "@/types"
import { toCategoryKey } from "@/data/mockTasks"
import api from "@/services/api"

interface CategoryResp {
  categoryId: number
  categoryName: string
}

const TASKS_KEY = ["tasks"] as const
const CATEGORIES_KEY = ["categories"] as const

function normalizeTask(task: Task, categories: CategoryResp[]): Task {
  const category = task.category
    ? toCategoryKey(task.category)
    : toCategoryKey(
        categories.find((c) => c.categoryId === task.categoryId)?.categoryName
      )

  return { ...task, category }
}

/**
 * Snapshot the cached task list and apply an optimistic edit. The snapshot
 * flows back through `onError` so a failed request can be rolled back.
 */
async function patchTasksCache(
  queryClient: QueryClient,
  updater: (tasks: Task[]) => Task[]
) {
  await queryClient.cancelQueries({ queryKey: TASKS_KEY })
  const previous = queryClient.getQueryData<Task[]>(TASKS_KEY)
  queryClient.setQueryData<Task[]>(TASKS_KEY, (old) => updater(old ?? []))
  return { previous }
}

function rollbackTasksCache(
  queryClient: QueryClient,
  context: { previous?: Task[] } | undefined
) {
  if (context?.previous) queryClient.setQueryData(TASKS_KEY, context.previous)
}

export function TasksProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()

  const { data: categories = [] } = useQuery({
    queryKey: CATEGORIES_KEY,
    queryFn: async () =>
      (await api.get("/categories")).data.data as CategoryResp[],
  })

  const { data: rawTasks = [] } = useQuery({
    queryKey: TASKS_KEY,
    queryFn: async () => (await api.get("/tasks")).data.data as Task[],
  })

  // Re-derived on every render from whatever's in the cache, so every
  // consumer (including optimistic edits) sees the same normalized list.
  const tasks = useMemo(
    () => rawTasks.map((task) => normalizeTask(task, categories)),
    [rawTasks, categories]
  )

  const toggleMutation = useMutation({
    mutationFn: async (id: number) =>
      (await api.patch(`/tasks/${id}/toggle`)).data.data as Task,
    onMutate: (id) =>
      patchTasksCache(queryClient, (old) =>
        old.map((t) =>
          t.taskId !== id
            ? t
            : {
                ...t,
                statusCode: isDone(t) ? "TODO" : "DONE",
                completedAt: isDone(t) ? null : new Date().toISOString(),
              }
        )
      ),
    onError: (_err, _id, ctx) => rollbackTasksCache(queryClient, ctx),
    onSettled: () => queryClient.invalidateQueries({ queryKey: TASKS_KEY }),
  })

  const addMutation = useMutation({
    mutationFn: async (payload: CreateTaskPayload) =>
      (await api.post("/tasks", payload)).data.data as Task,
    onMutate: (payload) => {
      const optimisticTask: Task = {
        taskId: -Date.now(),
        planId: null,
        categoryId: payload.categoryId,
        category: payload.category,
        statusCode: "TODO",
        taskTitle: payload.taskTitle,
        description: null,
        priorityId: 0,
        plannedDate: null,
        dueDate: payload.dueDate,
        completedAt: null,
        deletedAt: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      return patchTasksCache(queryClient, (old) => [optimisticTask, ...old])
    },
    onError: (_err, _payload, ctx) => rollbackTasksCache(queryClient, ctx),
    onSettled: () => queryClient.invalidateQueries({ queryKey: TASKS_KEY }),
  })

  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: number
      payload: UpdateTaskPayload
    }) => (await api.patch(`/tasks/${id}`, payload)).data.data as Task,
    onMutate: ({ id, payload }) =>
      patchTasksCache(queryClient, (old) =>
        old.map((t) => (t.taskId === id ? { ...t, ...payload } : t))
      ),
    onError: (_err, _vars, ctx) => rollbackTasksCache(queryClient, ctx),
    onSettled: () => queryClient.invalidateQueries({ queryKey: TASKS_KEY }),
  })

  const updateCategoryMutation = useMutation({
    mutationFn: async ({
      id,
      categoryId,
    }: {
      id: number
      categoryId: number
    }) =>
      (await api.patch(`/tasks/${id}/category`, { categoryId })).data
        .data as Task,
    onMutate: ({ id, categoryId }) => {
      const categoryName = categories.find(
        (c) => c.categoryId === categoryId
      )?.categoryName
      return patchTasksCache(queryClient, (old) =>
        old.map((t) =>
          t.taskId === id
            ? { ...t, categoryId, category: toCategoryKey(categoryName) }
            : t
        )
      )
    },
    onError: (_err, _vars, ctx) => rollbackTasksCache(queryClient, ctx),
    onSettled: () => queryClient.invalidateQueries({ queryKey: TASKS_KEY }),
  })

  const updateNoteMutation = useMutation({
    mutationFn: async ({
      id,
      description,
    }: {
      id: number
      description: string | null
    }) =>
      (await api.patch(`/tasks/${id}/note`, { description })).data
        .data as Task,
    onMutate: ({ id, description }) =>
      patchTasksCache(queryClient, (old) =>
        old.map((t) => (t.taskId === id ? { ...t, description } : t))
      ),
    onError: (_err, _vars, ctx) => rollbackTasksCache(queryClient, ctx),
    onSettled: () => queryClient.invalidateQueries({ queryKey: TASKS_KEY }),
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/tasks/${id}`)
    },
    onMutate: (id) =>
      patchTasksCache(queryClient, (old) =>
        old.filter((t) => t.taskId !== id)
      ),
    onError: (_err, _id, ctx) => rollbackTasksCache(queryClient, ctx),
    onSettled: () => queryClient.invalidateQueries({ queryKey: TASKS_KEY }),
  })

  return (
    <TasksContext.Provider
      value={{
        tasks,
        toggleTask: async (id) => {
          await toggleMutation.mutateAsync(id)
        },
        addTask: async (payload) => {
          await addMutation.mutateAsync(payload)
        },
        updateTask: async (id, payload) => {
          await updateMutation.mutateAsync({ id, payload })
        },
        updateTaskCategory: async (id, categoryId) => {
          await updateCategoryMutation.mutateAsync({ id, categoryId })
        },
        updateTaskNote: async (id, description) => {
          await updateNoteMutation.mutateAsync({ id, description })
        },
        deleteTask: async (id) => {
          await deleteMutation.mutateAsync(id)
        },
      }}
    >
      {children}
    </TasksContext.Provider>
  )
}
